import { createAdminClient } from "../supabase/admin";
import type { ElectoralInfluenceResult } from "./types";

/**
 * Get electoral influence metrics for a leader
 * Includes supporter counts by jurisdiction, by race, and upcoming elections
 *
 * @param viewpointGroupId - The viewpoint group ID the leader belongs to
 * @returns Electoral influence breakdown by jurisdiction, race, and upcoming elections
 */
export async function getElectoralInfluence(
  viewpointGroupId: string
): Promise<ElectoralInfluenceResult> {
  try {
    // Input validation
    if (!viewpointGroupId || typeof viewpointGroupId !== "string") {
      console.error(
        "Invalid viewpointGroupId provided to getElectoralInfluence"
      );
      return {
        byJurisdiction: [],
        byRace: [],
        upcomingElections: [],
      };
    }

    const supabase = createAdminClient();

    const { data, error: rpcError } = await supabase.rpc(
      "get_dashboard_electoral_influence",
      {
        p_viewpoint_group_id: viewpointGroupId,
      }
    );

    if (rpcError) {
      console.error("Error calling get_dashboard_electoral_influence:", rpcError);
      return {
        byJurisdiction: [],
        byRace: [],
        upcomingElections: [],
      };
    }

    return data as ElectoralInfluenceResult;
  } catch (error) {
    console.error("Unexpected error in getElectoralInfluence:", error);
    return {
      byJurisdiction: [],
      byRace: [],
      upcomingElections: [],
    };
  }
}
