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
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 12,
      padding: 28,
    }}>
      <label style={{
        display: "block",
        fontSize: 13,
        color: "var(--text-muted)",
        fontWeight: 500,
        marginBottom: 10,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
      }}>
        Sprintdoel
      </label>
      <textarea
        value={goal}
        onChange={(e) => { setGoal(e.target.value); setStatus("idle"); }}
        placeholder="Wat was het doel van deze sprint?"
        rows={4}
        style={{
          width: "100%",
          background: "var(--bg)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          padding: "12px 14px",
          color: "var(--text)",
          fontFamily: "var(--font-sans)",
          fontSize: 15,
          lineHeight: 1.6,
          resize: "vertical",
          outline: "none",
        }}
        onFocus={(e) => (e.target.style.borderColor = "var(--hvc-red)")}
        onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
      />

      <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 16 }}>
        <button
          onClick={handleSave}
          disabled={status === "saving" || !goal.trim()}
          style={{
            background: status === "saving" ? "var(--hvc-red-dark)" : "var(--hvc-red)",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "10px 24px",
            fontSize: 14,
            fontWeight: 600,
            fontFamily: "var(--font-sans)",
            cursor: status === "saving" || !goal.trim() ? "not-allowed" : "pointer",
          }}
        >
          {status === "saving" ? "Opslaan…" : "Opslaan"}
        </button>

        {status === "saved" && (
          <span style={{ fontSize: 13, color: "var(--done)" }}>
            ✓ Sprintdoel opgeslagen
          </span>
        )}
        {status === "error" && (
          <span style={{ fontSize: 13, color: "var(--hvc-red)" }}>
            Opslaan mislukt, probeer opnieuw
          </span>
        )}
      </div>

      {currentGoal && status !== "saved" && (
        <p style={{ marginTop: 20, fontSize: 13, color: "var(--text-muted)", borderTop: "1px solid var(--border)", paddingTop: 16 }}>
          Huidig opgeslagen doel: <em style={{ color: "var(--text)" }}>{currentGoal}</em>
        </p>
      )}
    </div>
  );
}
