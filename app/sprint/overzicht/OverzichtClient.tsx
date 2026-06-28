"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Sprint } from "@/lib/azure-devops";

interface SprintStatus {
  sprint: Sprint;
  reportId: string;
  published: boolean;
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
      {sprints.map(({ sprint, reportId, published }, i) => {
        const isGenerating = generating === sprint.id;
        const error = errors[sprint.id];
        const dateStr = sprint.finishDate
          ? new Date(sprint.finishDate).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })
          : "";

        return (
          <div key={sprint.id} className="header-card">
            <div style={{ padding: "18px 24px", display: "flex", alignItems: "center", gap: 16 }}>
              {/* Status dot */}
              <div style={{
                width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
                background: published ? "var(--green)" : "var(--border-strong)",
              }} />

              {/* Sprint info */}
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontFamily: "var(--serif)", fontSize: 18, color: "var(--text)" }}>
                    {sprint.name}
                  </span>
                  {i === 0 && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: "2px 7px",
                      borderRadius: 10, background: "var(--red-light)",
                      color: "var(--red)", border: "1px solid var(--red-border)",
                      letterSpacing: "0.06em", textTransform: "uppercase",
                    }}>
                      Meest recent
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{dateStr}</div>
                {error && <div style={{ fontSize: 12, color: "var(--red)", marginTop: 4 }}>{error}</div>}
              </div>

              {/* Action */}
              <div style={{ flexShrink: 0 }}>
                {published ? (
                  <a href={`/sprint/${reportId}`} className="btn-primary" style={{ display: "inline-block", textDecoration: "none" }}>
                    Bekijk rapport →
                  </a>
                ) : (
                  <button
                    className="btn-secondary"
                    onClick={() => handleGenerate(sprint)}
                    disabled={!!generating}
                    style={{ opacity: generating && !isGenerating ? 0.5 : 1 }}
                  >
                    {isGenerating ? "Genereren… (~15 sec)" : "Genereer rapport"}
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
