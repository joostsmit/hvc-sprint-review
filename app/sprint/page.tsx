import { getCurrentSprintData, getVelocityData } from "@/lib/azure-devops";
import { processItems } from "@/lib/filters";
import { generateSprintSummary } from "@/lib/claude";
import { getSprintGoal, saveDraft } from "@/lib/blob-store";
import SprintReport from "@/components/SprintReport";

export const dynamic = "force-dynamic";

export default async function SprintPage() {
  const [sprintData, velocityData] = await Promise.all([
    getCurrentSprintData(),
    getVelocityData(),
  ]);

  const processed = processItems(sprintData.items);

  const [aiSummary, sprintGoal] = await Promise.all([
    generateSprintSummary({
      sprintName: sprintData.sprint.name,
      pbis: processed.pbis,
      bugs: processed.bugs,
      totalEffort: processed.totalEffort,
      completedEffort: processed.completedEffort,
    }),
    getSprintGoal(sprintData.sprint.id),
  ]);

  // Sla draft op zodat beheer-pagina kan finaliseren zonder alles opnieuw te genereren
  await saveDraft({
    sprint: sprintData.sprint,
    processedData: processed,
    velocityData,
    aiSummary,
    generatedAt: new Date().toISOString(),
  });

  return (
    <SprintReport
      sprint={sprintData.sprint}
      data={processed}
      aiSummary={aiSummary}
      velocity={velocityData}
      savedSprintGoal={sprintGoal ?? undefined}
    />
  );
}
