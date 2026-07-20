param(
  [string]$BackupRoot = $(if ($env:BACKUP_ROOT) { $env:BACKUP_ROOT } else { ".\backups" }),
  [int]$RetentionDays = $(if ($env:BACKUP_RETENTION_DAYS) { [int]$env:BACKUP_RETENTION_DAYS } else { 30 })
)

$ErrorActionPreference = "Stop"
if ($RetentionDays -lt 1) { throw "RetentionDays must be at least 1." }
if (-not $env:DATABASE_URL) { throw "DATABASE_URL is required." }
if (-not $env:MINIO_ENDPOINT -or -not $env:MINIO_ACCESS_KEY -or -not $env:MINIO_SECRET_KEY) {
  throw "MINIO_ENDPOINT, MINIO_ACCESS_KEY, and MINIO_SECRET_KEY are required."
}
if (-not (Get-Command pg_dump -ErrorAction SilentlyContinue)) { throw "pg_dump is not installed or not on PATH." }
if (-not (Get-Command mc -ErrorAction SilentlyContinue)) { throw "MinIO client 'mc' is not installed or not on PATH." }

$root = [System.IO.Path]::GetFullPath($BackupRoot).TrimEnd(
  [System.IO.Path]::DirectorySeparatorChar,
  [System.IO.Path]::AltDirectorySeparatorChar
)
$volumeRoot = [System.IO.Path]::GetPathRoot($root).TrimEnd(
  [System.IO.Path]::DirectorySeparatorChar,
  [System.IO.Path]::AltDirectorySeparatorChar
)
if (-not $root -or $root -eq $volumeRoot) {
  throw "BackupRoot must be a dedicated directory, not a filesystem root."
}
New-Item -ItemType Directory -Force -Path $root | Out-Null

$stamp = (Get-Date).ToUniversalTime().ToString("yyyyMMddTHHmmssZ")
$target = Join-Path $root $stamp
$targetFull = [System.IO.Path]::GetFullPath($target)
if ([System.IO.Path]::GetDirectoryName($targetFull) -ne $root) {
  throw "Backup target escaped BackupRoot."
}
New-Item -ItemType Directory -Path $targetFull | Out-Null

function Resolve-MinIoEndpoint {
  $endpoint = $env:MINIO_ENDPOINT.TrimEnd("/")
  if ($endpoint -notmatch "^https?://") {
    $scheme = if ($env:MINIO_USE_SSL -match "^(1|true|yes)$") { "https" } else { "http" }
    $endpoint = "${scheme}://${endpoint}"
  }
  return $endpoint
}

try {
  $databasePath = Join-Path $targetFull "postgres.dump"
  & pg_dump --format=custom --file=$databasePath $env:DATABASE_URL
  if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $databasePath -PathType Leaf)) {
    throw "PostgreSQL backup failed."
  }

  $endpoint = Resolve-MinIoEndpoint
  & mc alias set atlas-backup $endpoint $env:MINIO_ACCESS_KEY $env:MINIO_SECRET_KEY
  if ($LASTEXITCODE -ne 0) { throw "MinIO alias configuration failed." }
  $bucket = if ($env:MINIO_BUCKET) { $env:MINIO_BUCKET } else { "atlas-files" }
  $minioPath = Join-Path $targetFull "minio"
  New-Item -ItemType Directory -Path $minioPath | Out-Null
  & mc mirror --overwrite "atlas-backup/$bucket" $minioPath
  if ($LASTEXITCODE -ne 0) { throw "MinIO backup failed." }

  $files = Get-ChildItem -LiteralPath $targetFull -File -Recurse | ForEach-Object {
    @{
      path = [System.IO.Path]::GetRelativePath($targetFull, $_.FullName).Replace("\", "/")
      sha256 = (Get-FileHash -LiteralPath $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
      sizeBytes = $_.Length
    }
  }
  $manifest = @{
    version = 1
    createdAt = (Get-Date).ToUniversalTime().ToString("o")
    database = "postgres.dump"
    minioDirectory = "minio"
    minioBucket = $bucket
    retentionDays = $RetentionDays
    files = @($files)
  } | ConvertTo-Json -Depth 5
  Set-Content -LiteralPath (Join-Path $targetFull "manifest.json") -Value $manifest -Encoding utf8
} catch {
  if ((Test-Path -LiteralPath $targetFull) -and [System.IO.Path]::GetDirectoryName($targetFull) -eq $root) {
    Remove-Item -LiteralPath $targetFull -Recurse -Force
  }
  throw
}

$cutoff = (Get-Date).ToUniversalTime().AddDays(-$RetentionDays)
Get-ChildItem -LiteralPath $root -Directory |
  Where-Object {
    $_.Name -match "^\d{8}T\d{6}Z$" -and
    $_.LastWriteTimeUtc -lt $cutoff -and
    [System.IO.Path]::GetDirectoryName($_.FullName) -eq $root -and
    (Test-Path -LiteralPath (Join-Path $_.FullName "manifest.json") -PathType Leaf)
  } |
  ForEach-Object { Remove-Item -LiteralPath $_.FullName -Recurse -Force }

Write-Host "Backup completed: $targetFull"
