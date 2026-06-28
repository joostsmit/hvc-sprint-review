"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Sprint } from "@/lib/azure-devops";
import type { DraftReport } from "@/lib/blob-store";

interface SprintItem {
  sprint: Sprint;
  reportId: string;
  goal: string;
  isCurrent: boolean;
}

interface Props {
  sprintItems: SprintItem[];
  draft: DraftReport | null;
}

function GoalRow({ item, onGoalSaved }: { item: SprintItem; onGoalSaved: (sprintId: string, goal: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(item.goal);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function handleSave() {
    setStatus("saving");
    try {
      const res = await fetch("/api/sprint/goal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sprintId: item.sprint.id, goal: value.trim() }),
      });
      if (!res.ok) throw new Error(await res.text());
      setStatus("saved");
      setEditing(false);
      onGoalSaved(item.sprint.id, value.trim());
    } catch {
      setStatus("error");
    }
  }

  const dateStr = item.sprint.finishDate
    ? new Date(item.sprint.finishDate).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })
    : "";

  return (
    <div style={{ borderBottom: "1px solid var(--border)", padding: "16px 24px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Sprint naam + datum */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span style={{ fontFamily: "var(--serif)", fontSize: 17, color: "var(--text)" }}>
              {item.sprint.name}
            </span>
            {item.isCurrent && (
              <span style={{
                fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 10,
                background: "var(--red-light)", color: "var(--red)",
                border: "1px solid var(--red-border)", letterSpacing: "0.06em", textTransform: "uppercase",
              }}>
                Meest recent
              </span>
            )}
            <span style={{ fontSize: 11, color: "var(--muted)", marginLeft: "auto" }}>{dateStr}</span>
          </div>

          {/* Doel weergave of editor */}
          {editing ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <textarea
                className="doel-input"
                value={value}
                onChange={e => { setValue(e.target.value); setStatus("idle"); }}
                placeholder="Wat was het doel van deze sprint?"
                rows={2}
                style={{ fontSize: 13 }}
                autoFocus
              />
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button className="btn-primary" style={{ fontSize: 12, padding: "6px 14px" }}
                  onClick={handleSave} disabled={status === "saving" || !value.trim()}>
                  {status === "saving" ? "Opslaan…" : "Opslaan"}
                </button>
                <button className="btn-secondary" style={{ fontSize: 12, padding: "6px 10px" }}
                  onClick={() => { setEditing(false); setValue(item.goal); setStatus("idle"); }}>
                  Annuleren
                </button>
                {status === "error" && <span style={{ fontSize: 12, color: "var(--red)" }}>Opslaan mislukt</span>}
                {status === "saved" && <span style={{ fontSize: 12, color: "var(--green)" }}>✓ Opgeslagen</span>}
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {value
                ? <span style={{ fontSize: 13, color: "var(--text-2)", fontStyle: "italic", flex: 1 }}>{value}</span>
                : <span style={{ fontSize: 13, color: "var(--muted)", flex: 1 }}>Geen sprintdoel ingesteld</span>
              }
              <button className="btn-secondary" style={{ fontSize: 11, padding: "4px 10px", flexShrink: 0 }}
                onClick={() => setEditing(true)}>
                {value ? "Wijzigen" : "Instellen"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BeheerClient({ sprintItems, draft }: Props) {
  const router = useRouter();
  const [goals, setGoals] = useState<Record<string, string>>(
    Object.fromEntries(sprintItems.map(i => [i.sprint.id, i.goal]))
  );
  const [publishStatus, setPublishStatus] = useState<"idle" | "saving" | "error">("idle");
  const [publishError, setPublishError] = useState("");

  function handleGoalSaved(sprintId: string, goal: string) {
    setGoals(prev => ({ ...prev, [sprintId]: goal }));
  }

  const current = sprintItems[0];
  const currentGoal = goals[current?.sprint.id ?? ""] ?? "";

  async function handlePublish() {
    if (!currentGoal) { setPublishError("Stel eerst een sprintdoel in voor de meest recente sprint."); return; }
    if (!draft) { setPublishError("Geen concept beschikbaar. Bezoek eerst /sprint om data te laden."); return; }
    setPublishStatus("saving"); setPublishError("");
    try {
      const res = await fetch("/api/sprint/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sprint: draft.sprint,
          data: draft.processedData,
          aiSummary: draft.aiSummary,
          velocity: draft.velocityData,
          sprintGoal: currentGoal,
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Sprintdoelen */}
      <div className="header-card">
        <div style={{ padding: "16px 24px 4px" }}>
          <div className="block-label">🎯 Sprintdoelen</div>
        </div>
        {sprintItems.map(item => (
          <GoalRow key={item.sprint.id} item={{ ...item, goal: goals[item.sprint.id] ?? "" }} onGoalSaved={handleGoalSaved} />
        ))}
        <div style={{ height: 4 }} />
      </div>

      {/* Rapport publiceren */}
      <div className="header-card">
        <div style={{ padding: "20px 24px 24px" }}>
          <div className="block-label" style={{ marginBottom: 10 }}>📤 Rapport publiceren</div>
          <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6, marginBottom: 16 }}>
            Publiceert het meest recente sprint rapport met het bijbehorende sprintdoel. Je krijgt een vaste link voor stakeholders.
            {draft ? (
              <span style={{ display: "block", marginTop: 6, fontSize: 12, color: "var(--muted)" }}>
                Concept gegenereerd op: {new Date(draft.generatedAt).toLocaleString("nl-NL")}
              </span>
            ) : (
              <span style={{ display: "block", marginTop: 6, fontSize: 12, color: "var(--orange)" }}>
                ⚠ Nog geen concept. Bezoek eerst <a href="/sprint">/sprint</a> om data te laden.
              </span>
            )}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button className="btn-primary" onClick={handlePublish}
              disabled={publishStatus === "saving" || !currentGoal || !draft}
              style={{ opacity: (!currentGoal || !draft) ? 0.5 : 1 }}>
              {publishStatus === "saving" ? "Publiceren…" : "Goedkeuren en publiceren →"}
            </button>
            {!currentGoal && <span style={{ fontSize: 12, color: "var(--muted)" }}>Stel eerst een sprintdoel in</span>}
          </div>
          {publishError && <p style={{ marginTop: 10, fontSize: 13, color: "var(--red)" }}>{publishError}</p>}
        </div>
      </div>

    </div>
  );
}
