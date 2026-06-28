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
          <span>HVC</span>
          <span className="topbar-sep">·</span>
          <span className="topbar-sub">Installaties &amp; Onderhoud</span>
        </div>
        <a href="/sprint" className="topbar-link">← Naar rapport</a>
      </div>

      <div className="page">
        <div className="hero">
          <div className="sprint-tag">Afgelopen sprint · {dateStr}</div>
          <div className="hero-title">{sprint.name}</div>
          <div className="hero-subtitle">Sprintdoel instellen</div>
        </div>

        <div className="details">
          <SprintGoalForm sprintId={sprint.id} currentGoal={currentGoal ?? ""} />
        </div>
      </div>
    </>
  );
}
