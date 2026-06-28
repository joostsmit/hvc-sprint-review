"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ProcessedSprintData } from "@/lib/filters";
import type { Sprint } from "@/lib/azure-devops";

interface VelocityPoint { sprint: Sprint; totalEffort: number; }

interface Props {
  sprint: Sprint;
  data: ProcessedSprintData;
  aiSummary: string;
  velocity: VelocityPoint[];
  isDraft?: boolean;
  savedSprintGoal?: string;
}

function stateBadgeColor(state: string): "green" | "orange" | "red" {
  if (["Done", "Closed", "Resolved"].includes(state)) return "green";
  if (["Active", "In Progress", "Committed"].includes(state)) return "orange";
  return "red";
}

function VelocityChart({ data, currentSprintId }: { data: VelocityPoint[]; currentSprintId: string }) {
  const max = Math.max(...data.map((d) => d.totalEffort), 1);
  return (
    <div>
      <div className="list-header">
        <span className="pill blue" />
        Velocity — laatste 5 sprints
      </div>
      <div style={{ padding: "24px 20px 16px", display: "flex", alignItems: "flex-end", gap: 12, height: 140 }}>
        {data.map((point) => {
          const isCurrent = point.sprint.id === currentSprintId;
          const heightPct = (point.totalEffort / max) * 100;
          return (
            <div key={point.sprint.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: 1 }}>
              <span style={{ fontSize: 11, color: "var(--muted)", whiteSpace: "nowrap" }}>
                {point.totalEffort} SP
              </span>
              <div style={{
                width: "100%",
                height: `${Math.max(heightPct, 4)}%`,
                background: isCurrent ? "var(--red)" : "var(--surface2)",
                border: isCurrent ? "1px solid var(--red)" : "1px solid var(--border)",
                borderRadius: "4px 4px 0 0",
                minHeight: 4,
              }} />
              <span style={{ fontSize: 10, color: "var(--muted)", textAlign: "center", lineHeight: 1.2 }}>
                {point.sprint.name.replace(/.*Sprint\s*/i, "S")}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function SprintReport({ sprint, data, aiSummary, velocity, isDraft, savedSprintGoal }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const { pbis, bugs, uploadTasks, topdeskTasks, totalEffort, completedEffort, completedCount } = data;
  const doneBugs = bugs.filter((b) => ["Done", "Closed", "Resolved"].includes(b.state));

  const dateStr = sprint.finishDate
    ? new Date(sprint.finishDate).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })
    : "";

  async function handleSave() {
    if (!savedSprintGoal?.trim()) { setError("Stel eerst een sprintdoel in"); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/sprint/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sprint, data, aiSummary, velocity, sprintGoal: savedSprintGoal.trim() }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { id } = await res.json();
      router.push(`/sprint/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Opslaan mislukt");
      setSaving(false);
    }
  }

  return (
    <>
      {/* Topbar */}
      <div className="topbar">
        <div className="topbar-brand">
          <div className="topbar-logo">H</div>
          <span>HVC · Installaties &amp; Onderhoud</span>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>Sprint rapport · {dateStr}</span>
        </div>
        <div className="topbar-right">
          {isDraft && <span className="concept-badge">Concept</span>}
          {isDraft && (
            <a href="/sprint/beheer" style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", textDecoration: "none" }}>
              Sprintdoel instellen
            </a>
          )}
        </div>
      </div>

      <div className="page">
        {/* Hero */}
        <div className="hero">
          <div className="sprint-tag">Afgelopen sprint</div>
          <div className="hero-title">{sprint.name}</div>
          <div className="hero-subtitle">Domeinteam Installaties &amp; Onderhoud</div>
        </div>

        {/* Sprintdoel */}
        <div className="sprintdoel">
          <div className="doel-emoji">🎯</div>
          <div style={{ flex: 1 }}>
            <div className="doel-label">Sprintdoel</div>
            {isDraft ? (
              savedSprintGoal ? (
                <>
                  <div className="doel-text">{savedSprintGoal}</div>
                  <div className="doel-actions">
                    <button
                      className="btn-primary"
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? "Opslaan…" : "Goedkeuren en opslaan →"}
                    </button>
                    <a href="/sprint/beheer" className="btn-secondary">Sprintdoel wijzigen</a>
                    {error && <span style={{ fontSize: 12, color: "var(--red-bright)" }}>{error}</span>}
                  </div>
                </>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <span className="doel-text" style={{ color: "var(--muted)", fontStyle: "normal" }}>
                    Nog geen sprintdoel ingesteld.
                  </span>
                  <a href="/sprint/beheer" className="btn-primary" style={{ display: "inline-block", textDecoration: "none" }}>
                    Instellen →
                  </a>
                </div>
              )
            ) : (
              <div className="doel-text">{savedSprintGoal}</div>
            )}
          </div>
        </div>

        <div className="content">
          {/* AI Summary */}
          <div className="summary-block">
            <div className="block-label">
              <span className="accent">✦</span>
              AI-gegenereerde samenvatting
            </div>
            <div className="summary-text">{aiSummary}</div>
          </div>

          {/* Stats */}
          <div className="stats-row">
            <div className="stat-card green">
              <div className="stat-icon">✓</div>
              <div className="stat-value">{completedCount}</div>
              <div className="stat-label">Afgerond</div>
            </div>
            <div className="stat-card orange">
              <div className="stat-icon">↑</div>
              <div className="stat-value">{uploadTasks.length}</div>
              <div className="stat-label">Uploads</div>
            </div>
            <div className="stat-card blue">
              <div className="stat-icon">T</div>
              <div className="stat-value">{topdeskTasks.length}</div>
              <div className="stat-label">Topdesk</div>
            </div>
            <div className="stat-card red">
              <div className="stat-icon">⚑</div>
              <div className="stat-value">{doneBugs.length}/{bugs.length}</div>
              <div className="stat-label">Bugs</div>
            </div>
            <div className="stat-card blue">
              <div className="stat-icon">◈</div>
              <div className="stat-value">{completedEffort} / {totalEffort}</div>
              <div className="stat-label">Gepland / Afgerond</div>
            </div>
          </div>

          {/* Two-column list */}
          <div className="two-col">
            {/* Left: PBIs */}
            <div className="col">
              <div className="list-card">
                <div className="list-header">
                  <span className="pill red" />
                  Product Backlog Items
                </div>
                {pbis.length === 0 ? (
                  <div className="list-item"><span className="item-name" style={{ color: "var(--muted)" }}>Geen PBI&apos;s</span></div>
                ) : pbis.map((item) => (
                  <div key={item.id} className="list-item">
                    <span className="item-name">{item.title}</span>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                      {item.effort != null && (
                        <span className="item-badge blue">{item.effort} SP</span>
                      )}
                      <span className={`item-badge ${stateBadgeColor(item.state)}`}>{item.state}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Topdesk + Bugs */}
            <div className="col">
              {topdeskTasks.length > 0 && (
                <div className="list-card">
                  <div className="list-header">
                    <span className="pill blue" />
                    TOPdesk-taken
                  </div>
                  {topdeskTasks.map((item) => (
                    <div key={item.id} className="list-item">
                      <span className="item-name">{item.title}</span>
                      <span className={`item-badge ${stateBadgeColor(item.state)}`}>{item.state}</span>
                    </div>
                  ))}
                </div>
              )}

              {bugs.length > 0 && (
                <div className="list-card">
                  <div className="list-header">
                    <span className="pill red" />
                    Bugs
                  </div>
                  {bugs.map((item) => (
                    <div key={item.id} className="list-item">
                      <span className="item-name">{item.title}</span>
                      <span className={`item-badge ${stateBadgeColor(item.state)}`}>{item.state}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Velocity */}
          <div className="velocity-card">
            <VelocityChart data={velocity} currentSprintId={sprint.id} />
          </div>
        </div>

        {/* Footer */}
        <div className="footer">
          <span className="footer-text">HVC · Installaties &amp; Onderhoud · {dateStr}</span>
          <span className="ai-tag">✦ Gegenereerd met AI (Claude)</span>
        </div>
      </div>
    </>
  );
}
