import { put, head } from "@vercel/blob";

export interface SavedReport {
  id: string;
  sprintName: string;
  sprintGoal: string;
  aiSummary: string;
  processedData: unknown;
  velocityData: unknown;
  createdAt: string;
}

export async function saveReport(report: SavedReport): Promise<string> {
  const filename = `sprint-reports/${report.id}.json`;
  const blob = await put(filename, JSON.stringify(report), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
  });
  return blob.url;
}

export async function getReport(id: string): Promise<SavedReport | null> {
  try {
    const filename = `sprint-reports/${id}.json`;
    // Check if blob exists first
    const info = await head(filename).catch(() => null);
    if (!info) return null;

    const res = await fetch(info.url, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
