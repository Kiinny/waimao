"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LeadCsvImport() {
  const router = useRouter();
  const [csv, setCsv] = useState("");
  const [preview, setPreview] = useState<{
    totalRows: number;
    validRows: unknown[];
    errors: Array<{ row: number; issues: string[] }>;
  } | null>(null);
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);

  async function request(commit: boolean) {
    setBusy(true);
    setFeedback("");
    try {
      const response = await fetch("/api/leads/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv, commit }),
      });
      const result = (await response.json()) as {
        success: boolean;
        data?: typeof preview & { imported?: number };
        error?: { message?: string };
      };
      if (!response.ok || !result.success || !result.data) {
        throw new Error(result.error?.message ?? "CSV import failed");
      }
      if (commit) {
        setFeedback(`${result.data.imported ?? 0} leads imported.`);
        setCsv("");
        setPreview(null);
        router.refresh();
      } else {
        setPreview(result.data);
      }
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "CSV import failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="crm-form">
      <textarea
        aria-label="Lead CSV"
        onChange={(event) => {
          setCsv(event.target.value);
          setPreview(null);
        }}
        placeholder="companyName,contactName,email,phone,countryCode,source"
        rows={5}
        value={csv}
      />
      <div className="form-actions">
        <button className="button button-secondary" disabled={!csv || busy} onClick={() => request(false)} type="button">
          {busy ? "Checking…" : "Preview and validate"}
        </button>
        {preview && preview.errors.length === 0 ? (
          <button className="button" disabled={busy} onClick={() => request(true)} type="button">
            Commit {preview.validRows.length} rows
          </button>
        ) : null}
      </div>
      {preview ? (
        <p role="status">
          {preview.validRows.length} valid / {preview.totalRows} total.
          {preview.errors.map((error) => ` Row ${error.row}: ${error.issues.join(", ")}.`)}
        </p>
      ) : null}
      {feedback ? <p role="status">{feedback}</p> : null}
    </div>
  );
}
