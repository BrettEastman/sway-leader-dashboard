import { createAdminClient } from "../supabase/admin";
import type { NetworkReachResult } from "./types";

/**
 * Get network reach metrics for a leader
 * Finds supporters who became leaders themselves and counts their downstream verified voters
 *
 * @param viewpointGroupId - The viewpoint group ID the leader belongs to
 * @returns Network leaders (supporters who became leaders) with their downstream reach
 */
export async function getNetworkReach(
  viewpointGroupId: string
): Promise<NetworkReachResult> {
  try {
    // Input validation
    if (!viewpointGroupId || typeof viewpointGroupId !== "string") {
      console.error("Invalid viewpointGroupId provided to getNetworkReach");
      return {
        networkLeaders: [],
        totalDownstreamReach: 0,
      };
    }

    const supabase = createAdminClient();

    const { data, error: rpcError } = await supabase.rpc(
      "get_dashboard_network_reach",
      {
        p_viewpoint_group_id: viewpointGroupId,
      }
    );

    if (rpcError) {
      console.error("Error calling get_dashboard_network_reach:", rpcError);
      return {
        networkLeaders: [],
        totalDownstreamReach: 0,
      };
    }

    return data as NetworkReachResult;
  } catch (error) {
    console.error("Unexpected error in getNetworkReach:", error);
    return {
      networkLeaders: [],
      totalDownstreamReach: 0,
    };
  }
}
