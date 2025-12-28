import {
  getSwayScore,
  getElectoralInfluence,
  getGrowthOverTime,
  getNetworkReach,
} from "@/lib/queries";

const VIEWPOINT_GROUP_ID = "4d627244-5598-4403-8704-979140ae9cac";

export default async function TestQueriesPage() {
  const [swayScore, electoralInfluence, growthOverTime, networkReach] =
    await Promise.all([
      getSwayScore(VIEWPOINT_GROUP_ID),
      getElectoralInfluence(VIEWPOINT_GROUP_ID),
      getGrowthOverTime(VIEWPOINT_GROUP_ID),
      getNetworkReach(VIEWPOINT_GROUP_ID),
    ]);

  return (
    <div style={{ padding: "2rem", fontFamily: "monospace" }}>
      <h1>Query Test Results</h1>
      <pre>
        {JSON.stringify(
          { swayScore, electoralInfluence, growthOverTime, networkReach },
          null,
          2
        )}
      </pre>
    </div>
  );
}
