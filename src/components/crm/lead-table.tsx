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
  ownerId: string;
  ownerName: string;
  createdAt: string;
}

export function LeadTable({
  locale,
  leads,
  emptyText,
  canAssign,
  labels,
}: {
  locale: string;
  leads: LeadRow[];
  emptyText: string;
  canAssign: boolean;
  labels: {
    selected: string;
    confirmBatch: string;
    updating: string;
    applyStatus: string;
    assignOwner: string;
    selectOwner: string;
    batchUpdated: string;
    batchFailed: string;
    select: string;
    company: string;
    contact: string;
    country: string;
    source: string;
    status: string;
    owner: string;
    added: string;
    statuses: Record<string, string>;
  };
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [status, setStatus] = useState("CONTACTED");
  const [ownerId, setOwnerId] = useState("");
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);

  const owners = [
    ...new Map(
      leads.map((lead) => [lead.ownerId, { id: lead.ownerId, name: lead.ownerName }]),
    ).values(),
  ];

  async function batchUpdate(input: { status?: string; ownerId?: string }) {
    if (!selected.length) return;
    if (
      !window.confirm(
        labels.confirmBatch.replace("{count}", String(selected.length)),
      )
    ) return;
    setSaving(true);
    setFeedback("");
    try {
      const response = await fetch("/api/leads/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selected, ...input, confirmed: true }),
      });
      const result = (await response.json()) as {
        success: boolean;
      };
      if (!response.ok || !result.success) {
        throw new Error(labels.batchFailed);
      }
      setFeedback(labels.batchUpdated);
      setSelected([]);
      router.refresh();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : labels.batchFailed);
    } finally {
      setSaving(false);
    }
  }

  if (!leads.length) return <div className="empty-state">{emptyText}</div>;
  return (
    <>
      <div className="batch-bar">
        <strong>{selected.length} {labels.selected}</strong>
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          {["NEW", "CONTACTED", "QUALIFIED", "LOST"].map((value) => (
            <option key={value} value={value}>{labels.statuses[value]}</option>
          ))}
        </select>
        <button className="button button-secondary" disabled={!selected.length || saving} onClick={() => batchUpdate({ status })} type="button">
          {saving ? labels.updating : labels.applyStatus}
        </button>
        {canAssign ? (
          <>
            <select value={ownerId} onChange={(event) => setOwnerId(event.target.value)}>
              <option value="">{labels.selectOwner}</option>
              {owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.name}</option>)}
            </select>
            <button className="button button-secondary" disabled={!selected.length || !ownerId || saving} onClick={() => batchUpdate({ ownerId })} type="button">
              {saving ? labels.updating : labels.assignOwner}
            </button>
          </>
        ) : null}
        {feedback ? <span role="status">{feedback}</span> : null}
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th aria-label={labels.select} />
              <th>{labels.company}</th>
              <th>{labels.contact}</th>
              <th>{labels.country}</th>
              <th>{labels.source}</th>
              <th>{labels.status}</th>
              <th>{labels.owner}</th>
              <th>{labels.added}</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id}>
                <td>
                  <input
                    aria-label={`${labels.select} ${lead.companyName}`}
                    checked={selected.includes(lead.id)}
                    disabled={lead.status === "CONVERTED"}
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
                <td><span className="badge">{labels.statuses[lead.status] ?? lead.status}</span></td>
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
