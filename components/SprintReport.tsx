"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ProcessedSprintData } from "@/lib/filters";
import type { Sprint, WorkItem } from "@/lib/azure-devops";

interface VelocityPoint { sprint: Sprint; totalEffort: number; }
type Panel = "pbis" | "topdesk" | "bugs" | "velocity" | null;

interface Props {
  sprint: Sprint;
  data: ProcessedSprintData;
  aiSummary: string;
  velocity: VelocityPoint[];
  isDraft?: boolean;
  savedSprintGoal?: string;
}

/* ── Donut ring voor completion rates ── */
function DonutRing({ done, total, color }: { done: number; total: number; color: string }) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const pct = total > 0 ? Math.min(done / total, 1) : 0;
  const complete = pct === 1 && total > 0;
  const displayColor = complete ? "var(--green)" : color;
  return (
    <svg width="56" height="56" viewBox="0 0 56 56">
      <circle cx="28" cy="28" r={r} fill="none" stroke="var(--border)" strokeWidth="4.5" />
      <circle cx="28" cy="28" r={r} fill="none" stroke={displayColor} strokeWidth="4.5"
        strokeDasharray={`${pct * circ} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 28 28)" />
      <text x="28" y="33" textAnchor="middle" fontSize="12" fontWeight="700"
        fill={displayColor} fontFamily="var(--sans)">
        {Math.round(pct * 100)}%
      </text>
    </svg>
  );
}

/* ── Horizontale voortgangsbalk voor story points ── */
function ProgressBar({ done, planned }: { done: number; planned: number }) {
  const over = done > planned && planned > 0;
  const pct = planned > 0 ? Math.min(done / planned, 1) * 100 : 0;
  const color = over ? "var(--orange)" : done === planned ? "var(--green)" : "var(--blue)";
  return (
    <div style={{ width: "100%" }}>
      <div style={{
        height: 6, background: "var(--border)", borderRadius: 3,
        overflow: "hidden", marginBottom: 4,
      }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3, transition: "width 0.4s ease" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--muted)" }}>
        <span>Gepland: {planned} SP</span>
        {over && <span style={{ color: "var(--orange)", fontWeight: 600 }}>+{done - planned} extra</span>}
      </div>
    </div>
  );
}

/* ── Mini sparkline voor velocity preview in KPI card ── */
function MiniSparkline({ data, currentId }: { data: VelocityPoint[]; currentId: string }) {
  const max = Math.max(...data.map(d => d.totalEffort), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 36, width: "100%" }}>
      {data.map(pt => {
        const isCurrent = pt.sprint.id === currentId;
        const h = Math.max((pt.totalEffort / max) * 100, 6);
        return (
          <div key={pt.sprint.id} style={{
            flex: 1, height: `${h}%`,
            background: isCurrent ? "var(--red)" : "var(--border)",
            borderRadius: "2px 2px 0 0",
          }} />
        );
      })}
    </div>
  );
}

/* ── Badge kleur op basis van state ── */
function badgeColor(state: string): "green" | "orange" | "gray" {
  if (["Done", "Closed", "Resolved"].includes(state)) return "green";
  if (["Active", "In Progress", "Committed"].includes(state)) return "orange";
  return "gray";
}

/* ── KPI kaart ── */
function KpiCard({ onClick, active, activeClass = "active", children }: {
  onClick: () => void; active: boolean; activeClass?: string; children: React.ReactNode;
}) {
  return (
    <div
      className={`kpi-card${active ? ` ${activeClass}` : ""}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === "Enter" && onClick()}
    >
      {children}
      <span className="kpi-chevron">▼</span>
    </div>
  );
}

/* ── Detail paneel met lijst ── */
function DetailPanel({ title, dotColor, onClose, children }: {
  title: string; dotColor: string; onClose: () => void; children: React.ReactNode;
}) {
  return (
    <div className="detail-panel">
      <div className="detail-header">
        <span className={`detail-dot ${dotColor}`} />
        <span className="detail-title">{title}</span>
        <button className="detail-close" onClick={onClose}>✕</button>
      </div>
      {children}
    </div>
  );
}

export default function SprintReport({ sprint, data, aiSummary, velocity, isDraft, savedSprintGoal }: Props) {
  const router = useRouter();
  const [panel, setPanel] = useState<Panel>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const { pbis, bugs, uploadTasks, topdeskTasks, totalEffort, completedEffort, completedCount } = data;
  const doneBugs = bugs.filter(b => ["Done", "Closed", "Resolved"].includes(b.state));

  const dateStr = sprint.finishDate
    ? new Date(sprint.finishDate).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })
    : "";

  function togglePanel(p: Panel) {
    setPanel(prev => prev === p ? null : p);
  }

  async function handleSave() {
    if (!savedSprintGoal?.trim()) { setError("Stel eerst een sprintdoel in"); return; }
    setSaving(true); setError("");
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
          {isDraft && <a href="/sprint/beheer" className="topbar-link">Sprintdoel instellen</a>}
        </div>
      </div>

      <div className="page">

        {/* ── Header card: hero + doel + summary ── */}
        <div className="header-card">
          <div className="hero">
            <div className="hero-left">
              <div className="sprint-tag">Afgelopen sprint · {dateStr}</div>
              <div className="hero-title">{sprint.name}</div>
              <div className="hero-subtitle">Domeinteam Installaties &amp; Onderhoud</div>
            </div>
          </div>

          <div className="info-row">
            {/* Sprintdoel */}
            <div className="doel-block">
              <div className="block-label">🎯 Sprintdoel</div>
              {isDraft ? (
                savedSprintGoal
                  ? <div className="doel-text">{savedSprintGoal}</div>
                  : <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 13, color: "var(--muted)", fontStyle: "italic" }}>Nog niet ingesteld.</span>
                      <a href="/sprint/beheer" className="btn-ghost" style={{ fontSize: 12, padding: "5px 12px" }}>Instellen →</a>
                    </div>
              ) : (
                <div className="doel-text">{savedSprintGoal}</div>
              )}
            </div>

            {/* AI Summary */}
            <div className="summary-block">
              <div className="block-label">
                <span style={{ color: "var(--red)" }}>✦</span> AI-samenvatting
              </div>
              <div className="summary-text">{aiSummary}</div>
            </div>
          </div>

          {/* Draft-acties */}
          {isDraft && savedSprintGoal && (
            <div className="draft-actions">
              <button className="btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? "Opslaan…" : "Goedkeuren en opslaan →"}
              </button>
              <a href="/sprint/beheer" className="btn-secondary">Sprintdoel wijzigen</a>
              {error && <span style={{ fontSize: 12, color: "var(--red)" }}>{error}</span>}
            </div>
          )}
        </div>

        {/* ── KPI grid ── */}
        <div className="kpi-grid">

          {/* PBI's afgerond */}
          <KpiCard onClick={() => togglePanel("pbis")} active={panel === "pbis"} activeClass="active">
            <div className="kpi-visual">
              <DonutRing done={completedCount} total={pbis.length} color="var(--red)" />
            </div>
            <div className="kpi-body">
              <div className="kpi-value" style={{ color: completedCount === pbis.length && pbis.length > 0 ? "var(--green)" : "var(--text)" }}>
                {completedCount}<span style={{ fontSize: 16, color: "var(--muted)", fontFamily: "var(--sans)" }}>/{pbis.length}</span>
              </div>
              <div className="kpi-label">PBI&apos;s afgerond</div>
            </div>
          </KpiCard>

          {/* Story Points */}
          <KpiCard onClick={() => togglePanel("pbis")} active={panel === "pbis"} activeClass="active-blue">
            <div className="kpi-value" style={{ fontSize: 30, color: "var(--blue)" }}>
              {completedEffort}
              <span style={{ fontSize: 16, color: "var(--muted)", fontFamily: "var(--sans)" }}>/{totalEffort}</span>
            </div>
            <div className="kpi-label" style={{ marginBottom: 8 }}>Story points</div>
            <div style={{ width: "100%" }}>
              <ProgressBar done={completedEffort} planned={totalEffort} />
            </div>
          </KpiCard>

          {/* Uploads */}
          <KpiCard onClick={() => togglePanel("topdesk")} active={panel === "topdesk"} activeClass="active-orange">
            <div style={{ fontSize: 28, marginBottom: 4 }}>↑</div>
            <div className="kpi-value" style={{ color: "var(--orange)" }}>{uploadTasks.length}</div>
            <div className="kpi-label">Upload-taken</div>
            <div className="kpi-sub">verwerkt deze sprint</div>
          </KpiCard>

          {/* TOPdesk */}
          <KpiCard onClick={() => togglePanel("topdesk")} active={panel === "topdesk"} activeClass="active-blue">
            <div style={{ fontSize: 28, marginBottom: 4 }}>⊞</div>
            <div className="kpi-value" style={{ color: "var(--blue)" }}>{topdeskTasks.length}</div>
            <div className="kpi-label">TOPdesk-taken</div>
            <div className="kpi-sub">meldingen verwerkt</div>
          </KpiCard>

          {/* Bugs */}
          <KpiCard onClick={() => togglePanel("bugs")} active={panel === "bugs"} activeClass="active">
            <div className="kpi-visual">
              <DonutRing done={doneBugs.length} total={bugs.length} color="var(--red)" />
            </div>
            <div className="kpi-body">
              <div className="kpi-value" style={{ color: doneBugs.length === bugs.length && bugs.length > 0 ? "var(--green)" : "var(--text)" }}>
                {doneBugs.length}<span style={{ fontSize: 16, color: "var(--muted)", fontFamily: "var(--sans)" }}>/{bugs.length}</span>
              </div>
              <div className="kpi-label">Bugs opgelost</div>
            </div>
          </KpiCard>

        </div>

        {/* ── Detail panelen ── */}
        {panel === "pbis" && (
          <DetailPanel title="Product Backlog Items" dotColor="red" onClose={() => setPanel(null)}>
            {pbis.length === 0
              ? <div className="list-item"><span className="item-name" style={{ color: "var(--muted)" }}>Geen PBI&apos;s</span></div>
              : pbis.map((item: WorkItem) => (
                  <div key={item.id} className="list-item">
                    <span className="item-name">{item.title}</span>
                    <div className="item-badges">
                      {item.effort != null && <span className="badge blue">{item.effort} SP</span>}
                      <span className={`badge ${badgeColor(item.state)}`}>{item.state}</span>
                    </div>
                  </div>
                ))
            }
          </DetailPanel>
        )}

        {panel === "topdesk" && (
          <DetailPanel title="TOPdesk &amp; Upload-taken" dotColor="blue" onClose={() => setPanel(null)}>
            {topdeskTasks.length === 0 && uploadTasks.length === 0
              ? <div className="list-item"><span className="item-name" style={{ color: "var(--muted)" }}>Geen taken</span></div>
              : <>
                  {topdeskTasks.map((item: WorkItem) => (
                    <div key={item.id} className="list-item">
                      <span className="item-name">{item.title}</span>
                      <div className="item-badges">
                        <span className="badge blue">TOPdesk</span>
                        <span className={`badge ${badgeColor(item.state)}`}>{item.state}</span>
                      </div>
                    </div>
                  ))}
                  {uploadTasks.map((item: WorkItem) => (
                    <div key={item.id} className="list-item">
                      <span className="item-name">{item.title}</span>
                      <div className="item-badges">
                        <span className="badge orange">Upload</span>
                        <span className={`badge ${badgeColor(item.state)}`}>{item.state}</span>
                      </div>
                    </div>
                  ))}
                </>
            }
          </DetailPanel>
        )}

        {panel === "bugs" && (
          <DetailPanel title="Bugs" dotColor="red" onClose={() => setPanel(null)}>
            {bugs.length === 0
              ? <div className="list-item"><span className="item-name" style={{ color: "var(--muted)" }}>Geen bugs</span></div>
              : bugs.map((item: WorkItem) => (
                  <div key={item.id} className="list-item">
                    <span className="item-name">{item.title}</span>
                    <div className="item-badges">
                      <span className={`badge ${badgeColor(item.state)}`}>{item.state}</span>
                    </div>
                  </div>
                ))
            }
          </DetailPanel>
        )}

        {/* ── Velocity (altijd onderaan, uitklapbaar) ── */}
        <div className="header-card" style={{ marginBottom: 16, cursor: "pointer" }}
          onClick={() => togglePanel(panel === "velocity" ? null : "velocity")}>
          <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", gap: 10 }}>
            <span className="detail-dot blue" />
            <span className="detail-title">Velocity — laatste 5 sprints</span>
            <div style={{ flex: 1 }}>
              <MiniSparkline data={velocity} currentId={sprint.id} />
            </div>
            <span style={{ fontSize: 10, color: "var(--muted)", transition: "transform 0.2s", transform: panel === "velocity" ? "rotate(180deg)" : "none", display: "inline-block" }}>▼</span>
          </div>
          {panel === "velocity" && (
            <div style={{ borderTop: "1px solid var(--border)" }}>
              <div className="velocity-bars">
                {velocity.map(pt => {
                  const max = Math.max(...velocity.map(d => d.totalEffort), 1);
                  const isCurrent = pt.sprint.id === sprint.id;
                  const h = Math.max((pt.totalEffort / max) * 100, 4);
                  return (
                    <div key={pt.sprint.id} className="velocity-bar-group">
                      <span className="velocity-bar-val">{pt.totalEffort} SP</span>
                      <div className="velocity-bar" style={{
                        height: `${h}%`,
                        background: isCurrent ? "var(--red)" : "var(--border)",
                        border: `1px solid ${isCurrent ? "var(--red)" : "var(--border-strong)"}`,
                      }} />
                      <span className="velocity-bar-label">
                        {pt.sprint.name.replace(/.*Sprint\s*/i, "Sprint ")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="footer">
          <span className="footer-text">HVC · Installaties &amp; Onderhoud · {dateStr}</span>
          <span className="ai-tag">✦ Gegenereerd met AI (Claude)</span>
        </div>

      </div>
    </>
  );
}
