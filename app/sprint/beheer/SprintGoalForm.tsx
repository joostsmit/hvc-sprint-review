"use client";

import { useState } from "react";

interface Props {
  sprintId: string;
  currentGoal: string;
}

export default function SprintGoalForm({ sprintId, currentGoal }: Props) {
  const [goal, setGoal] = useState(currentGoal);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function handleSave() {
    if (!goal.trim()) return;
    setStatus("saving");
    try {
      const res = await fetch("/api/sprint/goal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sprintId, goal: goal.trim() }),
      });
      if (!res.ok) throw new Error(await res.text());
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="summary-block" style={{ borderLeft: "4px solid var(--red)" }}>
      <div className="block-label">
        <span className="accent">🎯</span>
        Sprintdoel
      </div>

      <textarea
        className="doel-input"
        value={goal}
        onChange={(e) => { setGoal(e.target.value); setStatus("idle"); }}
        placeholder="Wat was het doel van deze sprint?"
        rows={4}
      />

      <div className="doel-actions">
        <button
          className="btn-primary"
          onClick={handleSave}
          disabled={status === "saving" || !goal.trim()}
        >
          {status === "saving" ? "Opslaan…" : "Opslaan"}
        </button>

        {status === "saved" && (
          <span style={{ fontSize: 13, color: "var(--green)" }}>✓ Sprintdoel opgeslagen</span>
        )}
        {status === "error" && (
          <span style={{ fontSize: 13, color: "var(--red-bright)" }}>Opslaan mislukt</span>
        )}

        <a href="/sprint" className="btn-secondary">← Terug naar rapport</a>
      </div>

      {currentGoal && status !== "saved" && (
        <p style={{ marginTop: 16, fontSize: 12, color: "var(--muted)", borderTop: "1px solid var(--border)", paddingTop: 14 }}>
          Huidig: <em style={{ color: "var(--text)" }}>{currentGoal}</em>
        </p>
      )}
    </div>
  );
}
