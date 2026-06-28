import type { Metadata } from "next";
import { getLastFinishedSprints } from "@/lib/azure-devops";
import { getSprintGoal, getDraft, sprintReportId, reportExists } from "@/lib/blob-store";
import BeheerClient from "./BeheerClient";

export const metadata: Metadata = { title: "Installaties & Onderhoud: Beheer" };
export const dynamic = "force-dynamic";

export default async function BeheerPage() {
  const sprints = await getLastFinishedSprints(5);
  const current = sprints[0];

  const [goals, published, draft] = await Promise.all([
    Promise.all(sprints.map(s => getSprintGoal(s.id))),
    Promise.all(sprints.map(s => reportExists(s.id))),
    getDraft(),
  ]);

  const sprintItems = sprints.map((s, i) => ({
    sprint: s,
    reportId: sprintReportId(s.id),
    goal: goals[i] ?? "",
    isCurrent: i === 0,
    published: published[i],
  }));

  const dateStr = current?.finishDate
    ? new Date(current.finishDate).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })
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
        <div className="topbar-right">
          <a href="/sprint/overzicht" className="topbar-link">Overzicht</a>
          <a href="/sprint" className="topbar-link">← Rapport</a>
        </div>
      </div>

      <div className="page">
        <div className="header-card" style={{ marginBottom: 20 }}>
          <div className="hero">
            <div className="hero-left">
              <div className="sprint-tag">Beheer · {dateStr}</div>
              <div className="hero-title">Sprint beheer</div>
              <div className="hero-subtitle">Sprintdoelen instellen en rapporten publiceren</div>
            </div>
          </div>
        </div>

        <BeheerClient sprintItems={sprintItems} draft={draft} />
      </div>
    </>
  );
}
