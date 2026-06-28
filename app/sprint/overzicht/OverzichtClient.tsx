"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Sprint } from "@/lib/azure-devops";

interface SprintStatus {
  sprint: Sprint;
  reportId: string;
  published: boolean;
  sprintGoal: string | null;
}

function GoalEditor({ sprintId, initialGoal }: { sprintId: string; initialGoal: string | null }) {
  const [open, setOpen] = useState(false);
  const [goal, setGoal] = useState(initialGoal ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function handleSave() {
    setStatus("saving");
    try {
      const res = await fetch("/api/sprint/goal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sprintId, goal: goal.trim() }),
      });
      if (!res.ok) throw new Error(await res.text());
      setStatus("saved");
      setOpen(false);
    } catch {
      setStatus("error");
    }
  }

  if (!open) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {initialGoal || status === "saved" ? (
          <span style={{ fontSize: 12, color: "var(--text-2)", fontStyle: "italic", flex: 1 }}>
            {goal || initialGoal}
          </span>
        ) : (
          <span style={{ fontSize: 12, color: "var(--muted)", flex: 1 }}>Geen sprintdoel ingesteld</span>
        )}
        <button
          className="btn-secondary"
          style={{ fontSize: 11, padding: "4px 10px" }}
          onClick={() => setOpen(true)}
        >
          {initialGoal || status === "saved" ? "Wijzigen" : "Instellen"}
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <textarea
        className="doel-input"
        value={goal}
        onChange={e => { setGoal(e.target.value); setStatus("idle"); }}
        placeholder="Wat was het doel van deze sprint?"
        rows={2}
        style={{ fontSize: 13 }}
        autoFocus
      />
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button className="btn-primary" style={{ fontSize: 12, padding: "6px 14px" }}
          onClick={handleSave} disabled={status === "saving" || !goal.trim()}>
          {status === "saving" ? "Opslaan…" : "Opslaan"}
        </button>
        <button className="btn-secondary" style={{ fontSize: 12, padding: "6px 10px" }}
          onClick={() => { setOpen(false); setStatus("idle"); }}>
          Annuleren
        </button>
        {status === "error" && <span style={{ fontSize: 12, color: "var(--red)" }}>Mislukt</span>}
      </div>
    </div>
  );
}

export default function OverzichtClient({ sprints }: { sprints: SprintStatus[] }) {
  const router = useRouter();
  const [generating, setGenerating] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleGenerate(sprint: Sprint) {
    setGenerating(sprint.id);
    setErrors(prev => ({ ...prev, [sprint.id]: "" }));
    try {
      const res = await fetch("/api/sprint/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sprintId: sprint.id }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { id } = await res.json();
      router.push(`/sprint/${id}`);
    } catch (e) {
      setErrors(prev => ({ ...prev, [sprint.id]: e instanceof Error ? e.message : "Genereren mislukt" }));
      setGenerating(null);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {sprints.map(({ sprint, reportId, published, sprintGoal }, i) => {
        const isGenerating = generating === sprint.id;
        const error = errors[sprint.id];
        const dateStr = sprint.finishDate
          ? new Date(sprint.finishDate).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })
          : "";

        return (
          <div key={sprint.id} className="header-card">
            <div style={{ padding: "16px 24px", display: "flex", alignItems: "flex-start", gap: 14 }}>
              {/* Status dot */}
              <div style={{
                width: 10, height: 10, borderRadius: "50%", flexShrink: 0, marginTop: 6,
                background: published ? "var(--green)" : "var(--border-strong)",
              }} />

              {/* Sprint info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <span style={{ fontFamily: "var(--serif)", fontSize: 18, color: "var(--text)" }}>
                    {sprint.name}
                  </span>
                  {i === 0 && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 10,
                      background: "var(--red-light)", color: "var(--red)",
                      border: "1px solid var(--red-border)", letterSpacing: "0.06em", textTransform: "uppercase",
                    }}>
                      Meest recent
                    </span>
                  )}
                  <span style={{ fontSize: 12, color: "var(--muted)", marginLeft: "auto" }}>{dateStr}</span>
                </div>

                {/* Sprintdoel editor */}
                <GoalEditor sprintId={sprint.id} initialGoal={sprintGoal} />

                {error && <div style={{ fontSize: 12, color: "var(--red)", marginTop: 6 }}>{error}</div>}
              </div>

              {/* Action */}
              <div style={{ flexShrink: 0, marginTop: 2 }}>
                {published ? (
                  <a href={`/sprint/${reportId}`} className="btn-primary"
                    style={{ display: "inline-block", textDecoration: "none" }}>
                    Bekijk rapport →
                  </a>
                ) : (
                  <button className="btn-secondary" onClick={() => handleGenerate(sprint)}
                    disabled={!!generating} style={{ opacity: generating && !isGenerating ? 0.5 : 1 }}>
                    {isGenerating ? "Genereren…" : "Genereer rapport"}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
