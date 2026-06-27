"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ProcessedSprintData } from "@/lib/filters";
import type { Sprint } from "@/lib/azure-devops";

interface VelocityPoint {
  sprint: Sprint;
  totalEffort: number;
}

interface Props {
  sprint: Sprint;
  data: ProcessedSprintData;
  aiSummary: string;
  velocity: VelocityPoint[];
  isDraft?: boolean;
  savedSprintGoal?: string;
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 12,
      padding: "20px 24px",
      display: "flex",
      flexDirection: "column",
      gap: 4,
    }}>
      <span style={{ fontSize: 13, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </span>
      <span style={{ fontSize: 32, fontWeight: 600, lineHeight: 1.1, color: "var(--text)" }}>
        {value}
      </span>
      {sub && <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{sub}</span>}
    </div>
  );
}

function StateTag({ state }: { state: string }) {
  const done = ["Done", "Closed", "Resolved"].includes(state);
  return (
    <span style={{
      display: "inline-block",
      fontSize: 11,
      fontWeight: 600,
      padding: "2px 8px",
      borderRadius: 20,
      background: done ? "rgba(46,168,126,0.15)" : "rgba(224,135,58,0.15)",
      color: done ? "var(--done)" : "var(--open)",
      letterSpacing: "0.04em",
      textTransform: "uppercase",
      whiteSpace: "nowrap",
    }}>
      {state}
    </span>
  );
}

function VelocityChart({ data, currentSprintId }: { data: VelocityPoint[]; currentSprintId: string }) {
  const max = Math.max(...data.map((d) => d.totalEffort), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 120, padding: "0 4px" }}>
      {data.map((point) => {
        const isCurrent = point.sprint.id === currentSprintId;
        const heightPct = (point.totalEffort / max) * 100;
        return (
          <div key={point.sprint.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: 1 }}>
            <span style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
              {point.totalEffort} SP
            </span>
            <div
              style={{
                width: "100%",
                height: `${Math.max(heightPct, 4)}%`,
                background: isCurrent ? "var(--hvc-red)" : "var(--surface-2)",
                border: isCurrent ? "1px solid var(--hvc-red)" : "1px solid var(--border)",
                borderRadius: "4px 4px 0 0",
                minHeight: 4,
                transition: "height 0.3s ease",
              }}
            />
            <span style={{ fontSize: 10, color: "var(--text-muted)", textAlign: "center", lineHeight: 1.2 }}>
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
  const [sprintGoal, setSprintGoal] = useState(savedSprintGoal ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const { pbis, bugs, uploadTasks, topdeskTasks, totalEffort, completedEffort, completedCount } = data;
  const doneBugs = bugs.filter((b) => ["Done", "Closed", "Resolved"].includes(b.state));

  async function handleSave() {
    if (!sprintGoal.trim()) { setError("Vul een sprintdoel in"); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/sprint/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sprint,
          data,
          aiSummary,
          velocity,
          sprintGoal: sprintGoal.trim(),
        }),
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
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Header */}
      <header style={{
        borderBottom: "1px solid var(--border)",
        padding: "16px 40px",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}>
        <span style={{
          fontFamily: "var(--font-serif)",
          fontSize: 22,
          color: "var(--hvc-red)",
          letterSpacing: "-0.01em",
        }}>HVC</span>
        <span style={{ color: "var(--border)", fontSize: 18 }}>|</span>
        <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>Sprint Review</span>
        {isDraft && (
          <span style={{
            marginLeft: "auto",
            fontSize: 11,
            fontWeight: 600,
            padding: "4px 10px",
            borderRadius: 20,
            background: "rgba(224,135,58,0.15)",
            color: "var(--open)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}>
            Concept
          </span>
        )}
      </header>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "48px 24px 80px" }}>
        {/* Hero */}
        <section style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 8, fontWeight: 500 }}>
            {sprint.startDate && sprint.finishDate
              ? `${new Date(sprint.startDate).toLocaleDateString("nl-NL", { day: "numeric", month: "long" })} – ${new Date(sprint.finishDate).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}`
              : "Datum onbekend"}
          </div>
          <h1 style={{
            fontFamily: "var(--font-serif)",
            fontSize: "clamp(32px, 5vw, 52px)",
            lineHeight: 1.1,
            fontWeight: 400,
            marginBottom: 24,
          }}>
            {sprint.name}
          </h1>

          {/* Sprint goal */}
          {isDraft ? (
            <div style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: 24,
            }}>
              <label style={{ display: "block", fontSize: 13, color: "var(--text-muted)", marginBottom: 10, fontWeight: 500 }}>
                Sprintdoel
              </label>
              <textarea
                value={sprintGoal}
                onChange={(e) => setSprintGoal(e.target.value)}
                placeholder="Wat was het doel van deze sprint?"
                rows={3}
                style={{
                  width: "100%",
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "12px 14px",
                  color: "var(--text)",
                  fontFamily: "var(--font-sans)",
                  fontSize: 15,
                  lineHeight: 1.5,
                  resize: "vertical",
                  outline: "none",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--hvc-red)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
              {error && (
                <p style={{ color: "var(--hvc-red)", fontSize: 13, marginTop: 8 }}>{error}</p>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  marginTop: 16,
                  background: saving ? "var(--hvc-red-dark)" : "var(--hvc-red)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "10px 24px",
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: "var(--font-sans)",
                  cursor: saving ? "not-allowed" : "pointer",
                  transition: "background 0.2s",
                }}
              >
                {saving ? "Opslaan…" : "Goedkeuren en opslaan →"}
              </button>
            </div>
          ) : (
            savedSprintGoal && (
              <blockquote style={{
                borderLeft: "3px solid var(--hvc-red)",
                paddingLeft: 20,
                color: "var(--text)",
                fontSize: 17,
                fontStyle: "italic",
                lineHeight: 1.6,
              }}>
                {savedSprintGoal}
              </blockquote>
            )
          )}
        </section>

        {/* AI Summary */}
        <section style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "28px 32px",
          marginBottom: 40,
          position: "relative",
        }}>
          <div style={{
            position: "absolute",
            top: -11,
            left: 28,
            background: "var(--hvc-red)",
            color: "#fff",
            fontSize: 11,
            fontWeight: 600,
            padding: "2px 10px",
            borderRadius: 20,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}>
            Samenvatting
          </div>
          <p style={{ fontSize: 16, lineHeight: 1.75, color: "var(--text)" }}>{aiSummary}</p>
        </section>

        {/* Stats */}
        <section style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 16,
          marginBottom: 48,
        }}>
          <StatCard
            label="Afgerond"
            value={`${completedCount}/${pbis.length}`}
            sub="PBI's"
          />
          <StatCard
            label="Story Points"
            value={`${completedEffort}/${totalEffort}`}
            sub="afgerond / gepland"
          />
          <StatCard label="Uploads" value={uploadTasks.length} sub="taken" />
          <StatCard label="Topdesk" value={topdeskTasks.length} sub="taken" />
          <StatCard label="Bugs" value={`${doneBugs.length}/${bugs.length}`} sub="opgelost" />
        </section>

        {/* PBI List */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{
            fontFamily: "var(--font-serif)",
            fontSize: 24,
            fontWeight: 400,
            marginBottom: 20,
            paddingBottom: 12,
            borderBottom: "1px solid var(--border)",
          }}>
            Product Backlog Items
          </h2>
          {pbis.length === 0 ? (
            <p style={{ color: "var(--text-muted)" }}>Geen PBI&apos;s in deze sprint.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {pbis.map((item) => (
                <div key={item.id} style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  padding: "14px 16px",
                  background: "var(--surface)",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                }}>
                  <span style={{ flex: 1, minWidth: 0 }}>{item.title}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                    {item.effort != null && (
                      <span style={{ fontSize: 13, color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>
                        {item.effort} SP
                      </span>
                    )}
                    <StateTag state={item.state} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Topdesk Items */}
        {topdeskTasks.length > 0 && (
          <section style={{ marginBottom: 48 }}>
            <h2 style={{
              fontFamily: "var(--font-serif)",
              fontSize: 24,
              fontWeight: 400,
              marginBottom: 20,
              paddingBottom: 12,
              borderBottom: "1px solid var(--border)",
            }}>
              TOPdesk-taken
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {topdeskTasks.map((item) => (
                <div key={item.id} style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  padding: "12px 16px",
                  background: "var(--surface)",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                }}>
                  <span style={{ flex: 1, minWidth: 0 }}>{item.title}</span>
                  <StateTag state={item.state} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Velocity */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{
            fontFamily: "var(--font-serif)",
            fontSize: 24,
            fontWeight: 400,
            marginBottom: 20,
            paddingBottom: 12,
            borderBottom: "1px solid var(--border)",
          }}>
            Velocity (laatste 5 sprints)
          </h2>
          <div style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "28px 24px 20px",
          }}>
            <VelocityChart data={velocity} currentSprintId={sprint.id} />
          </div>
        </section>

        {/* Footer */}
        <footer style={{
          textAlign: "center",
          paddingTop: 32,
          borderTop: "1px solid var(--border)",
          color: "var(--text-muted)",
          fontSize: 13,
        }}>
          <span>✦ Gegenereerd met behulp van AI (Claude)</span>
        </footer>
      </main>
    </div>
  );
}
