import { getCurrentSprintData, getVelocityData } from "@/lib/azure-devops";
import { processItems } from "@/lib/filters";
import { generateSprintSummary } from "@/lib/claude";
import SprintReport from "@/components/SprintReport";

// Always fetch fresh data — no caching
export const dynamic = "force-dynamic";

export default async function SprintPage() {
  const [sprintData, velocityData] = await Promise.all([
    getCurrentSprintData(),
    getVelocityData(),
  ]);

  const processed = processItems(sprintData.items);

  const aiSummary = await generateSprintSummary({
    sprintName: sprintData.sprint.name,
    pbis: processed.pbis,
    bugs: processed.bugs,
    totalEffort: processed.totalEffort,
    completedEffort: processed.completedEffort,
  });

  return (
    <SprintReport
      sprint={sprintData.sprint}
      data={processed}
      aiSummary={aiSummary}
      velocity={velocityData}
      isDraft={true}
    />
  );
}
