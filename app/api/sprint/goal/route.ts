import { NextRequest, NextResponse } from "next/server";
import { saveSprintGoal, getSprintGoal } from "@/lib/blob-store";

export async function GET(req: NextRequest) {
  const sprintId = req.nextUrl.searchParams.get("sprintId");
  if (!sprintId) return NextResponse.json({ error: "sprintId verplicht" }, { status: 400 });
  const goal = await getSprintGoal(sprintId);
  return NextResponse.json({ goal });
}

export async function POST(req: NextRequest) {
  try {
    const { sprintId, goal } = await req.json();
    if (!sprintId || !goal?.trim()) {
      return NextResponse.json({ error: "sprintId en goal zijn verplicht" }, { status: 400 });
    }
    await saveSprintGoal(sprintId, goal.trim());
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("POST /api/sprint/goal error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Onbekende fout" },
      { status: 500 }
    );
  }
}
