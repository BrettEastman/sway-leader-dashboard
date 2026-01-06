import { createAdminClient } from "../supabase/admin";
import { fetchSwayAPI } from "./graphql-client";
import type { SwayScoreResult } from "./types";

/**
 * Get the Sway Score for a leader from Supabase
 */
async function getSwayScoreFromSupabase(
  viewpointGroupId: string
): Promise<SwayScoreResult> {
  const supabase = createAdminClient();

  const { data, error: rpcError } = await supabase.rpc("get_sway_score_rpc", {
    p_viewpoint_group_id: viewpointGroupId,
  });

  if (rpcError) {
    console.error("Error calling get_sway_score_rpc:", rpcError);
    return { count: 0, totalSupporters: 0 };
  }

  if (!data || data.length === 0) {
    return { count: 0, totalSupporters: 0 };
  }

  return {
    count: Number(data[0].count),
    totalSupporters: Number(data[0].total_supporters),
  };
}

/**
 * Get the Sway Score for a leader from the Sway GraphQL API
 */
async function getSwayScoreFromAPI(
  viewpointGroupId: string
): Promise<SwayScoreResult> {
  // Use aggregate queries to get counts from profileViewpointGroupRels
  // First get total supporters count
  const query = `
    query GetSwayScore($id: uuid!) {
      viewpointGroups(where: { id: { _eq: $id } }) {
        id
        title
        profileViewpointGroupRelsAggregate {
          aggregate {
            count
          }
        }
      }
    }
  `;

  try {
    const data = await fetchSwayAPI<{
      viewpointGroups: Array<{
        id: string;
        title?: string | null;
        profileViewpointGroupRelsAggregate: {
          aggregate: {
            count: number;
          } | null;
        };
      }>;
    }>(query, { id: viewpointGroupId });

    if (!data.viewpointGroups || data.viewpointGroups.length === 0) {
      console.warn(`No viewpoint group found with id: ${viewpointGroupId}`);
      return { count: 0, totalSupporters: 0 };
    }

    const viewpointGroup = data.viewpointGroups[0];
    const totalSupporters =
      viewpointGroup.profileViewpointGroupRelsAggregate?.aggregate?.count ?? 0;

    // Use the summary field which contains pre-computed counts
    let verifiedCount = totalSupporters; // Default to total supporters

    // Query the summary object for counts
    try {
      const summaryQuery = `
        query GetSwayScoreSummary($id: uuid!) {
          viewpointGroups(where: { id: { _eq: $id } }) {
            summary {
              verifiedSupporterCount
              supporterCount
            }
          }
        }
      `;

      const summaryData = await fetchSwayAPI<{
        viewpointGroups: Array<{
          summary: {
            verifiedSupporterCount?: number;
            supporterCount?: number;
          } | null;
        }>;
      }>(summaryQuery, { id: viewpointGroupId });

      const summary = summaryData.viewpointGroups[0]?.summary;
      if (summary) {
        verifiedCount = summary.verifiedSupporterCount ?? totalSupporters;
        const summaryTotal = summary.supporterCount ?? totalSupporters;
        return {
          count: verifiedCount,
          totalSupporters: summaryTotal,
        };
      }
    } catch (summaryError) {
      console.warn(
        "Could not query summary for verified supporter count. Using aggregate count.",
        summaryError instanceof Error ? summaryError.message : summaryError
      );
    }

    return {
      count: verifiedCount,
      totalSupporters: totalSupporters,
    };
  } catch (error) {
    console.error("Error in getSwayScoreFromAPI:", error);
    if (error instanceof Error) {
      console.error("Full error message:", error.message);
    }
    return { count: 0, totalSupporters: 0 };
  }
}

/**
 * Get the Sway Score for a leader (total verified voter count)
 * Switches between Supabase and Sway API based on dataSource parameter or DATA_SOURCE env var
 *
 * @param viewpointGroupId - The viewpoint group ID the leader belongs to
 * @param dataSource - Optional data source override ('sway_api' | 'supabase')
 * @returns The total count of verified voters aligned with the leader
 */
export async function getSwayScore(
  viewpointGroupId: string,
  dataSource?: "supabase" | "sway_api"
): Promise<SwayScoreResult> {
  // Input validation
  if (!viewpointGroupId || typeof viewpointGroupId !== "string") {
    console.error("Invalid viewpointGroupId provided to getSwayScore");
    return { count: 0, totalSupporters: 0 };
  }

  // Use provided dataSource or fall back to env var for backward compatibility
  const source =
    dataSource ||
    (process.env.DATA_SOURCE === "SWAY_API" ? "sway_api" : "supabase");

  try {
    if (source === "sway_api") {
      return await getSwayScoreFromAPI(viewpointGroupId);
    }

    return await getSwayScoreFromSupabase(viewpointGroupId);
  } catch (error) {
    console.error("Unexpected error in getSwayScore:", error);
    return { count: 0, totalSupporters: 0 };
  }
}
