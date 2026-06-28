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
              <div style={{
                width: 10, height: 10, borderRadius: "50%", flexShrink: 0, marginTop: 6,
                background: published ? "var(--green)" : "var(--border-strong)",
              }} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
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

                {sprintGoal
                  ? <p style={{ fontSize: 12, color: "var(--text-2)", fontStyle: "italic" }}>{sprintGoal}</p>
                  : <p style={{ fontSize: 12, color: "var(--muted)" }}>Geen sprintdoel — <a href="/sprint/beheer">instellen via beheer</a></p>
                }

                {error && <div style={{ fontSize: 12, color: "var(--red)", marginTop: 4 }}>{error}</div>}
              </div>

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

      <p style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", paddingTop: 8 }}>
        Sprintdoelen instellen of wijzigen kan via <a href="/sprint/beheer">Beheer</a>.
      </p>
    </div>
  );
}
