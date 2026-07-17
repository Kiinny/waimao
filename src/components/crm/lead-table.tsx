"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface LeadRow {
  id: string;
  companyName: string;
  contactName: string;
  countryCode: string;
  source: string;
  status: string;
  ownerName: string;
  createdAt: string;
}

export function LeadTable({
  locale,
  leads,
  emptyText,
}: {
  locale: string;
  leads: LeadRow[];
  emptyText: string;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [status, setStatus] = useState("CONTACTED");
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);

  async function batchUpdate() {
    if (!selected.length) return;
    if (!window.confirm(`Update ${selected.length} selected lead(s)?`)) return;
    setSaving(true);
    setFeedback("");
    try {
      const response = await fetch("/api/leads/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selected, status, confirmed: true }),
      });
      const result = (await response.json()) as {
        success: boolean;
        error?: { message?: string };
      };
      if (!response.ok || !result.success) {
        throw new Error(result.error?.message ?? "Batch update failed");
      }
      setFeedback("Selected leads updated.");
      setSelected([]);
      router.refresh();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Batch update failed");
    } finally {
      setSaving(false);
    }
  }

  if (!leads.length) return <div className="empty-state">{emptyText}</div>;
  return (
    <>
      <div className="batch-bar">
        <strong>{selected.length} selected</strong>
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="NEW">New</option>
          <option value="CONTACTED">Contacted</option>
          <option value="QUALIFIED">Qualified</option>
          <option value="LOST">Lost</option>
        </select>
        <button className="button button-secondary" disabled={!selected.length || saving} onClick={batchUpdate} type="button">
          {saving ? "Updating…" : "Apply status"}
        </button>
        {feedback ? <span role="status">{feedback}</span> : null}
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th aria-label="Select" />
              <th>Company</th>
              <th>Contact</th>
              <th>Country</th>
              <th>Source</th>
              <th>Status</th>
              <th>Owner</th>
              <th>Added</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id}>
                <td>
                  <input
                    aria-label={`Select ${lead.companyName}`}
                    checked={selected.includes(lead.id)}
                    onChange={(event) =>
                      setSelected((current) =>
                        event.target.checked
                          ? [...current, lead.id]
                          : current.filter((id) => id !== lead.id),
                      )
                    }
                    type="checkbox"
                  />
                </td>
                <td><Link className="table-link" href={`/${locale}/leads/${lead.id}`}>{lead.companyName}</Link></td>
                <td>{lead.contactName}</td>
                <td>{lead.countryCode}</td>
                <td>{lead.source}</td>
                <td><span className="badge">{lead.status}</span></td>
                <td>{lead.ownerName}</td>
                <td>{new Date(lead.createdAt).toLocaleDateString(locale)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
