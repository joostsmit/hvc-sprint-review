import { put, head, list } from "@vercel/blob";

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
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    const info = await head(filename, { token }).catch(() => null);
    if (!info) return null;
    // For private blobs, fetch with the token as Authorization header
    const res = await fetch(info.downloadUrl ?? info.url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function saveReport(report: SavedReport): Promise<void> {
  await put(`sprint-reports/${report.id}.json`, JSON.stringify(report), {
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
  await put(`sprint-goals/${sprintId}.json`, JSON.stringify({ goal }), {
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
