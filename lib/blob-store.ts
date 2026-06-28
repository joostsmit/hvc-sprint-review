import { put, head, download } from "@vercel/blob";

export interface SavedReport {
  id: string;
  sprintName: string;
  sprintGoal: string;
  aiSummary: string;
  processedData: unknown;
  velocityData: unknown;
  createdAt: string;
  sprint: unknown;
}

async function readBlob(filename: string): Promise<unknown | null> {
  try {
    const info = await head(filename).catch(() => null);
    if (!info) return null;
    const { body } = await download(info.url);
    const chunks: Uint8Array[] = [];
    for await (const chunk of body as AsyncIterable<Uint8Array>) chunks.push(chunk);
    const text = Buffer.concat(chunks).toString("utf-8");
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function saveReport(report: SavedReport): Promise<void> {
  const filename = `sprint-reports/${report.id}.json`;
  await put(filename, JSON.stringify(report), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
  });
}

export async function getReport(id: string): Promise<SavedReport | null> {
  const data = await readBlob(`sprint-reports/${id}.json`);
  return data as SavedReport | null;
}

export async function saveSprintGoal(sprintId: string, goal: string): Promise<void> {
  const filename = `sprint-goals/${sprintId}.json`;
  await put(filename, JSON.stringify({ goal }), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
  });
}

export async function getSprintGoal(sprintId: string): Promise<string | null> {
  const data = await readBlob(`sprint-goals/${sprintId}.json`);
  if (!data || typeof data !== "object") return null;
  return (data as { goal?: string }).goal ?? null;
}
