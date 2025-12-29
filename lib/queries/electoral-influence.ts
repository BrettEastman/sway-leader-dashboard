import { createAdminClient } from "../supabase/admin";
import type { ElectoralInfluenceResult } from "./types";
import { BATCH_SIZE } from "./utils";

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

    // Step 1: Get all supporter profile IDs for this viewpoint group
    const { data: supporterRels, error: relsError } = await supabase
      .from("profile_viewpoint_group_rels")
      .select("profile_id")
      .eq("viewpoint_group_id", viewpointGroupId)
      .eq("type", "supporter");

    if (relsError || !supporterRels || supporterRels.length === 0) {
      console.error("Error fetching supporter relationships:", relsError);
      return {
        byJurisdiction: [],
        byRace: [],
        upcomingElections: [],
      };
    }

    const profileIds = supporterRels.map((rel) => rel.profile_id);

    // Step 2: Get person IDs for these profiles (batched)
    const allProfiles: Array<{ person_id: string | null }> = [];
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
        .select("person_id")
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
        byJurisdiction: [],
        byRace: [],
        upcomingElections: [],
      };
    }

    const personIds = profiles
      .map((p) => p.person_id)
      .filter((id): id is string => id !== null);

    if (personIds.length === 0) {
      return {
        byJurisdiction: [],
        byRace: [],
        upcomingElections: [],
      };
    }

    // Step 3: Get verified voters (batched) (where is_fully_verified = true)
    const allVoterVerifications: Array<{ id: string; person_id: string }> = [];
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
        .select("id, person_id")
        .in("person_id", batch)
        .eq("is_fully_verified", true);

      if (batchError) {
        vvError = batchError;
        break;
      }

      if (batchVv) {
        allVoterVerifications.push(...batchVv);
      }
    }

    const voterVerifications = allVoterVerifications;

    if (vvError || !voterVerifications || voterVerifications.length === 0) {
      console.error("Error fetching voter verifications:", vvError);
      return {
        byJurisdiction: [],
        byRace: [],
        upcomingElections: [],
      };
    }

    const voterVerificationIds = voterVerifications.map((vv) => vv.id);

    // Step 4: Get jurisdiction relationships (batched). Find the jurisdictions where they're registered to vote (via voter_verification_jurisdiction_rels).
    const allJurisdictionRels: Array<{
      voter_verification_id: string;
      jurisdiction_id: string;
    }> = [];
    let jrError: {
      message: string;
      code?: string;
      details?: string;
      hint?: string;
    } | null = null;

    for (let i = 0; i < voterVerificationIds.length; i += BATCH_SIZE) {
      const batch = voterVerificationIds.slice(i, i + BATCH_SIZE);
      const { data: batchRels, error: batchError } = await supabase
        .from("voter_verification_jurisdiction_rels")
        .select("voter_verification_id, jurisdiction_id")
        .in("voter_verification_id", batch);

      if (batchError) {
        jrError = batchError;
        break;
      }

      if (batchRels) {
        allJurisdictionRels.push(...batchRels);
      }
    }

    const jurisdictionRels = allJurisdictionRels;

    if (jrError) {
      console.error("Error fetching jurisdiction relationships:", jrError);
      return {
        byJurisdiction: [],
        byRace: [],
        upcomingElections: [],
      };
    }

    // Step 5: Get jurisdiction details
    const jurisdictionIds = [
      ...new Set(jurisdictionRels?.map((jr) => jr.jurisdiction_id) || []),
    ];

    // Batch jurisdiction query if needed
    let jurisdictions: Array<{
      id: string;
      name: string | null;
      state: string | null;
    }> = [];
    let jError: {
      message: string;
      code?: string;
      details?: string;
      hint?: string;
    } | null = null;

    if (jurisdictionIds.length > 0) {
      if (jurisdictionIds.length <= BATCH_SIZE) {
        const { data, error } = await supabase
          .from("jurisdictions")
          .select("id, name, state")
          .in("id", jurisdictionIds);
        jurisdictions = data || [];
        jError = error;
      } else {
        const allJurisdictions: Array<{
          id: string;
          name: string | null;
          state: string | null;
        }> = [];
        for (let i = 0; i < jurisdictionIds.length; i += BATCH_SIZE) {
          const batch = jurisdictionIds.slice(i, i + BATCH_SIZE);
          const { data: batchData, error: batchError } = await supabase
            .from("jurisdictions")
            .select("id, name, state")
            .in("id", batch);

          if (batchError) {
            jError = batchError;
            break;
          }

          if (batchData) {
            allJurisdictions.push(...batchData);
          }
        }
        jurisdictions = allJurisdictions;
      }
    }

    if (jError) {
      console.error("Error fetching jurisdictions:", jError);
    }

    const jurisdictionMap = new Map(
      (jurisdictions || []).map((j) => [j.id, j])
    );

    // Step 6: Calculate by jurisdiction
    const jurisdictionCounts = new Map<string, number>();
    jurisdictionRels?.forEach((jr) => {
      const count = jurisdictionCounts.get(jr.jurisdiction_id) || 0;
      jurisdictionCounts.set(jr.jurisdiction_id, count + 1);
    });

    const byJurisdiction = Array.from(jurisdictionCounts.entries()).map(
      ([jurisdictionId, supporterCount]) => {
        const jurisdiction = jurisdictionMap.get(jurisdictionId);
        return {
          jurisdictionId,
          jurisdictionName: jurisdiction?.name || null,
          supporterCount,
          state: jurisdiction?.state || null,
        };
      }
    );

    // Step 7: Get ballot items for these jurisdictions (batched)
    const allBallotItems: Array<{
      id: string;
      election_id: string | null;
      jurisdiction_id: string;
    }> = [];
    let biError: {
      message: string;
      code?: string;
      details?: string;
      hint?: string;
    } | null = null;

    // #region agent log
    fetch("http://127.0.0.1:7243/ingest/7665a0af-ae78-46f1-b76e-023beb11d757", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "electoral-influence.ts:256",
        message: "before ballot items query",
        data: {
          jurisdictionIdsLength: jurisdictionIds.length,
          batchSize: BATCH_SIZE,
          numberOfBatches: Math.ceil(jurisdictionIds.length / BATCH_SIZE),
        },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "run3",
        hypothesisId: "E",
      }),
    }).catch(() => {});
    // #endregion

    if (jurisdictionIds.length > 0) {
      for (let i = 0; i < jurisdictionIds.length; i += BATCH_SIZE) {
        const batch = jurisdictionIds.slice(i, i + BATCH_SIZE);

        // #region agent log
        fetch(
          "http://127.0.0.1:7243/ingest/7665a0af-ae78-46f1-b76e-023beb11d757",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              location: "electoral-influence.ts:270",
              message: "querying ballot items batch",
              data: {
                batchIndex: Math.floor(i / BATCH_SIZE),
                batchSize: batch.length,
                startIndex: i,
                endIndex: i + batch.length,
              },
              timestamp: Date.now(),
              sessionId: "debug-session",
              runId: "run3",
              hypothesisId: "E",
            }),
          }
        ).catch(() => {});
        // #endregion

        const { data: batchItems, error: batchError } = await supabase
          .from("ballot_items")
          .select("id, election_id, jurisdiction_id")
          .in("jurisdiction_id", batch);

        if (batchError) {
          // #region agent log
          fetch(
            "http://127.0.0.1:7243/ingest/7665a0af-ae78-46f1-b76e-023beb11d757",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                location: "electoral-influence.ts:278",
                message: "ballot items batch error",
                data: {
                  batchIndex: Math.floor(i / BATCH_SIZE),
                  error: {
                    message: batchError.message,
                    code: batchError.code,
                    details: batchError.details?.substring(0, 200),
                  },
                },
                timestamp: Date.now(),
                sessionId: "debug-session",
                runId: "run3",
                hypothesisId: "E",
              }),
            }
          ).catch(() => {});
          // #endregion
          biError = batchError;
          break;
        }

        // #region agent log
        fetch(
          "http://127.0.0.1:7243/ingest/7665a0af-ae78-46f1-b76e-023beb11d757",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              location: "electoral-influence.ts:285",
              message: "ballot items batch success",
              data: {
                batchIndex: Math.floor(i / BATCH_SIZE),
                batchItemsCount: batchItems?.length || 0,
              },
              timestamp: Date.now(),
              sessionId: "debug-session",
              runId: "run3",
              hypothesisId: "E",
            }),
          }
        ).catch(() => {});
        // #endregion

        if (batchItems) {
          allBallotItems.push(...batchItems);
        }
      }
    }

    // #region agent log
    fetch("http://127.0.0.1:7243/ingest/7665a0af-ae78-46f1-b76e-023beb11d757", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "electoral-influence.ts:295",
        message: "ballot items query complete",
        data: {
          hasError: !!biError,
          totalBallotItems: allBallotItems.length,
          error: biError ? { message: biError.message } : null,
        },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "run3",
        hypothesisId: "E",
      }),
    }).catch(() => {});
    // #endregion

    const ballotItems = allBallotItems;

    if (biError) {
      console.error("Error fetching ballot items:", biError);
    }

    // Step 8: Get races for these ballot items (batched)
    const ballotItemIds = ballotItems?.map((bi) => bi.id) || [];
    const allRaces: Array<{
      id: string;
      ballot_item_id: string;
      office_term_id: string | null;
    }> = [];
    let racesError: {
      message: string;
      code?: string;
      details?: string;
      hint?: string;
    } | null = null;

    // #region agent log
    fetch("http://127.0.0.1:7243/ingest/7665a0af-ae78-46f1-b76e-023beb11d757", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "electoral-influence.ts:308",
        message: "before races query",
        data: {
          ballotItemIdsLength: ballotItemIds.length,
          batchSize: BATCH_SIZE,
          numberOfBatches: Math.ceil(ballotItemIds.length / BATCH_SIZE),
        },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "run3",
        hypothesisId: "F",
      }),
    }).catch(() => {});
    // #endregion

    if (ballotItemIds.length > 0) {
      for (let i = 0; i < ballotItemIds.length; i += BATCH_SIZE) {
        const batch = ballotItemIds.slice(i, i + BATCH_SIZE);

        // #region agent log
        fetch(
          "http://127.0.0.1:7243/ingest/7665a0af-ae78-46f1-b76e-023beb11d757",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              location: "electoral-influence.ts:325",
              message: "querying races batch",
              data: {
                batchIndex: Math.floor(i / BATCH_SIZE),
                batchSize: batch.length,
                startIndex: i,
                endIndex: i + batch.length,
              },
              timestamp: Date.now(),
              sessionId: "debug-session",
              runId: "run3",
              hypothesisId: "F",
            }),
          }
        ).catch(() => {});
        // #endregion

        const { data: batchRaces, error: batchError } = await supabase
          .from("races")
          .select("id, ballot_item_id, office_term_id")
          .in("ballot_item_id", batch);

        if (batchError) {
          // #region agent log
          fetch(
            "http://127.0.0.1:7243/ingest/7665a0af-ae78-46f1-b76e-023beb11d757",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                location: "electoral-influence.ts:345",
                message: "races batch error",
                data: {
                  batchIndex: Math.floor(i / BATCH_SIZE),
                  error: {
                    message: batchError.message,
                    code: batchError.code,
                    details: batchError.details?.substring(0, 200),
                  },
                },
                timestamp: Date.now(),
                sessionId: "debug-session",
                runId: "run3",
                hypothesisId: "F",
              }),
            }
          ).catch(() => {});
          // #endregion
          racesError = batchError;
          break;
        }

        // #region agent log
        fetch(
          "http://127.0.0.1:7243/ingest/7665a0af-ae78-46f1-b76e-023beb11d757",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              location: "electoral-influence.ts:365",
              message: "races batch success",
              data: {
                batchIndex: Math.floor(i / BATCH_SIZE),
                batchRacesCount: batchRaces?.length || 0,
              },
              timestamp: Date.now(),
              sessionId: "debug-session",
              runId: "run3",
              hypothesisId: "F",
            }),
          }
        ).catch(() => {});
        // #endregion

        if (batchRaces) {
          allRaces.push(...batchRaces);
        }
      }
    }

    // #region agent log
    fetch("http://127.0.0.1:7243/ingest/7665a0af-ae78-46f1-b76e-023beb11d757", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "electoral-influence.ts:380",
        message: "races query complete",
        data: {
          hasError: !!racesError,
          totalRaces: allRaces.length,
          error: racesError ? { message: racesError.message } : null,
        },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "run3",
        hypothesisId: "F",
      }),
    }).catch(() => {});
    // #endregion

    const races = allRaces;

    if (racesError) {
      console.error("Error fetching races:", racesError);
    }

    // Step 9: Get office terms and offices for race names
    const officeTermIds = [
      ...new Set(
        races
          ?.map((r) => r.office_term_id)
          .filter((id): id is string => id !== null) || []
      ),
    ];
    // Batch office terms query if needed
    let officeTerms: Array<{ id: string; office_id: string | null }> = [];
    let otError: {
      message: string;
      code?: string;
      details?: string;
      hint?: string;
    } | null = null;

    if (officeTermIds.length > 0) {
      if (officeTermIds.length <= BATCH_SIZE) {
        const { data, error } = await supabase
          .from("office_terms")
          .select("id, office_id")
          .in("id", officeTermIds);
        officeTerms = data || [];
        otError = error;
      } else {
        const allOfficeTerms: Array<{ id: string; office_id: string | null }> =
          [];
        for (let i = 0; i < officeTermIds.length; i += BATCH_SIZE) {
          const batch = officeTermIds.slice(i, i + BATCH_SIZE);
          const { data: batchData, error: batchError } = await supabase
            .from("office_terms")
            .select("id, office_id")
            .in("id", batch);

          if (batchError) {
            otError = batchError;
            break;
          }

          if (batchData) {
            allOfficeTerms.push(...batchData);
          }
        }
        officeTerms = allOfficeTerms;
      }
    }

    if (otError) {
      console.error("Error fetching office terms:", otError);
    }

    const officeIds = [
      ...new Set(
        officeTerms
          ?.map((ot) => ot.office_id)
          .filter((id): id is string => id !== null) || []
      ),
    ];

    // Batch offices query if needed
    let offices: Array<{ id: string; name: string | null }> = [];
    let officesError: {
      message: string;
      code?: string;
      details?: string;
      hint?: string;
    } | null = null;

    if (officeIds.length > 0) {
      if (officeIds.length <= BATCH_SIZE) {
        const { data, error } = await supabase
          .from("offices")
          .select("id, name")
          .in("id", officeIds);
        offices = data || [];
        officesError = error;
      } else {
        const allOffices: Array<{ id: string; name: string | null }> = [];
        for (let i = 0; i < officeIds.length; i += BATCH_SIZE) {
          const batch = officeIds.slice(i, i + BATCH_SIZE);
          const { data: batchData, error: batchError } = await supabase
            .from("offices")
            .select("id, name")
            .in("id", batch);

          if (batchError) {
            officesError = batchError;
            break;
          }

          if (batchData) {
            allOffices.push(...batchData);
          }
        }
        offices = allOffices;
      }
    }

    if (officesError) {
      console.error("Error fetching offices:", officesError);
    }

    const officeMap = new Map((offices || []).map((o) => [o.id, o]));
    const officeTermMap = new Map((officeTerms || []).map((ot) => [ot.id, ot]));
    const ballotItemMap = new Map((ballotItems || []).map((bi) => [bi.id, bi]));

    // Step 10: Get elections
    const electionIds = [
      ...new Set(
        ballotItems
          ?.map((bi) => bi.election_id)
          .filter((id): id is string => id !== null) || []
      ),
    ];
    // Batch elections query if needed
    let elections: Array<{
      id: string;
      name: string | null;
      poll_date: string | null;
    }> = [];
    let eError: {
      message: string;
      code?: string;
      details?: string;
      hint?: string;
    } | null = null;

    if (electionIds.length > 0) {
      if (electionIds.length <= BATCH_SIZE) {
        const { data, error } = await supabase
          .from("elections")
          .select("id, name, poll_date")
          .in("id", electionIds);
        elections = data || [];
        eError = error;
      } else {
        const allElections: Array<{
          id: string;
          name: string | null;
          poll_date: string | null;
        }> = [];
        for (let i = 0; i < electionIds.length; i += BATCH_SIZE) {
          const batch = electionIds.slice(i, i + BATCH_SIZE);
          const { data: batchData, error: batchError } = await supabase
            .from("elections")
            .select("id, name, poll_date")
            .in("id", batch);

          if (batchError) {
            eError = batchError;
            break;
          }

          if (batchData) {
            allElections.push(...batchData);
          }
        }
        elections = allElections;
      }
    }

    if (eError) {
      console.error("Error fetching elections:", eError);
    }

    const electionMap = new Map((elections || []).map((e) => [e.id, e]));

    // Step 11: Calculate by race
    // Count supporters per race by matching jurisdictions
    const raceCounts = new Map<string, number>();
    const raceJurisdictionMap = new Map<string, string>();

    races?.forEach((race) => {
      const ballotItem = ballotItemMap.get(race.ballot_item_id);
      if (!ballotItem) return;

      const jurisdictionId = ballotItem.jurisdiction_id;
      const count = jurisdictionCounts.get(jurisdictionId) || 0;
      if (count > 0) {
        raceCounts.set(race.id, count);
        raceJurisdictionMap.set(race.id, jurisdictionId);
      }
    });

    const byRace = Array.from(raceCounts.entries())
      .map(([raceId, supporterCount]) => {
        const race = races?.find((r) => r.id === raceId);
        if (!race) {
          return null;
        }

        const ballotItem = ballotItemMap.get(race.ballot_item_id);
        const jurisdictionId =
          ballotItem?.jurisdiction_id || raceJurisdictionMap.get(raceId) || "";
        const jurisdiction = jurisdictionMap.get(jurisdictionId);
        const election = ballotItem?.election_id
          ? electionMap.get(ballotItem.election_id)
          : null;
        const officeTerm = race.office_term_id
          ? officeTermMap.get(race.office_term_id)
          : null;
        const office = officeTerm?.office_id
          ? officeMap.get(officeTerm.office_id)
          : null;

        return {
          raceId,
          raceName: office?.name || null,
          jurisdictionId,
          jurisdictionName: jurisdiction?.name || null,
          electionId: ballotItem?.election_id || "",
          electionName: election?.name || null,
          pollDate: election?.poll_date || null,
          supporterCount,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    // Step 12: Calculate upcoming elections
    const today = new Date().toISOString().split("T")[0];
    const upcomingElectionsMap = new Map<
      string,
      {
        electionId: string;
        electionName: string | null;
        pollDate: string | null;
        races: Map<string, number>;
      }
    >();

    byRace.forEach((race) => {
      if (!race.pollDate || race.pollDate < today) return;

      const existing = upcomingElectionsMap.get(race.electionId);
      if (existing) {
        existing.races.set(race.raceId, race.supporterCount);
      } else {
        const racesMap = new Map<string, number>();
        racesMap.set(race.raceId, race.supporterCount);
        upcomingElectionsMap.set(race.electionId, {
          electionId: race.electionId,
          electionName: race.electionName,
          pollDate: race.pollDate,
          races: racesMap,
        });
      }
    });

    const upcomingElections = Array.from(upcomingElectionsMap.values()).map(
      (election) => {
        const raceCounts = Array.from(election.races.values());
        const totalSupporters = raceCounts.reduce(
          (sum, count) => sum + count,
          0
        );

        return {
          electionId: election.electionId,
          electionName: election.electionName,
          pollDate: election.pollDate,
          totalSupporters,
          races: Array.from(election.races.entries()).map(
            ([raceId, supporterCount]) => ({
              raceId,
              supporterCount,
            })
          ),
        };
      }
    );

    return {
      byJurisdiction: byJurisdiction.sort(
        (a, b) => b.supporterCount - a.supporterCount
      ),
      byRace: byRace.sort((a, b) => b.supporterCount - a.supporterCount),
      upcomingElections: upcomingElections.sort((a, b) => {
        const dateA = a.pollDate || "";
        const dateB = b.pollDate || "";
        return dateA.localeCompare(dateB);
      }),
    };
  } catch (error) {
    console.error("Unexpected error in getElectoralInfluence:", error);
    return {
      byJurisdiction: [],
      byRace: [],
      upcomingElections: [],
    };
  }
}
