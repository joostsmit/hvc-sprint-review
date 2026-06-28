import { NextRequest, NextResponse } from "next/server";
import { getLastFinishedSprints, getWorkItemsForSprint, getVelocityData } from "@/lib/azure-devops";
import { processItems } from "@/lib/filters";
import { generateSprintSummary } from "@/lib/claude";
import { getSprintGoal, saveReport, sprintReportId } from "@/lib/blob-store";

export async function POST(req: NextRequest) {
  try {
    const { sprintId } = await req.json();
    if (!sprintId) return NextResponse.json({ error: "sprintId verplicht" }, { status: 400 });

    const sprints = await getLastFinishedSprints(5);
    const sprint = sprints.find(s => s.id === sprintId);
    if (!sprint) return NextResponse.json({ error: "Sprint niet gevonden" }, { status: 404 });

    const [items, velocityData, sprintGoal] = await Promise.all([
      getWorkItemsForSprint(sprint),
      getVelocityData(),
      getSprintGoal(sprint.id),
    ]);

    const processed = processItems(items);
    const aiSummary = await generateSprintSummary({
      sprintName: sprint.name,
      pbis: processed.pbis,
      bugs: processed.bugs,
      totalEffort: processed.totalEffort,
      completedEffort: processed.completedEffort,
    });

    const id = sprintReportId(sprint.id);
    await saveReport({
      id,
      sprintName: sprint.name,
      sprintGoal: sprintGoal ?? "",
      aiSummary,
      processedData: processed,
      velocityData,
      createdAt: new Date().toISOString(),
      sprint,
    });

    return NextResponse.json({ id });
  } catch (e) {
    console.error("Generate report error:", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Onbekende fout" }, { status: 500 });
  }
}
