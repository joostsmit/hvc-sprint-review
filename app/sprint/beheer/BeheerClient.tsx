"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DraftReport } from "@/lib/blob-store";

interface Props {
  sprintId: string;
  currentGoal: string;
  draft: DraftReport | null;
}

export default function BeheerClient({ sprintId, currentGoal, draft }: Props) {
  const router = useRouter();
  const [goal, setGoal] = useState(currentGoal);
  const [goalStatus, setGoalStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [publishStatus, setPublishStatus] = useState<"idle" | "saving" | "error">("idle");
  const [publishError, setPublishError] = useState("");

  async function handleSaveGoal() {
    if (!goal.trim()) return;
    setGoalStatus("saving");
    try {
      const res = await fetch("/api/sprint/goal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sprintId, goal: goal.trim() }),
      });
      if (!res.ok) throw new Error(await res.text());
      setGoalStatus("saved");
    } catch {
      setGoalStatus("error");
    }
  }

  async function handlePublish() {
    const effectiveGoal = goalStatus === "saved" ? goal.trim() : currentGoal;
    if (!effectiveGoal) { setPublishError("Sla eerst een sprintdoel op."); return; }
    if (!draft) { setPublishError("Geen concept beschikbaar. Bezoek eerst /sprint om data te laden."); return; }

    setPublishStatus("saving");
    setPublishError("");
    try {
      const res = await fetch("/api/sprint/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sprint: draft.sprint,
          data: draft.processedData,
          aiSummary: draft.aiSummary,
          velocity: draft.velocityData,
          sprintGoal: effectiveGoal,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { id } = await res.json();
      router.push(`/sprint/${id}`);
    } catch (e) {
      setPublishError(e instanceof Error ? e.message : "Publiceren mislukt");
      setPublishStatus("error");
    }
  }

  const hasGoal = goalStatus === "saved" ? !!goal.trim() : !!currentGoal;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Sprintdoel */}
      <div className="header-card">
        <div style={{ padding: "20px 24px 24px" }}>
          <div className="block-label" style={{ marginBottom: 14 }}>🎯 Sprintdoel</div>
          <textarea
            className="doel-input"
            value={goal}
            onChange={e => { setGoal(e.target.value); setGoalStatus("idle"); }}
            placeholder="Wat was het doel van deze sprint?"
            rows={3}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
            <button className="btn-primary" onClick={handleSaveGoal} disabled={goalStatus === "saving" || !goal.trim()}>
              {goalStatus === "saving" ? "Opslaan…" : "Sprintdoel opslaan"}
            </button>
            {goalStatus === "saved" && <span style={{ fontSize: 13, color: "var(--green)" }}>✓ Opgeslagen</span>}
            {goalStatus === "error" && <span style={{ fontSize: 13, color: "var(--red)" }}>Opslaan mislukt</span>}
          </div>
          {currentGoal && goalStatus !== "saved" && (
            <p style={{ marginTop: 14, fontSize: 12, color: "var(--muted)", borderTop: "1px solid var(--border)", paddingTop: 12 }}>
              Huidig opgeslagen doel: <em style={{ color: "var(--text-2)" }}>{currentGoal}</em>
            </p>
          )}
        </div>
      </div>

      {/* Rapport publiceren */}
      <div className="header-card">
        <div style={{ padding: "20px 24px 24px" }}>
          <div className="block-label" style={{ marginBottom: 8 }}>📤 Rapport publiceren</div>
          <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6, marginBottom: 16 }}>
            Sla het rapport definitief op met het sprintdoel. Je krijgt een vaste link die je in Outlook kunt plakken voor stakeholders.
            {draft && (
              <span style={{ display: "block", marginTop: 6, fontSize: 12, color: "var(--muted)" }}>
                Concept gegenereerd op: {new Date(draft.generatedAt).toLocaleString("nl-NL")}
              </span>
            )}
            {!draft && (
              <span style={{ display: "block", marginTop: 6, fontSize: 12, color: "var(--orange)" }}>
                ⚠ Nog geen concept. Bezoek eerst <a href="/sprint">/sprint</a> om data te laden.
              </span>
            )}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              className="btn-primary"
              onClick={handlePublish}
              disabled={publishStatus === "saving" || !hasGoal || !draft}
              style={{ opacity: (!hasGoal || !draft) ? 0.5 : 1 }}
            >
              {publishStatus === "saving" ? "Publiceren…" : "Goedkeuren en publiceren →"}
            </button>
            {!hasGoal && <span style={{ fontSize: 12, color: "var(--muted)" }}>Stel eerst een sprintdoel in</span>}
          </div>
          {publishError && <p style={{ marginTop: 10, fontSize: 13, color: "var(--red)" }}>{publishError}</p>}
        </div>
      </div>

    </div>
  );
}
