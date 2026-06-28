const ORG = "hvcgroep";
const PROJECT = "EAM AB Beheer en Ontwikkeling";
const TEAM = "EAM AB Beheer en Ontwikkeling Team";
const BASE = `https://dev.azure.com/${ORG}`;
const BASE_VSRM = `https://vsrm.dev.azure.com/${ORG}`;

function authHeader(): HeadersInit {
  const pat = process.env.AZURE_DEVOPS_PAT;
  if (!pat) throw new Error("AZURE_DEVOPS_PAT is not set");
  const token = Buffer.from(`:${pat}`).toString("base64");
  return { Authorization: `Basic ${token}`, "Content-Type": "application/json" };
}

async function ado<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: authHeader(), cache: "no-store" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ADO ${res.status}: ${url}\n${text}`);
  }
  return res.json();
}

export interface Sprint {
  id: string;
  name: string;
  path: string;
  startDate?: string;
  finishDate?: string;
}

export interface WorkItem {
  id: number;
  title: string;
  type: "Product Backlog Item" | "Bug" | "Task" | string;
  state: string;
  effort: number | null;
  tags: string[];
}

export interface SprintData {
  sprint: Sprint;
  items: WorkItem[];
}

async function getIterations(): Promise<Sprint[]> {
  const enc = encodeURIComponent(PROJECT);
  const teamEnc = encodeURIComponent(TEAM);
  const url = `${BASE}/${enc}/${teamEnc}/_apis/work/teamsettings/iterations?api-version=7.1`;
  const data = await ado<{ value: Array<{ id: string; name: string; path: string; attributes: { startDate?: string; finishDate?: string; timeFrame?: string } }> }>(url);
  return data.value.map((it) => ({
    id: it.id,
    name: it.name,
    path: it.path,
    startDate: it.attributes?.startDate,
    finishDate: it.attributes?.finishDate,
  }));
}

export async function getLastFinishedSprints(count: number): Promise<Sprint[]> {
  const all = await getIterations();
  const now = new Date();
  const finished = all.filter(
    (it) => it.finishDate && new Date(it.finishDate) < now
  );
  // Sort descending by finishDate
  finished.sort((a, b) =>
    new Date(b.finishDate!).getTime() - new Date(a.finishDate!).getTime()
  );
  return finished.slice(0, count);
}

export async function getWorkItemsForSprint(sprint: Sprint): Promise<WorkItem[]> {
  const enc = encodeURIComponent(PROJECT);
  const teamEnc = encodeURIComponent(TEAM);
  const iterEnc = encodeURIComponent(sprint.id);

  // Get work item refs for this iteration
  const refUrl = `${BASE}/${enc}/${teamEnc}/_apis/work/teamsettings/iterations/${iterEnc}/workitems?api-version=7.1`;
  const refData = await ado<{ workItemRelations: Array<{ target: { id: number } }> }>(refUrl);

  const ids = refData.workItemRelations
    ?.map((r) => r.target?.id)
    .filter(Boolean);

  if (!ids || ids.length === 0) return [];

  // Batch fetch work item details (max 200 per request)
  const fields = [
    "System.Title",
    "System.WorkItemType",
    "System.State",
    "Microsoft.VSTS.Scheduling.Effort",
    "System.Tags",
  ].join(",");

  const batches: WorkItem[] = [];
  for (let i = 0; i < ids.length; i += 200) {
    const batch = ids.slice(i, i + 200);
    const wiUrl = `${BASE}/_apis/wit/workitems?ids=${batch.join(",")}&fields=${fields}&api-version=7.1`;
    const wiData = await ado<{ value: Array<{ id: number; fields: Record<string, unknown> }> }>(wiUrl);

    for (const wi of wiData.value) {
      const f = wi.fields;
      const effort =
        (f["Microsoft.VSTS.Scheduling.Effort"] as number | null) ?? null;
      const rawTags = (f["System.Tags"] as string) ?? "";
      const tags = rawTags
        .split(";")
        .map((t) => t.trim())
        .filter(Boolean);

      batches.push({
        id: wi.id,
        title: f["System.Title"] as string,
        type: f["System.WorkItemType"] as string,
        state: f["System.State"] as string,
        effort,
        tags,
      });
    }
  }

  return batches;
}

export async function getCurrentSprintData(): Promise<SprintData> {
  const [currentSprint] = await getLastFinishedSprints(1);
  if (!currentSprint) throw new Error("Geen afgesloten sprint gevonden");
  const items = await getWorkItemsForSprint(currentSprint);
  return { sprint: currentSprint, items };
}

export async function getVelocityData(): Promise<
  Array<{ sprint: Sprint; totalEffort: number }>
> {
  const sprints = await getLastFinishedSprints(5);
  const results = await Promise.all(
    sprints.map(async (sprint) => {
      const items = await getWorkItemsForSprint(sprint);
      const totalEffort = items.reduce((sum, it) => sum + (it.effort ?? 0), 0);
      return { sprint, totalEffort };
    })
  );
  // Chronological order for the chart
  return results.reverse();
}
