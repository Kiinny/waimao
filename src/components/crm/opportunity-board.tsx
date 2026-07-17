"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const stages = [
  "QUALIFICATION",
  "DISCOVERY",
  "PROPOSAL",
  "NEGOTIATION",
  "WON",
  "LOST",
] as const;

interface OpportunityCard {
  id: string;
  name: string;
  stage: string;
  valueUsd: string;
  probability: number;
  customerName: string;
  ownerName: string;
}

export function OpportunityBoard({
  opportunities,
  labels,
}: {
  opportunities: OpportunityCard[];
  labels: {
    stagePrompt: string;
    stageFailed: string;
    stageMoved: string;
    moving: string;
    stages: Record<string, string>;
  };
}) {
  const router = useRouter();
  const [feedback, setFeedback] = useState("");
  const [moving, setMoving] = useState("");

  async function move(id: string, stage: string) {
    const current = opportunities.find((item) => item.id === id);
    if (!current || current.stage === stage) return;
    const lossReason =
      stage === "LOST"
        ? window.prompt(labels.stagePrompt)
        : undefined;
    if (stage === "LOST" && !lossReason?.trim()) return;
    setMoving(id);
    setFeedback("");
    try {
      const response = await fetch(`/api/opportunities/${id}/stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage, lossReason }),
      });
      const result = (await response.json()) as {
        success: boolean;
        error?: { message?: string };
      };
      if (!response.ok || !result.success) {
        throw new Error(labels.stageFailed);
      }
      setFeedback(labels.stageMoved);
      router.refresh();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : labels.stageFailed);
    } finally {
      setMoving("");
    }
  }

  return (
    <>
      {feedback ? <p className="form-feedback" role="status">{feedback}</p> : null}
      <div className="kanban">
        {stages.map((stage) => (
          <section
            className="kanban-column"
            key={stage}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => move(event.dataTransfer.getData("text/plain"), stage)}
          >
            <h2>{labels.stages[stage]}</h2>
            {opportunities.filter((item) => item.stage === stage).map((item) => (
              <article
                className="opportunity-card"
                draggable
                key={item.id}
                onDragStart={(event) => event.dataTransfer.setData("text/plain", item.id)}
              >
                <strong>{item.name}</strong>
                <span>{item.customerName}</span>
                <span>${Number(item.valueUsd).toLocaleString()} · {item.probability}%</span>
                <span>{item.ownerName}</span>
                {moving === item.id ? <small>{labels.moving}</small> : null}
              </article>
            ))}
          </section>
        ))}
      </div>
    </>
  );
}
