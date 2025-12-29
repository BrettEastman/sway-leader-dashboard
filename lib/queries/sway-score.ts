import { createAdminClient } from '../supabase/admin';
import type { SwayScoreResult } from './types';
import { BATCH_SIZE } from './utils';

/**
 * Get the Sway Score for a leader (total verified voter count)
 *
 * @param viewpointGroupId - The viewpoint group ID the leader belongs to
 * @returns The total count of verified voters aligned with the leader
 */
export async function getSwayScore(
  viewpointGroupId: string
): Promise<SwayScoreResult> {
  try {
    // Input validation
    if (!viewpointGroupId || typeof viewpointGroupId !== 'string') {
      console.error('Invalid viewpointGroupId provided to getSwayScore');
      return { count: 0, totalSupporters: 0 };
    }

    const supabase = createAdminClient();

    // Step 1: Get all supporter profile IDs for this viewpoint group
    const { data: supporterRels, error: relsError } = await supabase
      .from('profile_viewpoint_group_rels')
      .select('profile_id')
      .eq('viewpoint_group_id', viewpointGroupId)
      .eq('type', 'supporter');

    if (relsError) {
      console.error('Error fetching supporter relationships:', relsError);
      return { count: 0, totalSupporters: 0 };
    }

    if (!supporterRels || supporterRels.length === 0) {
      return { count: 0, totalSupporters: 0 };
    }

    const totalSupporters = supporterRels.length;
    const profileIds = supporterRels.map((rel) => rel.profile_id);

    // Guard: Don't call .in() with empty array
    if (profileIds.length === 0) {
      return { count: 0, totalSupporters };
    }

    // Step 2: Get person IDs for these profiles
    // Batch queries to avoid Supabase .in() limit (typically 100-1000 items)
    const allProfiles: Array<{ person_id: string | null }> = [];
    let profilesError: { message: string; code?: string; details?: string; hint?: string } | null = null;

    for (let i = 0; i < profileIds.length; i += BATCH_SIZE) {
      const batch = profileIds.slice(i, i + BATCH_SIZE);
      const { data: batchProfiles, error: batchError } = await supabase
        .from('profiles')
        .select('person_id')
        .in('id', batch);

      if (batchError) {
        profilesError = batchError;
        break;
      }

      if (batchProfiles) {
        allProfiles.push(...batchProfiles);
      }
    }

    const profiles = allProfiles;

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return { count: 0, totalSupporters };
    }

    if (!profiles || profiles.length === 0) {
      return { count: 0, totalSupporters };
    }

    const personIds = profiles
      .map((p) => p.person_id)
      .filter((id): id is string => id !== null);

    if (personIds.length === 0) {
      return { count: 0, totalSupporters };
    }

    // Step 3: Count distinct verified voters (also batched)
    let totalCount = 0;
    let vvError: { message: string; code?: string; details?: string; hint?: string } | null = null;

    for (let i = 0; i < personIds.length; i += BATCH_SIZE) {
      const batch = personIds.slice(i, i + BATCH_SIZE);
      const { count: batchCount, error: batchError } = await supabase
        .from('voter_verifications')
        .select('id', { count: 'exact', head: true })
        .in('person_id', batch)
        .eq('is_fully_verified', true);

      if (batchError) {
        vvError = batchError;
        break;
      }

      totalCount += batchCount || 0;
    }

    const count = totalCount;

    if (vvError) {
      console.error('Error counting verified voters:', vvError);
      return { count: 0, totalSupporters };
    }

    return { count: count || 0, totalSupporters };
  } catch (error) {
    console.error('Unexpected error in getSwayScore:', error);
    return { count: 0, totalSupporters: 0 };
  }
}

