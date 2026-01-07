import { createAdminClient } from "../supabase/admin";
import { fetchSwayAPI } from "./graphql-client";

export interface ViewpointGroup {
  id: string;
  title: string;
}

/**
 * Get all viewpoint groups from Supabase that have supporters
 */
async function getAllViewpointGroupsFromSupabase(): Promise<ViewpointGroup[]> {
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
    console.error("Error in getAllViewpointGroupsFromSupabase:", error);
    return [];
  }
}

/**
 * Get all viewpoint groups from Sway API that have supporters
 */
async function getAllViewpointGroupsFromAPI(): Promise<ViewpointGroup[]> {
  try {
    // Query all viewpoint groups with their supporter counts from summary
    // We filter in JavaScript for groups that have at least one supporter
    const query = `
      query GetAllViewpointGroups {
        viewpointGroups {
          id
          title
          summary {
            supporterCount
          }
        }
      }
    `;

    const data = await fetchSwayAPI<{
      viewpointGroups: Array<{
        id: string;
        title: string | null;
        summary?: {
          supporterCount: number;
        } | null;
      }>;
    }>(query);

    if (!data.viewpointGroups || data.viewpointGroups.length === 0) {
      return [];
    }

    // Filter to only groups with supporters, filter out null/empty titles, and sort
    const filteredGroups = data.viewpointGroups
      .filter(
        (vg) =>
          (vg.summary?.supporterCount ?? 0) > 0 &&
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
    console.error("Error in getAllViewpointGroupsFromAPI:", error);
    return [];
  }
}

/**
 * Get all viewpoint groups (leaders) that have supporters
 * Only returns groups that actually have a following (supporter relationships)
 * Filters out groups with null, empty, or "Untitled Group" titles
 *
 * @param dataSource - Optional data source override ('sway_api' | 'supabase')
 * @returns List of viewpoint groups with id and title
 */
export async function getAllViewpointGroups(
  dataSource?: "supabase" | "sway_api"
): Promise<ViewpointGroup[]> {
  // Use provided dataSource or fall back to env var for backward compatibility
  const source =
    dataSource ||
    (process.env.DATA_SOURCE === "SWAY_API" ? "sway_api" : "supabase");

  try {
    if (source === "sway_api") {
      return await getAllViewpointGroupsFromAPI();
    }

    return await getAllViewpointGroupsFromSupabase();
  } catch (error) {
    console.error("Unexpected error in getAllViewpointGroups:", error);
    return [];
  }
}
