import { createAdminClient } from "../supabase/admin";
import { fetchSwayAPI } from "./graphql-client";
import type { NetworkReachResult, NetworkLeader } from "./types";

async function getNetworkReachFromSupabase(
  viewpointGroupId: string
): Promise<NetworkReachResult> {
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
}

/**
 * Get network reach metrics from Sway GraphQL API instead of Supabase
 * Network reach = supporters of this group who are LEADERS of other viewpoint groups
 * Uses the `type` field on profileViewpointGroupRels to identify actual leaders
 */
async function getNetworkReachFromAPI(
  viewpointGroupId: string
): Promise<NetworkReachResult> {
  const networkLeaders: NetworkLeader[] = [];
  let totalDownstreamReach = 0;

  try {
    // Get all supporters/members of this viewpoint group with their profile info
    // Include the `type` field to identify their role in each group
    const supportersQuery = `
      query GetSupportersWithProfiles($id: uuid!) {
        viewpointGroups(where: { id: { _eq: $id } }) {
          profileViewpointGroupRels(limit: 10000) {
            type
            profile {
              id
              displayNameLong
              displayNameShort
              profileViewpointGroupRels {
                type
                viewpointGroup {
                  id
                  title
                  summary {
                    supporterCount
                    verifiedSupporterCount
                  }
                }
              }
            }
          }
        }
      }
    `;

    const supportersData = await fetchSwayAPI<{
      viewpointGroups: Array<{
        profileViewpointGroupRels: Array<{
          type: string | null;
          profile: {
            id: string;
            displayNameLong: string;
            displayNameShort: string | null;
            profileViewpointGroupRels: Array<{
              type: string | null;
              viewpointGroup: {
                id: string;
                title: string | null;
                summary?: {
                  supporterCount: number;
                  verifiedSupporterCount: number;
                } | null;
              };
            }>;
          } | null;
        }>;
      }>;
    }>(supportersQuery, { id: viewpointGroupId });

    if (supportersData.viewpointGroups?.length > 0) {
      const vg = supportersData.viewpointGroups[0];

      // For each supporter, find groups where they are the LEADER
      vg.profileViewpointGroupRels?.forEach((rel) => {
        const profile = rel.profile;
        if (!profile) return;

        // Find viewpoint groups where this profile is a LEADER (excluding current group)
        const leaderGroups = profile.profileViewpointGroupRels?.filter(
          (pvgr) =>
            pvgr.viewpointGroup.id !== viewpointGroupId &&
            (pvgr.type === "leader" || pvgr.type === "administrator")
        );

        leaderGroups?.forEach((pvgr) => {
          const group = pvgr.viewpointGroup;
          const verifiedCount = group.summary?.verifiedSupporterCount || 0;
          const supporterCount = group.summary?.supporterCount || 0;

          // Only include groups with actual supporters
          if (supporterCount > 0 || verifiedCount > 0) {
            networkLeaders.push({
              profileId: profile.id,
              displayName: profile.displayNameShort || profile.displayNameLong,
              viewpointGroupId: group.id,
              viewpointGroupTitle: group.title,
              downstreamVerifiedVoters: verifiedCount,
              supporterCount: supporterCount,
            });

            totalDownstreamReach += verifiedCount;
          }
        });
      });
    }
  } catch (error) {
    console.warn(
      "Could not query network reach from Sway API:",
      error instanceof Error ? error.message : error
    );
  }

  // Sort by downstream reach (highest first)
  networkLeaders.sort(
    (a, b) => b.downstreamVerifiedVoters - a.downstreamVerifiedVoters
  );

  return {
    networkLeaders,
    totalDownstreamReach,
  };
}

/**
 * Get network reach metrics for a leader
 * Finds supporters who became leaders themselves and counts their downstream verified voters
 *
 * @param viewpointGroupId - The viewpoint group ID the leader belongs to
 * @returns Network leaders (supporters who became leaders) with their downstream reach
 */
/**
 * Get network reach metrics for a leader
 * Finds supporters who became leaders themselves and counts their downstream verified voters
 * Switches between Supabase and Sway API based on dataSource parameter or DATA_SOURCE env var
 *
 * @param viewpointGroupId - The viewpoint group ID the leader belongs to
 * @param dataSource - Optional data source override ('sway_api' | 'supabase')
 * @returns Network leaders (supporters who became leaders) with their downstream reach
 */
export async function getNetworkReach(
  viewpointGroupId: string,
  dataSource?: "supabase" | "sway_api"
): Promise<NetworkReachResult> {
  if (!viewpointGroupId || typeof viewpointGroupId !== "string") {
    console.error("Invalid viewpointGroupId provided to getNetworkReach");
    return {
      networkLeaders: [],
      totalDownstreamReach: 0,
    };
  }

  // Use provided dataSource or fall back to env var for backward compatibility
  const source =
    dataSource ||
    (process.env.DATA_SOURCE === "SWAY_API" ? "sway_api" : "supabase");

  try {
    if (source === "sway_api") {
      return await getNetworkReachFromAPI(viewpointGroupId);
    }

    return await getNetworkReachFromSupabase(viewpointGroupId);
  } catch (error) {
    console.error("Unexpected error in getNetworkReach:", error);
    return {
      networkLeaders: [],
      totalDownstreamReach: 0,
    };
  }
}
