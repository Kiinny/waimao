"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LeadCsvImport({
  labels,
}: {
  labels: {
    label: string;
    placeholder: string;
    checking: string;
    preview: string;
    commit: string;
    imported: string;
    importFailed: string;
    validRows: string;
    rowError: string;
  };
}) {
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
        throw new Error(labels.importFailed);
      }
      if (commit) {
        setFeedback(
          labels.imported.replace(
            "{count}",
            String(result.data.imported ?? 0),
          ),
        );
        setCsv("");
        setPreview(null);
        router.refresh();
      } else {
        setPreview(result.data);
      }
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : labels.importFailed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="crm-form">
      <textarea
        aria-label={labels.label}
        onChange={(event) => {
          setCsv(event.target.value);
          setPreview(null);
        }}
        placeholder={labels.placeholder}
        rows={5}
        value={csv}
      />
      <div className="form-actions">
        <button className="button button-secondary" disabled={!csv || busy} onClick={() => request(false)} type="button">
          {busy ? labels.checking : labels.preview}
        </button>
        {preview && preview.errors.length === 0 ? (
          <button className="button" disabled={busy} onClick={() => request(true)} type="button">
            {labels.commit} {preview.validRows.length}
          </button>
        ) : null}
      </div>
      {preview ? (
        <p role="status">
          {labels.validRows
            .replace("{valid}", String(preview.validRows.length))
            .replace("{total}", String(preview.totalRows))}
          {preview.errors.map((error) =>
            ` ${labels.rowError
              .replace("{row}", String(error.row))
              .replace("{issues}", error.issues.join(", "))}`,
          )}
        </p>
      ) : null}
      {feedback ? <p role="status">{feedback}</p> : null}
    </div>
  );
}
