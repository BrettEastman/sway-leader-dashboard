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

// Helper: Extract state abbreviation from a location string
function extractState(location: string): string | null {
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
  const validAbbrevs = new Set(Object.values(stateAbbreviations));

  const locationLower = location.toLowerCase().trim();

  // Check if it's a full state name
  if (stateAbbreviations[locationLower]) {
    return stateAbbreviations[locationLower];
  }

  // Try to extract abbreviation from location (e.g., "San Francisco, CA")
  const parts = location.split(/[,\s]+/);
  for (const part of parts) {
    const upper = part.toUpperCase();
    if (validAbbrevs.has(upper)) {
      return upper;
    }
  }

  return null;
}

/**
 * Get electoral influence metrics for a leader from the Sway GraphQL API
 *
 * Shows: "Your supporters are in these states. Here are the elections they can vote in."
 * Only returns elections in states where the leader has supporters.
 */
async function getElectoralInfluenceFromAPI(
  viewpointGroupId: string
): Promise<ElectoralInfluenceResult> {
  const byJurisdiction: ElectoralInfluenceByJurisdiction[] = [];
  const byRace: ElectoralInfluenceByRace[] = [];
  const upcomingElections: UpcomingElection[] = [];

  // Step 1: Get supporter locations
  // - supportersByLocation: actual locations as entered (for byJurisdiction display)
  // - supportersByState: extracted states (for filtering elections)
  const supportersByLocation = new Map<string, number>();
  const supportersByState = new Map<string, number>();
  let supportersWithoutLocation = 0;

  try {
    // Note: summary.supporterCount (734) may be higher than profileViewpointGroupRels (307)
    // because some supporters don't have profile data exposed through this API
    const supportersQuery = `
      query GetSupportersWithLocation($id: uuid!) {
        viewpointGroups(where: { id: { _eq: $id } }) {
          profileViewpointGroupRels(limit: 10000) {
            profile {
              location
            }
          }
        }
      }
    `;

    const supportersData = await fetchSwayAPI<{
      viewpointGroups: Array<{
        profileViewpointGroupRels: Array<{
          profile: { location?: string | null } | null;
        }>;
      }>;
    }>(supportersQuery, { id: viewpointGroupId });

    if (supportersData.viewpointGroups?.length > 0) {
      const vg = supportersData.viewpointGroups[0];

      vg.profileViewpointGroupRels?.forEach((rel) => {
        const location = rel.profile?.location?.trim();
        if (location) {
          // Track by actual location string (for display)
          const locCount = supportersByLocation.get(location) || 0;
          supportersByLocation.set(location, locCount + 1);

          // Also extract state (for filtering elections)
          const state = extractState(location);
          if (state) {
            const stateCount = supportersByState.get(state) || 0;
            supportersByState.set(state, stateCount + 1);
          }
        } else {
          // Count supporters without location
          supportersWithoutLocation++;
        }
      });
    }
  } catch (error) {
    console.warn(
      "Could not query supporter locations:",
      error instanceof Error ? error.message : error
    );
  }

  // Build byJurisdiction: Show actual locations as entered by supporters
  Array.from(supportersByLocation.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([location, count]) => {
      const state = extractState(location);
      byJurisdiction.push({
        jurisdictionId: location,
        jurisdictionName: location,
        supporterCount: count,
        state: state,
      });
    });

  // Add supporters without location data
  if (supportersWithoutLocation > 0) {
    byJurisdiction.push({
      jurisdictionId: "unknown",
      jurisdictionName: "Unknown Location",
      supporterCount: supportersWithoutLocation,
      state: null,
    });
  }

  // Step 2: Get elections ONLY in states where supporters exist
  const supporterStates = Array.from(supportersByState.keys());

  if (supporterStates.length === 0) {
    // No supporters with identifiable states
    return { byJurisdiction, byRace, upcomingElections };
  }

  try {
    // Query elections filtered to supporter states
    const electionsQuery = `
      query GetElectionsInSupporterStates($states: [String!]!) {
        elections(
          where: {
            pollDate: { _gte: "now()" }
            ballotItems: {
              jurisdiction: {
                state: { _in: $states }
              }
            }
          }
          orderBy: { pollDate: ASC }
          limit: 50
        ) {
          id
          name
          pollDate
          ballotItems {
            id
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
          jurisdiction: {
            id: string;
            name: string | null;
            state: string | null;
          } | null;
        }>;
      }>;
    }>(electionsQuery, { states: supporterStates });

    if (electionsData.elections) {
      electionsData.elections.forEach((election) => {
        const ballotItems = election.ballotItems || [];

        // Filter ballot items to only those in supporter states
        const relevantBallotItems = ballotItems.filter(
          (item) =>
            item.jurisdiction?.state &&
            supportersByState.has(item.jurisdiction.state)
        );

        if (relevantBallotItems.length === 0) return;

        // Count supporters who can vote in this election
        const electionStates = new Set<string>();
        relevantBallotItems.forEach((item) => {
          if (item.jurisdiction?.state) {
            electionStates.add(item.jurisdiction.state);
          }
        });

        let electionSupporters = 0;
        electionStates.forEach((state) => {
          electionSupporters += supportersByState.get(state) || 0;
        });

        // Add races
        relevantBallotItems.forEach((item) => {
          if (item.jurisdiction) {
            byRace.push({
              raceId: item.id,
              raceName: null,
              jurisdictionId: item.jurisdiction.id,
              jurisdictionName: item.jurisdiction.name,
              electionId: election.id,
              electionName: election.name,
              pollDate: election.pollDate,
              supporterCount:
                supportersByState.get(item.jurisdiction.state || "") || 0,
            });
          }
        });

        upcomingElections.push({
          electionId: election.id,
          electionName: election.name,
          pollDate: election.pollDate,
          totalSupporters: electionSupporters,
          races: relevantBallotItems.map((item) => ({
            raceId: item.id,
            supporterCount:
              supportersByState.get(item.jurisdiction?.state || "") || 0,
          })),
        });
      });
    }
  } catch (error) {
    console.warn(
      "Could not query elections for supporter states:",
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
 * Switches between Supabase and Sway API based on dataSource parameter or DATA_SOURCE env var
 *
 * @param viewpointGroupId - The viewpoint group ID the leader belongs to
 * @param dataSource - Optional data source override ('sway_api' | 'supabase')
 * @returns Electoral influence breakdown by jurisdiction, race, and upcoming elections
 */
export async function getElectoralInfluence(
  viewpointGroupId: string,
  dataSource?: "supabase" | "sway_api"
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

  // Use provided dataSource or fall back to env var for backward compatibility
  const source =
    dataSource ||
    (process.env.DATA_SOURCE === "SWAY_API" ? "sway_api" : "supabase");

  try {
    if (source === "sway_api") {
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
