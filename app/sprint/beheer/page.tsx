import { getCurrentSprintData } from "@/lib/azure-devops";
import { getSprintGoal } from "@/lib/blob-store";
import SprintGoalForm from "./SprintGoalForm";

export const dynamic = "force-dynamic";

export default async function BeheerPage() {
  const { sprint } = await getCurrentSprintData();
  const currentGoal = await getSprintGoal(sprint.id);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <header style={{
        borderBottom: "1px solid var(--border)",
        padding: "16px 40px",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}>
        <span style={{ fontFamily: "var(--font-serif)", fontSize: 22, color: "var(--hvc-red)" }}>HVC</span>
        <span style={{ color: "var(--border)", fontSize: 18 }}>|</span>
        <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500 }}>Sprintdoel instellen</span>
        <a href="/sprint" style={{
          marginLeft: "auto",
          fontSize: 13,
          color: "var(--text-muted)",
          textDecoration: "none",
        }}>
          ← Naar rapport
        </a>
      </header>

      <main style={{ maxWidth: 600, margin: "0 auto", padding: "48px 24px" }}>
        <h1 style={{
          fontFamily: "var(--font-serif)",
          fontSize: 32,
          fontWeight: 400,
          marginBottom: 8,
        }}>
          {sprint.name}
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 40 }}>
          {sprint.startDate && sprint.finishDate
            ? `${new Date(sprint.startDate).toLocaleDateString("nl-NL", { day: "numeric", month: "long" })} – ${new Date(sprint.finishDate).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}`
            : ""}
        </p>

        <SprintGoalForm
          sprintId={sprint.id}
          currentGoal={currentGoal ?? ""}
        />
      </main>
    </div>
  );
}
