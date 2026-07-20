param(
  [Parameter(Mandatory = $true)]
  [string]$BackupPath,
  [switch]$ConfirmRestore
)

$ErrorActionPreference = "Stop"
if (-not $ConfirmRestore) {
  throw "Restore is destructive. Re-run with -ConfirmRestore after verifying the target environment."
}
if (-not $env:DATABASE_URL) { throw "DATABASE_URL is required." }
if (-not $env:MINIO_ENDPOINT -or -not $env:MINIO_ACCESS_KEY -or -not $env:MINIO_SECRET_KEY) {
  throw "MINIO_ENDPOINT, MINIO_ACCESS_KEY, and MINIO_SECRET_KEY are required."
}

$source = [System.IO.Path]::GetFullPath($BackupPath)
if (-not (Test-Path -LiteralPath $source -PathType Container)) { throw "Backup directory was not found." }
$manifestPath = Join-Path $source "manifest.json"
if (-not (Test-Path -LiteralPath $manifestPath -PathType Leaf)) { throw "manifest.json was not found." }
try {
  $manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
} catch {
  throw "manifest.json is invalid JSON."
}
if ($manifest.version -ne 1 -or $manifest.database -ne "postgres.dump" -or $manifest.minioDirectory -ne "minio") {
  throw "Backup manifest is unsupported or incomplete."
}
if (-not $manifest.files -or -not $manifest.minioBucket) { throw "Backup manifest has no integrity inventory." }

$databaseDump = Join-Path $source $manifest.database
$minioBackup = Join-Path $source $manifest.minioDirectory
if (-not (Test-Path -LiteralPath $databaseDump -PathType Leaf)) { throw "postgres.dump was not found." }
if (-not (Test-Path -LiteralPath $minioBackup -PathType Container)) { throw "MinIO backup directory was not found." }

$inventoryByPath = @{}
foreach ($file in $manifest.files) {
  if (-not $file.path -or $file.path -match "(^|/)\.\.(/|$)" -or [System.IO.Path]::IsPathRooted([string]$file.path)) {
    throw "Backup manifest contains an unsafe file path."
  }
  $relativePath = ([string]$file.path).Replace("\", "/")
  if ($inventoryByPath.ContainsKey($relativePath)) {
    throw "Backup manifest contains a duplicate artifact: $relativePath"
  }
  $inventoryByPath[$relativePath] = $file
  $artifactPath = [System.IO.Path]::GetFullPath((Join-Path $source $relativePath))
  if (-not $artifactPath.StartsWith($source + [System.IO.Path]::DirectorySeparatorChar)) {
    throw "Backup manifest artifact escaped the backup directory."
  }
  if (-not (Test-Path -LiteralPath $artifactPath -PathType Leaf)) {
    throw "Backup artifact is missing: $($file.path)"
  }
  $actualHash = (Get-FileHash -LiteralPath $artifactPath -Algorithm SHA256).Hash.ToLowerInvariant()
  if ($actualHash -ne ([string]$file.sha256).ToLowerInvariant()) {
    throw "Backup artifact checksum failed: $($file.path)"
  }
}
if (-not $inventoryByPath.ContainsKey("postgres.dump")) {
  throw "Backup manifest does not inventory postgres.dump."
}
foreach ($minioArtifact in Get-ChildItem -LiteralPath $minioBackup -File -Recurse) {
  $relativePath = [System.IO.Path]::GetRelativePath($source, $minioArtifact.FullName).Replace("\", "/")
  if (-not $inventoryByPath.ContainsKey($relativePath)) {
    throw "Backup manifest does not inventory MinIO artifact: $relativePath"
  }
}

if (-not (Get-Command pg_restore -ErrorAction SilentlyContinue)) { throw "pg_restore is not installed or not on PATH." }
if (-not (Get-Command mc -ErrorAction SilentlyContinue)) { throw "MinIO client 'mc' is not installed or not on PATH." }

function Resolve-MinIoEndpoint {
  $endpoint = $env:MINIO_ENDPOINT.TrimEnd("/")
  if ($endpoint -notmatch "^https?://") {
    $scheme = if ($env:MINIO_USE_SSL -match "^(1|true|yes)$") { "https" } else { "http" }
    $endpoint = "${scheme}://${endpoint}"
  }
  return $endpoint
}

& pg_restore --clean --if-exists --no-owner --dbname=$env:DATABASE_URL $databaseDump
if ($LASTEXITCODE -ne 0) { throw "PostgreSQL restore failed." }

$endpoint = Resolve-MinIoEndpoint
& mc alias set atlas-restore $endpoint $env:MINIO_ACCESS_KEY $env:MINIO_SECRET_KEY
if ($LASTEXITCODE -ne 0) { throw "MinIO alias configuration failed." }
$bucket = if ($env:MINIO_BUCKET) { $env:MINIO_BUCKET } else { $manifest.minioBucket }
& mc mb --ignore-existing "atlas-restore/$bucket"
if ($LASTEXITCODE -ne 0) { throw "MinIO bucket creation failed." }
& mc mirror --overwrite --remove $minioBackup "atlas-restore/$bucket"
if ($LASTEXITCODE -ne 0) { throw "MinIO restore failed." }

Write-Host "Restore completed from validated backup: $source"
