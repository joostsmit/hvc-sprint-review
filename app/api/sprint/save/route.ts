import { NextRequest, NextResponse } from "next/server";
import { saveReport, type SavedReport } from "@/lib/blob-store";
import type { Sprint } from "@/lib/azure-devops";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sprint, data, aiSummary, velocity, sprintGoal } = body as {
      sprint: Sprint;
      data: unknown;
      aiSummary: string;
      velocity: unknown;
      sprintGoal: string;
    };

    if (!sprintGoal?.trim()) {
      return NextResponse.json({ error: "Sprintdoel is verplicht" }, { status: 400 });
    }

    // Use sprint id as the report id (stable, no duplicates per sprint)
    const id = sprint.id.replace(/[^a-z0-9-]/gi, "-");

    const report: SavedReport = {
      id,
      sprintName: sprint.name,
      sprintGoal: sprintGoal.trim(),
      aiSummary,
      processedData: data,
      velocityData: velocity,
      createdAt: new Date().toISOString(),
      sprint,
    };

    await saveReport(report);
    return NextResponse.json({ id });
  } catch (e) {
    console.error("Save report error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Onbekende fout" },
      { status: 500 }
    );
  }
}
