import { createAdminClient } from "../supabase/admin";
import { fetchSwayAPI } from "./graphql-client";
import type {
  ElectoralInfluenceResult,
  ElectoralInfluenceByJurisdiction,
  ElectoralInfluenceByRace,
  UpcomingElection,
} from "./types";

/**
 * Get electoral influence metrics for a leader from Supabase
 */
async function getElectoralInfluenceFromSupabase(
  viewpointGroupId: string
): Promise<ElectoralInfluenceResult> {
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
}

/**
 * Get electoral influence metrics for a leader from the Sway GraphQL API
 * This queries elections and ballot items to build influence data
 */
async function getElectoralInfluenceFromAPI(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _viewpointGroupId: string
): Promise<ElectoralInfluenceResult> {
  const byJurisdiction: ElectoralInfluenceByJurisdiction[] = [];
  const byRace: ElectoralInfluenceByRace[] = [];
  const upcomingElections: UpcomingElection[] = [];

  try {
    // Simplified query using only fields we know exist
    // jurisdiction is on BallotItems, race and measure link to related tables
    const electionsQuery = `
      query GetUpcomingElections {
        elections(
          where: { pollDate: { _gte: "now()" } }
          orderBy: { pollDate: ASC }
          limit: 10
        ) {
          id
          name
          pollDate
          ballotItems {
            id
            jurisdictionId
            jurisdiction {
              id
              name
              state
            }
          }
        }
      }
    `;

    const electionsData = await fetchSwayAPI<{
      elections: Array<{
        id: string;
        name: string | null;
        pollDate: string | null;
        ballotItems?: Array<{
          id: string;
          jurisdictionId: string;
          jurisdiction: {
            id: string;
            name: string | null;
            state: string | null;
          } | null;
        }>;
      }>;
    }>(electionsQuery);

    // Process elections into the expected format
    if (electionsData.elections) {
      electionsData.elections.forEach((election) => {
        const ballotItems = election.ballotItems || [];

        upcomingElections.push({
          electionId: election.id,
          electionName: election.name,
          pollDate: election.pollDate,
          totalSupporters: 0,
          races: ballotItems.map((item) => ({
            raceId: item.id,
            supporterCount: 0,
          })),
        });

        // Build byRace and byJurisdiction
        ballotItems.forEach((item) => {
          byRace.push({
            raceId: item.id,
            raceName: null, // Would need to query race/measure details separately
            jurisdictionId: item.jurisdiction?.id || item.jurisdictionId || "",
            jurisdictionName: item.jurisdiction?.name || null,
            electionId: election.id,
            electionName: election.name,
            pollDate: election.pollDate,
            supporterCount: 0,
          });

          if (item.jurisdiction) {
            const existing = byJurisdiction.find(
              (j) => j.jurisdictionId === item.jurisdiction!.id
            );
            if (!existing) {
              byJurisdiction.push({
                jurisdictionId: item.jurisdiction.id,
                jurisdictionName: item.jurisdiction.name,
                supporterCount: 0,
                state: item.jurisdiction.state,
              });
            }
          }
        });
      });
    }

    // Note: Supporter counts and race names would require additional queries
    // which aren't directly available through this simplified approach.
  } catch (error) {
    console.warn(
      "Could not query elections from Sway API:",
      error instanceof Error ? error.message : error
    );
  }

  return {
    byJurisdiction,
    byRace,
    upcomingElections,
  };
}

/**
 * Get electoral influence metrics for a leader
 * Includes supporter counts by jurisdiction, by race, and upcoming elections
 * Switches between Supabase and Sway API based on DATA_SOURCE env var
 *
 * @param viewpointGroupId - The viewpoint group ID the leader belongs to
 * @returns Electoral influence breakdown by jurisdiction, race, and upcoming elections
 */
export async function getElectoralInfluence(
  viewpointGroupId: string
): Promise<ElectoralInfluenceResult> {
  // Input validation
  if (!viewpointGroupId || typeof viewpointGroupId !== "string") {
    console.error("Invalid viewpointGroupId provided to getElectoralInfluence");
    return {
      byJurisdiction: [],
      byRace: [],
      upcomingElections: [],
    };
  }

  try {
    if (process.env.DATA_SOURCE === "SWAY_API") {
      return await getElectoralInfluenceFromAPI(viewpointGroupId);
    }

    return await getElectoralInfluenceFromSupabase(viewpointGroupId);
  } catch (error) {
    console.error("Unexpected error in getElectoralInfluence:", error);
    return {
      byJurisdiction: [],
      byRace: [],
      upcomingElections: [],
    };
  }
}
