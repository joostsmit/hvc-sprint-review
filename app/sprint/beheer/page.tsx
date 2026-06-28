import { getCurrentSprintData } from "@/lib/azure-devops";
import { getSprintGoal, getDraft } from "@/lib/blob-store";
import BeheerClient from "./BeheerClient";

export const dynamic = "force-dynamic";

export default async function BeheerPage() {
  const { sprint } = await getCurrentSprintData();
  const [currentGoal, draft] = await Promise.all([
    getSprintGoal(sprint.id),
    getDraft(),
  ]);

  const dateStr = sprint.finishDate
    ? new Date(sprint.finishDate).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })
    : "";

  return (
    <>
      <div className="topbar">
        <div className="topbar-brand">
          <div className="topbar-logo">H</div>
          <span>HVC</span>
          <span className="topbar-sep">·</span>
          <span className="topbar-sub">Installaties &amp; Onderhoud</span>
        </div>
        <a href="/sprint" className="topbar-link">← Naar rapport</a>
      </div>

      <div className="page">
        <div className="header-card" style={{ marginBottom: 20 }}>
          <div className="hero">
            <div className="hero-left">
              <div className="sprint-tag">Beheer · {dateStr}</div>
              <div className="hero-title">{sprint.name}</div>
              <div className="hero-subtitle">Sprintdoel en rapportage beheren</div>
            </div>
          </div>
        </div>

        <BeheerClient
          sprintId={sprint.id}
          currentGoal={currentGoal ?? ""}
          draft={draft}
        />
      </div>
    </>
  );
}
