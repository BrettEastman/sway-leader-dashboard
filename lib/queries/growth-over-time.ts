import { createAdminClient } from "../supabase/admin";
import type { GrowthOverTimeResult } from "./types";
import { BATCH_SIZE } from "./utils";

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

    // Step 1: Get all supporter profile IDs for this viewpoint group with their creation dates
    const { data: supporterRels, error: relsError } = await supabase
      .from("profile_viewpoint_group_rels")
      .select("profile_id, created_at")
      .eq("viewpoint_group_id", viewpointGroupId)
      .eq("type", "supporter")
      .order("created_at", { ascending: true });

    if (relsError || !supporterRels || supporterRels.length === 0) {
      console.error("Error fetching supporter relationships:", relsError);
      return {
        dataPoints: [],
        totalGrowth: 0,
      };
    }

    const profileIds = supporterRels.map((rel) => rel.profile_id);

    // Step 2: Get person IDs for these profiles (batched)
    const allProfiles: Array<{ id: string; person_id: string | null }> = [];
    let profilesError: {
      message: string;
      code?: string;
      details?: string;
      hint?: string;
    } | null = null;

    for (let i = 0; i < profileIds.length; i += BATCH_SIZE) {
      const batch = profileIds.slice(i, i + BATCH_SIZE);
      const { data: batchProfiles, error: batchError } = await supabase
        .from("profiles")
        .select("id, person_id")
        .in("id", batch);

      if (batchError) {
        profilesError = batchError;
        break;
      }

      if (batchProfiles) {
        allProfiles.push(...batchProfiles);
      }
    }

    const profiles = allProfiles;

    if (profilesError || !profiles || profiles.length === 0) {
      console.error("Error fetching profiles:", profilesError);
      return {
        dataPoints: [],
        totalGrowth: 0,
      };
    }

    const personIds = profiles
      .map((p) => p.person_id)
      .filter((id): id is string => id !== null);

    if (personIds.length === 0) {
      return {
        dataPoints: [],
        totalGrowth: 0,
      };
    }

    // Step 3: Get verified voters with their creation dates (batched)
    // We'll use the voter verification creation date as the time dimension
    const allVoterVerifications: Array<{
      id: string;
      person_id: string;
      created_at: string | null;
    }> = [];
    let vvError: {
      message: string;
      code?: string;
      details?: string;
      hint?: string;
    } | null = null;

    for (let i = 0; i < personIds.length; i += BATCH_SIZE) {
      const batch = personIds.slice(i, i + BATCH_SIZE);
      const { data: batchVv, error: batchError } = await supabase
        .from("voter_verifications")
        .select("id, person_id, created_at")
        .in("person_id", batch)
        .eq("is_fully_verified", true)
        .order("created_at", { ascending: true });

      if (batchError) {
        vvError = batchError;
        break;
      }

      if (batchVv) {
        allVoterVerifications.push(...batchVv);
      }
    }

    // Sort all results by created_at after batching
    const voterVerifications = allVoterVerifications.sort((a, b) => {
      const dateA = a.created_at || "";
      const dateB = b.created_at || "";
      return dateA.localeCompare(dateB);
    });

    if (vvError || !voterVerifications || voterVerifications.length === 0) {
      console.error("Error fetching voter verifications:", vvError);
      return {
        dataPoints: [],
        totalGrowth: 0,
      };
    }

    // Step 4: Create a map of person_id to profile creation date
    const profileMap = new Map<string, string>();
    supporterRels.forEach((rel) => {
      if (rel.created_at) {
        profileMap.set(rel.profile_id, rel.created_at);
      }
    });

    const personToProfileDateMap = new Map<string, string>();
    profiles.forEach((profile) => {
      if (profile.person_id) {
        const profileRel = supporterRels.find(
          (rel) => rel.profile_id === profile.id
        );
        if (profileRel?.created_at) {
          personToProfileDateMap.set(profile.person_id, profileRel.created_at);
        }
      }
    });

    // Step 5: Group verified voters by date (using voter verification created_at)
    // For each verified voter, use the earlier of: voter_verification.created_at or profile_viewpoint_group_rel.created_at
    const dateCounts = new Map<string, number>();

    voterVerifications.forEach((vv) => {
      const vvDate = vv.created_at
        ? new Date(vv.created_at).toISOString().split("T")[0]
        : null;
      const profileDate = vv.person_id
        ? personToProfileDateMap.get(vv.person_id)
        : null;

      let useDate: string | null = null;
      if (vvDate && profileDate) {
        // Use the earlier date
        useDate = vvDate < profileDate ? vvDate : profileDate;
      } else {
        useDate = vvDate || profileDate || null;
      }

      if (useDate) {
        const count = dateCounts.get(useDate) || 0;
        dateCounts.set(useDate, count + 1);
      }
    });

    // Step 6: Create time series data points with cumulative counts
    const sortedDates = Array.from(dateCounts.keys()).sort();
    const dataPoints: Array<{
      date: string;
      cumulativeCount: number;
      periodChange?: number;
    }> = [];
    let cumulativeCount = 0;
    let previousCount = 0;

    sortedDates.forEach((date) => {
      const dayCount = dateCounts.get(date) || 0;
      cumulativeCount += dayCount;
      const periodChange = cumulativeCount - previousCount;

      dataPoints.push({
        date,
        cumulativeCount,
        periodChange: periodChange > 0 ? periodChange : undefined,
      });

      previousCount = cumulativeCount;
    });

    // If we have data points, calculate growth metrics
    const totalGrowth =
      dataPoints.length > 0
        ? dataPoints[dataPoints.length - 1].cumulativeCount -
          (dataPoints[0]?.cumulativeCount || 0)
        : 0;

    const growthRate =
      dataPoints.length > 1 && dataPoints[0].cumulativeCount > 0
        ? ((dataPoints[dataPoints.length - 1].cumulativeCount -
            dataPoints[0].cumulativeCount) /
            dataPoints[0].cumulativeCount) *
          100
        : undefined;

    return {
      dataPoints,
      totalGrowth,
      growthRate,
    };
  } catch (error) {
    console.error("Unexpected error in getGrowthOverTime:", error);
    return {
      dataPoints: [],
      totalGrowth: 0,
    };
  }
}
