import { createAdminClient } from "../supabase/admin";
import type { GrowthOverTimeResult } from "./types";

/**
 * Get growth over time metrics for a leader (time series of Sway Score)
 *
 * @param viewpointGroupId - The viewpoint group ID the leader belongs to
 * @returns Time series data showing cumulative verified voter count over time
 */
export async function getGrowthOverTime(
  viewpointGroupId: string
): Promise<GrowthOverTimeResult> {
  try {
    // Input validation
    if (!viewpointGroupId || typeof viewpointGroupId !== "string") {
      console.error("Invalid viewpointGroupId provided to getGrowthOverTime");
      return {
        dataPoints: [],
        totalGrowth: 0,
      };
    }

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
  } catch (error) {
    console.error("Unexpected error in getGrowthOverTime:", error);
    return {
      dataPoints: [],
      totalGrowth: 0,
    };
  }
}
