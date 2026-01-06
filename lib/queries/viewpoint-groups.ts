import { createAdminClient } from "../supabase/admin";

export interface ViewpointGroup {
  id: string;
  title: string; // Always a string after filtering
}

/**
 * Get all viewpoint groups (leaders) that have supporters
 * Only returns groups that actually have a following (supporter relationships)
 * Filters out groups with null, empty, or "Untitled Group" titles
 *
 * @param dataSource - Optional data source override ('sway_api' | 'supabase')
 *                     Note: Currently only Supabase is supported for this query
 * @returns List of viewpoint groups with id and title
 */
export async function getAllViewpointGroups(
  dataSource?: "supabase" | "sway_api"
): Promise<ViewpointGroup[]> {
  // Note: Sway API implementation for this query not yet implemented
  // For now, always use Supabase regardless of dataSource parameter
  try {
    const supabase = createAdminClient();

    // First, get all viewpoint groups
    const { data: allGroups, error: groupsError } = await supabase
      .from("viewpoint_groups")
      .select("id, title");

    if (groupsError) {
      console.error("Error fetching viewpoint groups:", groupsError);
      return [];
    }

    if (!allGroups || allGroups.length === 0) {
      return [];
    }

    // Get unique viewpoint group IDs that have supporters
    const { data: supporterRels, error: relsError } = await supabase
      .from("profile_viewpoint_group_rels")
      .select("viewpoint_group_id")
      .eq("type", "supporter");

    if (relsError) {
      console.error("Error fetching supporter relationships:", relsError);
      return [];
    }

    // Create a set of viewpoint group IDs that have supporters
    const groupsWithSupporters = new Set(
      (supporterRels || []).map((rel) => rel.viewpoint_group_id)
    );

    // Filter to only groups with supporters, filter out null/empty titles, and sort
    const filteredGroups = allGroups
      .filter(
        (vg) =>
          groupsWithSupporters.has(vg.id) &&
          vg.title &&
          vg.title.trim() !== "" &&
          vg.title !== "Untitled Group"
      )
      .map((vg) => ({
        id: vg.id,
        title: vg.title! as string, // Safe to assert since we filtered out nulls
      }))
      .sort((a, b) => a.title.localeCompare(b.title));

    return filteredGroups;
  } catch (error) {
    console.error("Unexpected error in getAllViewpointGroups:", error);
    return [];
  }
}

