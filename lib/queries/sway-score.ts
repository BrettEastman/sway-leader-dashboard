import { createAdminClient } from '../supabase/admin';
import type { SwayScoreResult } from './types';

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

    const { data, error: rpcError } = await supabase.rpc('get_sway_score_rpc', {
      p_viewpoint_group_id: viewpointGroupId,
    });

    if (rpcError) {
      console.error('Error calling get_sway_score_rpc:', rpcError);
      return { count: 0, totalSupporters: 0 };
    }

    if (!data || data.length === 0) {
      return { count: 0, totalSupporters: 0 };
    }

    return {
      count: Number(data[0].count),
      totalSupporters: Number(data[0].total_supporters)
    };
  } catch (error) {
    console.error('Unexpected error in getSwayScore:', error);
    return { count: 0, totalSupporters: 0 };
  }
}

