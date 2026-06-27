import type { WorkItem } from "./azure-devops";

const TOPDESK_REGEX = /M\d+-\d+|W\s\d+/i;

export function isUploadTask(item: WorkItem): boolean {
  return (
    item.type === "Task" &&
    item.tags.some((t) => t.toLowerCase() === "upload")
  );
}

export function isTopdeskTask(item: WorkItem): boolean {
  return item.type === "Task" && TOPDESK_REGEX.test(item.title);
}

export interface ProcessedSprintData {
  pbis: WorkItem[];
  bugs: WorkItem[];
  tasks: WorkItem[];
  uploadTasks: WorkItem[];
  topdeskTasks: WorkItem[];
  totalEffort: number;
  completedEffort: number;
  completedCount: number;
}

export function processItems(items: WorkItem[]): ProcessedSprintData {
  const pbis = items.filter((i) => i.type === "Product Backlog Item");
  const bugs = items.filter((i) => i.type === "Bug");
  const tasks = items.filter((i) => i.type === "Task");

  const uploadTasks = tasks.filter(isUploadTask);
  const topdeskTasks = tasks.filter(isTopdeskTask);

  const doneStates = new Set(["Done", "Closed", "Resolved"]);

  const totalEffort = pbis.reduce((s, i) => s + (i.effort ?? 0), 0);
  const completedEffort = pbis
    .filter((i) => doneStates.has(i.state))
    .reduce((s, i) => s + (i.effort ?? 0), 0);

  const completedCount = pbis.filter((i) => doneStates.has(i.state)).length;

  return { pbis, bugs, tasks, uploadTasks, topdeskTasks, totalEffort, completedEffort, completedCount };
}
