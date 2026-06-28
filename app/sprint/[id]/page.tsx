import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getReport } from "@/lib/blob-store";
import SprintReport from "@/components/SprintReport";
import type { ProcessedSprintData } from "@/lib/filters";
import type { Sprint } from "@/lib/azure-devops";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const report = await getReport(id);
  if (!report) return {};
  return { title: `Installaties & Onderhoud: ${report.sprintName}` };
}

export default async function SavedSprintPage({ params }: PageProps) {
  const { id } = await params;
  const report = await getReport(id);
  if (!report) notFound();

  return (
    <SprintReport
      sprint={report.sprint as Sprint}
      data={report.processedData as ProcessedSprintData}
      aiSummary={report.aiSummary}
      velocity={report.velocityData as Array<{ sprint: Sprint; totalEffort: number }>}
      savedSprintGoal={report.sprintGoal}
    />
  );
}
