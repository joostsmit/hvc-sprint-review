import type { Metadata } from "next";
import { getLastFinishedSprints } from "@/lib/azure-devops";
import { reportExists, sprintReportId } from "@/lib/blob-store";
import OverzichtClient from "./OverzichtClient";

export const metadata: Metadata = { title: "Installaties & Onderhoud: Sprint overzicht" };
export const dynamic = "force-dynamic";

export default async function OverzichtPage() {
  const sprints = await getLastFinishedSprints(5);
  const statuses = await Promise.all(
    sprints.map(async s => ({
      sprint: s,
      reportId: sprintReportId(s.id),
      published: await reportExists(s.id),
    }))
  );

  return (
    <>
      <div className="topbar">
        <div className="topbar-brand">
          <div className="topbar-logo">H</div>
          <span>HVC</span>
          <span className="topbar-sep">·</span>
          <span className="topbar-sub">Installaties &amp; Onderhoud</span>
        </div>
        <a href="/sprint" className="topbar-link">← Huidige sprint</a>
      </div>

      <div className="page">
        <div className="header-card" style={{ marginBottom: 20 }}>
          <div className="hero">
            <div className="hero-left">
              <div className="sprint-tag">Archief</div>
              <div className="hero-title">Sprint overzicht</div>
              <div className="hero-subtitle">Laatste 5 afgelopen sprints</div>
            </div>
          </div>
        </div>

        <OverzichtClient sprints={statuses} />
      </div>
    </>
  );
}
