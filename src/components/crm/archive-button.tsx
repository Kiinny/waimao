"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ArchiveButton({
  endpoint,
  labels,
}: {
  endpoint: string;
  labels: {
    archive: string;
    archiving: string;
    confirm: string;
    success: string;
    failure: string;
  };
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");

  async function archive() {
    if (!window.confirm(labels.confirm)) return;
    setBusy(true);
    setFeedback("");
    try {
      const response = await fetch(endpoint, { method: "DELETE" });
      const result = (await response.json()) as { success: boolean };
      if (!response.ok || !result.success) throw new Error(labels.failure);
      setFeedback(labels.success);
      router.refresh();
    } catch {
      setFeedback(labels.failure);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="inline-action">
      <button
        className="button button-danger"
        disabled={busy}
        onClick={archive}
        type="button"
      >
        {busy ? labels.archiving : labels.archive}
      </button>
      {feedback ? <span role="status">{feedback}</span> : null}
    </div>
  );
}
