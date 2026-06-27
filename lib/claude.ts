import Anthropic from "@anthropic-ai/sdk";
import type { WorkItem } from "./azure-devops";

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env

export async function generateSprintSummary(params: {
  sprintName: string;
  pbis: WorkItem[];
  bugs: WorkItem[];
  totalEffort: number;
  completedEffort: number;
}): Promise<string> {
  const { sprintName, pbis, bugs, totalEffort, completedEffort } = params;

  const donePbis = pbis.filter((i) => i.state === "Done" || i.state === "Closed");
  const doneBugs = bugs.filter((i) => i.state === "Done" || i.state === "Closed" || i.state === "Resolved");
  const openPbis = pbis.filter((i) => i.state !== "Done" && i.state !== "Closed");

  const pbiList = pbis
    .map((i) => `- [${i.state}] ${i.title} (${i.effort ?? 0} SP)`)
    .join("\n");
  const bugList = bugs.map((i) => `- [${i.state}] ${i.title}`).join("\n");

  const userMessage = `Sprint: ${sprintName}

Product Backlog Items (${donePbis.length}/${pbis.length} afgerond):
${pbiList || "Geen PBI's"}

Bugs (${doneBugs.length}/${bugs.length} opgelost):
${bugList || "Geen bugs"}

Story points gepland: ${totalEffort}
Story points afgerond: ${completedEffort}
Doorgeschoven PBI's: ${openPbis.map((i) => i.title).join(", ") || "geen"}`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 300,
    system: `Je schrijft de sprint review samenvatting voor het Installaties & Onderhoud team van HVC (afval energie centrales, groen gas, compost installaties).
Schrijf 3-4 zinnen in lopende tekst, geen opsommingen. Benoem concrete resultaten én wat is doorgeschoven.
Toon professionele trots, maar vermijd overdreven uitroepen zoals "maar liefst" of "mooie stap".
Geen markdown opmaak in de output.
WV in een taaknaam staat voor Werkvergunning, niet werkvoorbereiding.
Bij onduidelijke taaknamen: blijf feitelijk en maak geen interpretaties.`,
    messages: [{ role: "user", content: userMessage }],
  });

  const block = message.content[0];
  if (block.type !== "text") throw new Error("Unexpected response type from Claude");
  return block.text;
}
