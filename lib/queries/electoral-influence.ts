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
  viewpointGroupId: string
): Promise<ElectoralInfluenceResult> {
  const byJurisdiction: ElectoralInfluenceByJurisdiction[] = [];
  const byRace: ElectoralInfluenceByRace[] = [];
  const upcomingElections: UpcomingElection[] = [];

  // First, get supporter data from the viewpoint group
  const supporterStateCounts = new Map<string, number>();

  try {
    // Query supporters with location field (free-form string)
    const supportersQuery = `
      query GetSupportersWithLocation($id: uuid!) {
        viewpointGroups(where: { id: { _eq: $id } }) {
          summary {
            supporterCount
            verifiedSupporterCount
          }
          profileViewpointGroupRels {
            profile {
              location
            }
          }
        }
      }
    `;

    const supportersData = await fetchSwayAPI<{
      viewpointGroups: Array<{
        summary: {
          supporterCount: number;
          verifiedSupporterCount: number;
        } | null;
        profileViewpointGroupRels: Array<{
          profile: {
            location?: string | null;
          } | null;
        }>;
      }>;
    }>(supportersQuery, { id: viewpointGroupId });

    if (supportersData.viewpointGroups?.length > 0) {
      const vg = supportersData.viewpointGroups[0];

      // Count supporters by state (extracted from location string)
      // Location can be like "California", "San Francisco, CA", "TX", etc.
      const stateAbbreviations: Record<string, string> = {
        alabama: "AL",
        alaska: "AK",
        arizona: "AZ",
        arkansas: "AR",
        california: "CA",
        colorado: "CO",
        connecticut: "CT",
        delaware: "DE",
        florida: "FL",
        georgia: "GA",
        hawaii: "HI",
        idaho: "ID",
        illinois: "IL",
        indiana: "IN",
        iowa: "IA",
        kansas: "KS",
        kentucky: "KY",
        louisiana: "LA",
        maine: "ME",
        maryland: "MD",
        massachusetts: "MA",
        michigan: "MI",
        minnesota: "MN",
        mississippi: "MS",
        missouri: "MO",
        montana: "MT",
        nebraska: "NE",
        nevada: "NV",
        "new hampshire": "NH",
        "new jersey": "NJ",
        "new mexico": "NM",
        "new york": "NY",
        "north carolina": "NC",
        "north dakota": "ND",
        ohio: "OH",
        oklahoma: "OK",
        oregon: "OR",
        pennsylvania: "PA",
        "rhode island": "RI",
        "south carolina": "SC",
        "south dakota": "SD",
        tennessee: "TN",
        texas: "TX",
        utah: "UT",
        vermont: "VT",
        virginia: "VA",
        washington: "WA",
        "west virginia": "WV",
        wisconsin: "WI",
        wyoming: "WY",
        "district of columbia": "DC",
      };
      const validStateAbbrevs = new Set(Object.values(stateAbbreviations));

      vg.profileViewpointGroupRels?.forEach((rel) => {
        const location = rel.profile?.location;
        if (location) {
          let state: string | null = null;
          const locationLower = location.toLowerCase().trim();

          // Try to match full state name
          if (stateAbbreviations[locationLower]) {
            state = stateAbbreviations[locationLower];
          } else {
            // Try to extract state abbreviation (e.g., "San Francisco, CA")
            const parts = location.split(/[,\s]+/);
            for (const part of parts) {
              const upper = part.toUpperCase();
              if (validStateAbbrevs.has(upper)) {
                state = upper;
                break;
              }
            }
          }

          if (state) {
            const count = supporterStateCounts.get(state) || 0;
            supporterStateCounts.set(state, count + 1);
          }
        }
      });
    }
  } catch (error) {
    console.warn(
      "Could not query supporter locations:",
      error instanceof Error ? error.message : error
    );
  }

  // STEP 1: Build byJurisdiction from WHERE SUPPORTERS ARE (leader-centric)
  // This shows the leader's "electoral footprint"
  const supporterStates = Array.from(supporterStateCounts.entries());
  supporterStates
    .sort((a, b) => b[1] - a[1]) // Sort by count descending
    .forEach(([state, count]) => {
      byJurisdiction.push({
        jurisdictionId: state, // Using state as ID since we don't have jurisdiction IDs
        jurisdictionName: state, // State abbreviation as name
        supporterCount: count,
        state: state,
      });
    });

  // STEP 2: Find upcoming elections ONLY in states where the leader has supporters
  try {
    const electionsQuery = `
      query GetUpcomingElections {
        elections(
          where: { pollDate: { _gte: "now()" } }
          orderBy: { pollDate: ASC }
          limit: 50
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

    // Filter to only elections where the leader HAS supporters
    if (electionsData.elections) {
      electionsData.elections.forEach((election) => {
        const ballotItems = election.ballotItems || [];

        // Check if any ballot item is in a state where leader has supporters
        const relevantBallotItems = ballotItems.filter((item) => {
          const state = item.jurisdiction?.state || "";
          return supporterStateCounts.has(state);
        });

        // Only include election if leader has supporters in at least one jurisdiction
        if (relevantBallotItems.length > 0) {
          let electionTotalSupporters = 0;

          relevantBallotItems.forEach((item) => {
            const state = item.jurisdiction?.state || "";
            const supporterCount = supporterStateCounts.get(state) || 0;
            electionTotalSupporters += supporterCount;

            byRace.push({
              raceId: item.id,
              raceName: null,
              jurisdictionId:
                item.jurisdiction?.id || item.jurisdictionId || "",
              jurisdictionName: item.jurisdiction?.name || null,
              electionId: election.id,
              electionName: election.name,
              pollDate: election.pollDate,
              supporterCount,
            });
          });

          upcomingElections.push({
            electionId: election.id,
            electionName: election.name,
            pollDate: election.pollDate,
            totalSupporters: electionTotalSupporters,
            races: relevantBallotItems.map((item) => ({
              raceId: item.id,
              supporterCount:
                supporterStateCounts.get(item.jurisdiction?.state || "") || 0,
            })),
          });
        }
      });
    }
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
