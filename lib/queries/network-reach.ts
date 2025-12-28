import { createAdminClient } from "../supabase/admin";
import type { NetworkReachResult } from "./types";
import { BATCH_SIZE } from "./utils";

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

    // Step 1: Find supporters who are also leaders in other viewpoint groups
    // Get all supporters of this viewpoint group
    const { data: supporterRels, error: supporterError } = await supabase
      .from("profile_viewpoint_group_rels")
      .select("profile_id")
      .eq("viewpoint_group_id", viewpointGroupId)
      .eq("type", "supporter");

    if (supporterError || !supporterRels || supporterRels.length === 0) {
      console.error("Error fetching supporter relationships:", supporterError);
      return {
        networkLeaders: [],
        totalDownstreamReach: 0,
      };
    }

    const supporterProfileIds = supporterRels.map((rel) => rel.profile_id);
    const uniqueSupporterCount = [...new Set(supporterProfileIds)].length;
    console.log(
      `[getNetworkReach] Found ${uniqueSupporterCount} unique supporters of viewpoint group ${viewpointGroupId}`
    );

    // Step 2: Find which of these supporters are also leaders in other viewpoint groups (batched)
    const allLeaderRels: Array<{
      profile_id: string;
      viewpoint_group_id: string;
    }> = [];
    let leaderError: {
      message: string;
      code?: string;
      details?: string;
      hint?: string;
    } | null = null;

    for (let i = 0; i < supporterProfileIds.length; i += BATCH_SIZE) {
      const batch = supporterProfileIds.slice(i, i + BATCH_SIZE);
      const { data: batchRels, error: batchError } = await supabase
        .from("profile_viewpoint_group_rels")
        .select("profile_id, viewpoint_group_id")
        .in("profile_id", batch)
        .eq("type", "leader")
        .neq("viewpoint_group_id", viewpointGroupId);

      if (batchError) {
        leaderError = batchError;
        break;
      }

      if (batchRels) {
        allLeaderRels.push(...batchRels);
      }
    }

    const leaderRels = allLeaderRels;
    const uniqueNetworkLeaderCount = leaderRels.length
      ? [...new Set(leaderRels.map((r) => r.profile_id))].length
      : 0;

    if (leaderError) {
      console.error("Error fetching leader relationships:", leaderError);
      return {
        networkLeaders: [],
        totalDownstreamReach: 0,
      };
    }

    if (!leaderRels || leaderRels.length === 0) {
      console.log(
        `[getNetworkReach] No network leaders found. None of the ${uniqueSupporterCount} supporters are leaders in OTHER viewpoint groups.`
      );
      console.log(
        `[getNetworkReach] Note: Leaders in the same viewpoint group are not counted as network leaders.`
      );
      return {
        networkLeaders: [],
        totalDownstreamReach: 0,
      };
    }

    console.log(
      `[getNetworkReach] Found ${uniqueNetworkLeaderCount} network leaders (supporters who are also leaders in other viewpoint groups)`
    );

    // Step 3: Get profile and viewpoint group details for network leaders
    const networkLeaderProfileIds = [
      ...new Set(leaderRels.map((rel) => rel.profile_id)),
    ];
    const networkLeaderViewpointGroupIds = [
      ...new Set(leaderRels.map((rel) => rel.viewpoint_group_id)),
    ];

    // Batch profiles query if needed
    let profiles: Array<{
      id: string;
      display_name_long: string | null;
      display_name_short: string | null;
      person_id: string | null;
    }> = [];
    let profilesError: {
      message: string;
      code?: string;
      details?: string;
      hint?: string;
    } | null = null;

    if (networkLeaderProfileIds.length > 0) {
      if (networkLeaderProfileIds.length <= BATCH_SIZE) {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, display_name_long, display_name_short, person_id")
          .in("id", networkLeaderProfileIds);
        profiles = data || [];
        profilesError = error;
      } else {
        const allProfiles: Array<{
          id: string;
          display_name_long: string | null;
          display_name_short: string | null;
          person_id: string | null;
        }> = [];
        for (let i = 0; i < networkLeaderProfileIds.length; i += BATCH_SIZE) {
          const batch = networkLeaderProfileIds.slice(i, i + BATCH_SIZE);
          const { data: batchData, error: batchError } = await supabase
            .from("profiles")
            .select("id, display_name_long, display_name_short, person_id")
            .in("id", batch);

          if (batchError) {
            profilesError = batchError;
            break;
          }

          if (batchData) {
            allProfiles.push(...batchData);
          }
        }
        profiles = allProfiles;
      }
    }

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      return {
        networkLeaders: [],
        totalDownstreamReach: 0,
      };
    }

    // Batch viewpoint groups query if needed
    let viewpointGroups: Array<{ id: string; title: string | null }> = [];
    let vgError: {
      message: string;
      code?: string;
      details?: string;
      hint?: string;
    } | null = null;

    if (networkLeaderViewpointGroupIds.length > 0) {
      if (networkLeaderViewpointGroupIds.length <= BATCH_SIZE) {
        const { data, error } = await supabase
          .from("viewpoint_groups")
          .select("id, title")
          .in("id", networkLeaderViewpointGroupIds);
        viewpointGroups = data || [];
        vgError = error;
      } else {
        const allViewpointGroups: Array<{ id: string; title: string | null }> =
          [];
        for (
          let i = 0;
          i < networkLeaderViewpointGroupIds.length;
          i += BATCH_SIZE
        ) {
          const batch = networkLeaderViewpointGroupIds.slice(i, i + BATCH_SIZE);
          const { data: batchData, error: batchError } = await supabase
            .from("viewpoint_groups")
            .select("id, title")
            .in("id", batch);

          if (batchError) {
            vgError = batchError;
            break;
          }

          if (batchData) {
            allViewpointGroups.push(...batchData);
          }
        }
        viewpointGroups = allViewpointGroups;
      }
    }

    if (vgError) {
      console.error("Error fetching viewpoint groups:", vgError);
      return {
        networkLeaders: [],
        totalDownstreamReach: 0,
      };
    }

    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
    const viewpointGroupMap = new Map(
      (viewpointGroups || []).map((vg) => [vg.id, vg])
    );

    // Step 4: For each network leader, count their downstream verified voters
    const networkLeaders: Array<{
      profileId: string;
      displayName: string | null;
      viewpointGroupId: string;
      viewpointGroupTitle: string | null;
      downstreamVerifiedVoters: number;
      supporterCount?: number;
    }> = [];

    let totalDownstreamReach = 0;

    // Group leader relationships by profile to handle multiple viewpoint groups per profile
    const profileToViewpointGroups = new Map<string, string[]>();
    leaderRels.forEach((rel) => {
      const existing = profileToViewpointGroups.get(rel.profile_id) || [];
      existing.push(rel.viewpoint_group_id);
      profileToViewpointGroups.set(rel.profile_id, existing);
    });

    for (const [profileId, vgIds] of profileToViewpointGroups.entries()) {
      const profile = profileMap.get(profileId);
      if (!profile) {
        continue;
      }

      // For each viewpoint group this profile leads, count downstream verified voters
      for (const vgId of vgIds) {
        const viewpointGroup = viewpointGroupMap.get(vgId);

        // Get all supporters of this network leader's viewpoint group
        const { data: downstreamSupporterRels, error: dsError } = await supabase
          .from("profile_viewpoint_group_rels")
          .select("profile_id")
          .eq("viewpoint_group_id", vgId)
          .eq("type", "supporter");

        if (dsError) {
          console.error(
            `Error fetching downstream supporters for VG ${vgId}:`,
            dsError
          );
          continue;
        }

        const downstreamProfileIds =
          downstreamSupporterRels?.map((rel) => rel.profile_id) || [];

        if (downstreamProfileIds.length === 0) {
          networkLeaders.push({
            profileId,
            displayName:
              profile.display_name_long || profile.display_name_short || null,
            viewpointGroupId: vgId,
            viewpointGroupTitle: viewpointGroup?.title || null,
            downstreamVerifiedVoters: 0,
            supporterCount: 0,
          });
          continue;
        }

        // Get person IDs for downstream profiles (batched if needed)
        const allDownstreamProfiles: Array<{ person_id: string | null }> = [];
        let dpError: {
          message: string;
          code?: string;
          details?: string;
          hint?: string;
        } | null = null;

        if (downstreamProfileIds.length <= BATCH_SIZE) {
          const { data, error } = await supabase
            .from("profiles")
            .select("person_id")
            .in("id", downstreamProfileIds);
          if (data) allDownstreamProfiles.push(...data);
          dpError = error;
        } else {
          for (let i = 0; i < downstreamProfileIds.length; i += BATCH_SIZE) {
            const batch = downstreamProfileIds.slice(i, i + BATCH_SIZE);
            const { data: batchData, error: batchError } = await supabase
              .from("profiles")
              .select("person_id")
              .in("id", batch);

            if (batchError) {
              dpError = batchError;
              break;
            }

            if (batchData) {
              allDownstreamProfiles.push(...batchData);
            }
          }
        }

        const downstreamProfiles = allDownstreamProfiles;

        if (dpError) {
          console.error(
            `Error fetching downstream profiles for VG ${vgId}:`,
            dpError
          );
          continue;
        }

        const downstreamPersonIds = (downstreamProfiles || [])
          .map((p) => p.person_id)
          .filter((id): id is string => id !== null);

        if (downstreamPersonIds.length === 0) {
          networkLeaders.push({
            profileId,
            displayName:
              profile.display_name_long || profile.display_name_short || null,
            viewpointGroupId: vgId,
            viewpointGroupTitle: viewpointGroup?.title || null,
            downstreamVerifiedVoters: 0,
            supporterCount: downstreamProfileIds.length,
          });
          continue;
        }

        // Count verified voters (batched)
        let verifiedVoterCount = 0;
        let vvError: {
          message: string;
          code?: string;
          details?: string;
          hint?: string;
        } | null = null;

        for (let i = 0; i < downstreamPersonIds.length; i += BATCH_SIZE) {
          const batch = downstreamPersonIds.slice(i, i + BATCH_SIZE);
          const { count: batchCount, error: batchError } = await supabase
            .from("voter_verifications")
            .select("id", { count: "exact", head: true })
            .in("person_id", batch)
            .eq("is_fully_verified", true);

          if (batchError) {
            vvError = batchError;
            break;
          }

          verifiedVoterCount += batchCount || 0;
        }

        if (vvError) {
          console.error(
            `Error counting downstream verified voters for VG ${vgId}:`,
            vvError
          );
          continue;
        }

        const downstreamCount = verifiedVoterCount || 0;
        totalDownstreamReach += downstreamCount;

        networkLeaders.push({
          profileId,
          displayName:
            profile.display_name_long || profile.display_name_short || null,
          viewpointGroupId: vgId,
          viewpointGroupTitle: viewpointGroup?.title || null,
          downstreamVerifiedVoters: downstreamCount,
          supporterCount: downstreamProfileIds.length,
        });
      }
    }

    return {
      networkLeaders: networkLeaders.sort(
        (a, b) => b.downstreamVerifiedVoters - a.downstreamVerifiedVoters
      ),
      totalDownstreamReach,
    };
  } catch (error) {
    console.error("Unexpected error in getNetworkReach:", error);
    return {
      networkLeaders: [],
      totalDownstreamReach: 0,
    };
  }
}
