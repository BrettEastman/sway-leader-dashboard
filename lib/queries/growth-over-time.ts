import { createAdminClient } from "../supabase/admin";
import { fetchSwayAPI } from "./graphql-client";
import type { GrowthOverTimeResult, GrowthOverTimeDataPoint } from "./types";

/**
 * Get growth over time metrics for a leader from Supabase
 */
async function getGrowthOverTimeFromSupabase(
  viewpointGroupId: string
): Promise<GrowthOverTimeResult> {
  const supabase = createAdminClient();

  const { data, error: rpcError } = await supabase.rpc(
    "get_dashboard_growth_over_time",
    {
      p_viewpoint_group_id: viewpointGroupId,
    }
  );

  if (rpcError) {
    console.error("Error calling get_dashboard_growth_over_time:", rpcError);
    return {
      dataPoints: [],
      totalGrowth: 0,
    };
  }

  return data as GrowthOverTimeResult;
}

/**
 * Get growth over time metrics for a leader from the Sway GraphQL API
 * We query profileViewpointGroupRels with createdAt to build a time series
 */
async function getGrowthOverTimeFromAPI(
  viewpointGroupId: string
): Promise<GrowthOverTimeResult> {
  // Query profileViewpointGroupRels with their createdAt timestamps
  // to build a time series of supporter growth
  const query = `
    query GetGrowthOverTime($id: uuid!) {
      viewpointGroups(where: { id: { _eq: $id } }) {
        profileViewpointGroupRels(orderBy: { createdAt: ASC }) {
          createdAt
        }
      }
    }
  `;

  try {
    const data = await fetchSwayAPI<{
      viewpointGroups: Array<{
        profileViewpointGroupRels: Array<{
          createdAt: string;
        }>;
      }>;
    }>(query, { id: viewpointGroupId });

    if (!data.viewpointGroups || data.viewpointGroups.length === 0) {
      console.warn(`No viewpoint group found with id: ${viewpointGroupId}`);
      return { dataPoints: [], totalGrowth: 0 };
    }

    const rels = data.viewpointGroups[0].profileViewpointGroupRels || [];

    if (rels.length === 0) {
      return { dataPoints: [], totalGrowth: 0 };
    }

    // Group by date and calculate cumulative counts
    const countsByDate = new Map<string, number>();

    rels.forEach((rel) => {
      // Extract just the date part (YYYY-MM-DD)
      const date = rel.createdAt.split("T")[0];
      countsByDate.set(date, (countsByDate.get(date) || 0) + 1);
    });

    // Sort dates and build cumulative data points
    const sortedDates = Array.from(countsByDate.keys()).sort();
    const dataPoints: GrowthOverTimeDataPoint[] = [];
    let cumulativeCount = 0;
    let previousCount = 0;

    sortedDates.forEach((date) => {
      const dailyCount = countsByDate.get(date) || 0;
      cumulativeCount += dailyCount;
      const periodChange = cumulativeCount - previousCount;

      dataPoints.push({
        date,
        cumulativeCount,
        periodChange,
      });

      previousCount = cumulativeCount;
    });

    // Calculate total growth (difference between first and last)
    const totalGrowth =
      dataPoints.length > 0
        ? dataPoints[dataPoints.length - 1].cumulativeCount -
          (dataPoints[0].cumulativeCount - (dataPoints[0].periodChange || 0))
        : 0;

    // Calculate growth rate as percentage
    const firstCount =
      dataPoints.length > 0
        ? dataPoints[0].cumulativeCount - (dataPoints[0].periodChange || 0)
        : 0;
    const growthRate =
      firstCount > 0 ? ((cumulativeCount - firstCount) / firstCount) * 100 : 0;

    return {
      dataPoints,
      totalGrowth,
      growthRate,
    };
  } catch (error) {
    console.error("Error in getGrowthOverTimeFromAPI:", error);
    if (error instanceof Error) {
      console.error("Full error message:", error.message);
    }
    return { dataPoints: [], totalGrowth: 0 };
  }
}

/**
 * Get growth over time metrics for a leader (time series of Sway Score)
 * Switches between Supabase and Sway API based on dataSource parameter or DATA_SOURCE env var
 *
 * @param viewpointGroupId - The viewpoint group ID the leader belongs to
 * @param dataSource - Optional data source override ('sway_api' | 'supabase')
 * @returns Time series data showing cumulative verified voter count over time
 */
export async function getGrowthOverTime(
  viewpointGroupId: string,
  dataSource?: "supabase" | "sway_api"
): Promise<GrowthOverTimeResult> {
  // Input validation
  if (!viewpointGroupId || typeof viewpointGroupId !== "string") {
    console.error("Invalid viewpointGroupId provided to getGrowthOverTime");
    return {
      dataPoints: [],
      totalGrowth: 0,
    };
  }

  // Use provided dataSource or fall back to env var for backward compatibility
  const source =
    dataSource ||
    (process.env.DATA_SOURCE === "SWAY_API" ? "sway_api" : "supabase");

  try {
    if (source === "sway_api") {
      return await getGrowthOverTimeFromAPI(viewpointGroupId);
    }

    return await getGrowthOverTimeFromSupabase(viewpointGroupId);
  } catch (error) {
    console.error("Unexpected error in getGrowthOverTime:", error);
    return {
      dataPoints: [],
      totalGrowth: 0,
    };
  }
}
