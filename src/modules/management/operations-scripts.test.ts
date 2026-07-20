import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

describe("backup and restore safety", () => {
  const backup = readFileSync(resolve("scripts/backup.ps1"), "utf8");
  const restore = readFileSync(resolve("scripts/restore.ps1"), "utf8");

  it("cleans incomplete artifacts and only prunes timestamped backup directories", () => {
    expect(backup).toContain("catch {");
    expect(backup).toContain("Remove-Item -LiteralPath $target");
    expect(backup).toContain("$_.Name -match");
    expect(backup).toContain("manifest.json");
  });

  it("writes artifact hashes and validates them before destructive restore", () => {
    expect(backup).toContain("Get-FileHash");
    expect(restore).toContain("Get-FileHash");
    expect(restore.indexOf("Get-FileHash")).toBeLessThan(restore.indexOf("pg_restore --clean"));
    expect(restore.indexOf("manifest.json")).toBeLessThan(restore.indexOf("pg_restore --clean"));
  });

  it("requires the database dump and every MinIO artifact in the checksum inventory", () => {
    expect(restore).toContain('$inventoryByPath.ContainsKey("postgres.dump")');
    expect(restore).toContain("Get-ChildItem -LiteralPath $minioBackup -File -Recurse");
    expect(restore).toContain("$inventoryByPath.ContainsKey($relativePath)");
    expect(restore.indexOf('$inventoryByPath.ContainsKey("postgres.dump")')).toBeLessThan(
      restore.indexOf("pg_restore --clean"),
    );
    expect(restore.indexOf("$inventoryByPath.ContainsKey($relativePath)")).toBeLessThan(
      restore.indexOf("pg_restore --clean"),
    );
  });

  it("supports explicit MinIO endpoint SSL configuration", () => {
    expect(backup).toContain("MINIO_USE_SSL");
    expect(restore).toContain("MINIO_USE_SSL");
  });
});
