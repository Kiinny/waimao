# Backup and Restore Runbook

Atlas backups contain a PostgreSQL custom-format dump, a mirror of the configured MinIO bucket, and a JSON manifest. Run backups from a trusted operator host with PostgreSQL client tools and the MinIO client (`mc`) installed.

## Configuration

Set `DATABASE_URL`, `MINIO_ENDPOINT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, and optionally `MINIO_BUCKET`, `MINIO_USE_SSL`, `BACKUP_ROOT`, and `BACKUP_RETENTION_DAYS`. `MINIO_ENDPOINT` may include an `http://` or `https://` scheme; when it does not, `MINIO_USE_SSL=true` selects HTTPS. The default bucket is `atlas-files`; the default retention is 30 days.

## Backup

```powershell
.\scripts\backup.ps1
```

The script rejects a filesystem root as `BACKUP_ROOT`, creates `BACKUP_ROOT/<UTC timestamp>/postgres.dump` and `minio/`, then writes `manifest.json` only after both artifacts succeed. The manifest inventories SHA-256 and byte length for every artifact. Failed runs remove their incomplete timestamp directory. Retention removes only completed, timestamp-named directories with a manifest whose direct parent is the configured root. Copy completed backups to separate encrypted storage and monitor both the script exit code and backup age.

## Restore

Restores replace database objects and mirror the stored bucket, including removal of objects not present in the backup. Before invoking either destructive tool, the script parses the manifest, rejects unsafe paths, checks that every listed artifact exists, and verifies every SHA-256 checksum. Stop the web and worker first, confirm the target connection strings, and run:

```powershell
.\scripts\restore.ps1 -BackupPath .\backups\20260720T020000Z -ConfirmRestore
```

After restore, run `pnpm prisma:generate`, start the application, sign in with a non-production recovery account, and verify customer, order, attachment, ticket, and audit-log samples.

## Quarterly restore drill

1. Select the newest completed backup and record its timestamp and manifest.
2. Restore into an isolated PostgreSQL database and MinIO bucket, never the live targets.
3. Verify migration history, table counts, one attachment checksum/download, one ticket relation, and one audit event.
4. Start web and worker against the isolated targets and complete login plus a read-only smoke test.
5. Record recovery point (backup age), recovery duration, discrepancies, and corrective actions.
6. Destroy the isolated drill environment and retain the drill record for one year.

Never treat an untested backup as recoverable.
