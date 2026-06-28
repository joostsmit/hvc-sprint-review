import { getCurrentSprintData } from "@/lib/azure-devops";
import { getSprintGoal } from "@/lib/blob-store";
import SprintGoalForm from "./SprintGoalForm";

export const dynamic = "force-dynamic";

export default async function BeheerPage() {
  const { sprint } = await getCurrentSprintData();
  const currentGoal = await getSprintGoal(sprint.id);

  const dateStr = sprint.finishDate
    ? new Date(sprint.finishDate).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })
    : "";

  return (
    <>
      <div className="topbar">
        <div className="topbar-brand">
          <div className="topbar-logo">H</div>
          <span>HVC · Installaties &amp; Onderhoud</span>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>Sprintdoel instellen</span>
        </div>
        <a href="/sprint" style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", textDecoration: "none" }}>
          ← Naar rapport
        </a>
      </div>

      <div className="page">
        <div className="hero">
          <div className="sprint-tag">Afgelopen sprint</div>
          <div className="hero-title">{sprint.name}</div>
          <div className="hero-subtitle">{dateStr}</div>
        </div>

        <div className="content" style={{ paddingTop: 32 }}>
          <SprintGoalForm sprintId={sprint.id} currentGoal={currentGoal ?? ""} />
        </div>
      </div>
    </>
  );
}
