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

function badgeColor(state: string): "green" | "orange" | "red" | "gray" {
  if (["Done", "Closed", "Resolved"].includes(state)) return "green";
  if (["Active", "In Progress", "Committed"].includes(state)) return "orange";
  if (["New", "To Do"].includes(state)) return "gray";
  return "gray";
}

function Section({
  dot, title, count, colorClass, defaultOpen = false, children,
}: {
  dot: string; title: string; count: number; colorClass: string; defaultOpen?: boolean; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="section-card">
      <button className="section-toggle" onClick={() => setOpen(!open)}>
        <span className={`section-toggle-dot ${colorClass}`} />
        <span className="section-title">{title}</span>
        <span className="section-count">{count}</span>
        <span className={`section-chevron${open ? " open" : ""}`}>▼</span>
      </button>
      {open && <div className="section-body">{children}</div>}
    </div>
  );
}

function VelocityChart({ data, currentSprintId }: { data: VelocityPoint[]; currentSprintId: string }) {
  const max = Math.max(...data.map((d) => d.totalEffort), 1);
  return (
    <div className="velocity-body" style={{ display: "flex", alignItems: "flex-end", gap: 10, height: 120 }}>
      {data.map((point) => {
        const isCurrent = point.sprint.id === currentSprintId;
        const heightPct = Math.max((point.totalEffort / max) * 100, 4);
        return (
          <div key={point.sprint.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, flex: 1 }}>
            <span style={{ fontSize: 10, color: "var(--muted)", whiteSpace: "nowrap" }}>{point.totalEffort} SP</span>
            <div style={{
              width: "100%",
              height: `${heightPct}%`,
              background: isCurrent ? "var(--red)" : "var(--bg)",
              border: `1px solid ${isCurrent ? "var(--red)" : "var(--border)"}`,
              borderRadius: "3px 3px 0 0",
              minHeight: 4,
            }} />
            <span style={{ fontSize: 10, color: "var(--muted)", textAlign: "center", lineHeight: 1.2 }}>
              {point.sprint.name.replace(/.*Sprint\s*/i, "S")}
            </span>
          </div>
        );
      })}
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
          <span>HVC</span>
          <span className="topbar-sep">·</span>
          <span className="topbar-sub">Installaties &amp; Onderhoud</span>
        </div>
        <div className="topbar-right">
          {isDraft && <span className="concept-badge">Concept</span>}
          {isDraft && (
            <a href="/sprint/beheer" className="topbar-link">Sprintdoel instellen</a>
          )}
        </div>
      </div>

      <div className="page">
        {/* Hero */}
        <div className="hero">
          <div className="sprint-tag">Afgelopen sprint · {dateStr}</div>
          <div className="hero-title">{sprint.name}</div>
          <div className="hero-subtitle">Domeinteam Installaties &amp; Onderhoud</div>
        </div>

        {/* Sprintdoel */}
        <div className="sprintdoel">
          <div className="doel-emoji">🎯</div>
          <div className="doel-inner">
            <div className="doel-label">Sprintdoel</div>
            {isDraft ? (
              savedSprintGoal ? (
                <>
                  <div className="doel-text">{savedSprintGoal}</div>
                  <div className="doel-actions">
                    <button className="btn-primary" onClick={handleSave} disabled={saving}>
                      {saving ? "Opslaan…" : "Goedkeuren en opslaan →"}
                    </button>
                    <a href="/sprint/beheer" className="btn-secondary">Wijzigen</a>
                    {error && <span style={{ fontSize: 12, color: "var(--red)" }}>{error}</span>}
                  </div>
                </>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 14, color: "var(--muted)", fontStyle: "italic" }}>
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

        {/* AI Summary */}
        <div className="summary-wrap">
          <div className="summary-label">
            <span>✦</span> AI-gegenereerde samenvatting
          </div>
          <div className="summary-text">{aiSummary}</div>
        </div>

        {/* Stats strip */}
        <div className="stats-strip">
          <div className="stat-pill green" style={{ flex: 1.2 }}>
            <span className="stat-pill-icon">✓</span>
            <span className="stat-pill-value green">{completedCount}/{pbis.length}</span>
            <span className="stat-pill-label">PBI&apos;s afgerond</span>
          </div>
          <div className="stat-pill blue">
            <span className="stat-pill-icon">◈</span>
            <span className="stat-pill-value blue">{completedEffort}<span style={{ fontSize: 14, fontFamily: "var(--sans)", color: "var(--muted)" }}>/{totalEffort}</span></span>
            <span className="stat-pill-label">Story points</span>
          </div>
          <div className="stat-pill orange">
            <span className="stat-pill-icon">↑</span>
            <span className="stat-pill-value orange">{uploadTasks.length}</span>
            <span className="stat-pill-label">Uploads</span>
          </div>
          <div className="stat-pill blue">
            <span className="stat-pill-icon">T</span>
            <span className="stat-pill-value blue">{topdeskTasks.length}</span>
            <span className="stat-pill-label">TOPdesk</span>
          </div>
          <div className="stat-pill red">
            <span className="stat-pill-icon">⚑</span>
            <span className="stat-pill-value red">{doneBugs.length}/{bugs.length}</span>
            <span className="stat-pill-label">Bugs opgelost</span>
          </div>
        </div>

        {/* Collapsible detail sections */}
        <div className="details">
          {pbis.length > 0 && (
            <Section dot="red" title="Product Backlog Items" count={pbis.length} colorClass="red">
              {pbis.map((item) => (
                <div key={item.id} className="list-item">
                  <span className="item-name">{item.title}</span>
                  <div className="item-badges">
                    {item.effort != null && <span className="badge blue">{item.effort} SP</span>}
                    <span className={`badge ${badgeColor(item.state)}`}>{item.state}</span>
                  </div>
                </div>
              ))}
            </Section>
          )}

          {topdeskTasks.length > 0 && (
            <Section dot="blue" title="TOPdesk-taken" count={topdeskTasks.length} colorClass="blue">
              {topdeskTasks.map((item) => (
                <div key={item.id} className="list-item">
                  <span className="item-name">{item.title}</span>
                  <div className="item-badges">
                    <span className={`badge ${badgeColor(item.state)}`}>{item.state}</span>
                  </div>
                </div>
              ))}
            </Section>
          )}

          {bugs.length > 0 && (
            <Section dot="orange" title="Bugs" count={bugs.length} colorClass="orange">
              {bugs.map((item) => (
                <div key={item.id} className="list-item">
                  <span className="item-name">{item.title}</span>
                  <div className="item-badges">
                    <span className={`badge ${badgeColor(item.state)}`}>{item.state}</span>
                  </div>
                </div>
              ))}
            </Section>
          )}

          <Section dot="blue" title="Velocity — laatste 5 sprints" count={velocity.length} colorClass="blue">
            <VelocityChart data={velocity} currentSprintId={sprint.id} />
          </Section>
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
