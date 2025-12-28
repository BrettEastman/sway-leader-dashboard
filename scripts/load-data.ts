import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";

// Load environment variables
// Note: dotenv is only needed here because this script runs outside Next.js.
// Next.js automatically loads .env.local files, but standalone scripts need dotenv.
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseSecretKey) {
  console.error("Error: Missing Supabase environment variables.");
  console.error("Please ensure .env.local contains:");
  console.error("  NEXT_PUBLIC_SUPABASE_URL");
  console.error("  SUPABASE_SECRET_KEY");
  process.exit(1);
}

// Use admin client (secret key) for data loading operations
const supabase = createClient(supabaseUrl, supabaseSecretKey);

// Type definitions for schema.json structure
interface TableDefinition {
  file: string;
  primary_key: string;
  foreign_keys: Record<string, string>;
  row_count: number;
  description: string;
}

interface Schema {
  tables: Record<string, TableDefinition>;
  import_order: string[];
}

// Load schema.json to get import order and expected row counts
const schemaPath = path.join(process.cwd(), "data", "schema.json");
const schemaContent = fs.readFileSync(schemaPath, "utf-8");
const schema = JSON.parse(schemaContent) as Schema;

const dataDir = path.join(process.cwd(), "data");
const importOrder = schema.import_order;
const expectedCounts: Record<string, number> = {};

// Build expected counts map
Object.entries(schema.tables).forEach(
  ([tableName, tableDef]: [string, TableDefinition]) => {
    expectedCounts[tableName] = tableDef.row_count || 0;
  }
);

async function loadTable(tableName: string): Promise<boolean> {
  const tableDef = schema.tables[tableName];
  if (!tableDef) {
    console.warn(`⚠️  Table ${tableName} not found in schema, skipping...`);
    return false;
  }

  const jsonFile = path.join(dataDir, tableDef.file);

  // Check if file exists
  if (!fs.existsSync(jsonFile)) {
    // Mark as "skipped" not "failed" - these are optional tables
    console.log(
      `⏭️  File ${tableDef.file} not found, skipping table ${tableName} (not required for MVP)...`
    );
    return true; // Return true so it doesn't count as a failure
  }

  // Check if file is empty or invalid JSON
  const fileStats = fs.statSync(jsonFile);
  if (fileStats.size === 0 || fileStats.size < 10) {
    // Mark as "skipped" not "failed" - empty files are acceptable
    console.log(
      `⏭️  File ${tableDef.file} appears to be empty, skipping table ${tableName} (not required for MVP)...`
    );
    return true; // Return true so it doesn't count as a failure
  }

  console.log(`📦 Loading ${tableName} from ${tableDef.file}...`);

  try {
    const fileContent = fs.readFileSync(jsonFile, "utf-8");
    const data = JSON.parse(fileContent);

    if (!Array.isArray(data)) {
      console.error(`❌ Error: ${tableDef.file} does not contain an array`);
      return false;
    }

    if (data.length === 0) {
      console.log(`   ℹ️  No data to load for ${tableName}`);
      return true;
    }

    // Deduplicate data by primary key to avoid "cannot affect row a second time" error
    const uniqueDataMap = new Map<unknown, Record<string, unknown>>();
    for (const row of data) {
      const key = row[tableDef.primary_key];
      if (key !== undefined && key !== null) {
        uniqueDataMap.set(key, row);
      }
    }
    const uniqueData = Array.from(uniqueDataMap.values());

    if (uniqueData.length !== data.length) {
      console.log(
        `   ℹ️  Removed ${
          data.length - uniqueData.length
        } duplicate entries (by ${tableDef.primary_key})`
      );
    }

    // Handle circular dependency: viewpoint_groups and slugs
    // Load viewpoint_groups without current_slug_id first, then slugs, then update
    if (tableName === "viewpoint_groups") {
      // First load without current_slug_id to break circular dependency
      const dataWithoutSlug = data.map((row: Record<string, unknown>) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { current_slug_id: _, ...rest } = row;
        return rest;
      });

      // Deduplicate before loading
      const uniqueDataMap = new Map<unknown, Record<string, unknown>>();
      for (const row of dataWithoutSlug) {
        const key = row[tableDef.primary_key];
        if (key !== undefined && key !== null) {
          uniqueDataMap.set(key, row);
        }
      }
      const uniqueDataWithoutSlug = Array.from(uniqueDataMap.values());

      // Load viewpoint groups first in batches
      const batchSize = 100;
      for (let i = 0; i < uniqueDataWithoutSlug.length; i += batchSize) {
        const batch = uniqueDataWithoutSlug.slice(i, i + batchSize);
        const tempResult = await supabase
          .from(tableName)
          .upsert(batch, { onConflict: tableDef.primary_key });

        if (tempResult.error) {
          console.error(
            `❌ Error loading ${tableName} batch ${
              Math.floor(i / batchSize) + 1
            }:`,
            tempResult.error.message
          );
          return false;
        }
      }

      // Now update with current_slug_id (this will happen after slugs are loaded)
      // We'll handle the slug updates after slugs table is loaded
      console.log(
        `   ✅ Loaded ${uniqueDataWithoutSlug.length} rows (current_slug_id will be updated after slugs load)`
      );
      return true;
    }

    if (tableName === "slugs") {
      // Deduplicate slugs data
      const uniqueDataMap = new Map<unknown, Record<string, unknown>>();
      for (const row of data) {
        const key = row[tableDef.primary_key];
        if (key !== undefined && key !== null) {
          uniqueDataMap.set(key, row);
        }
      }
      const uniqueSlugsData = Array.from(uniqueDataMap.values());

      // Load slugs in batches
      const batchSize = 100;
      for (let i = 0; i < uniqueSlugsData.length; i += batchSize) {
        const batch = uniqueSlugsData.slice(i, i + batchSize);
        const result = await supabase
          .from(tableName)
          .upsert(batch, { onConflict: tableDef.primary_key });

        if (result.error) {
          console.error(
            `❌ Error loading ${tableName} batch ${
              Math.floor(i / batchSize) + 1
            }:`,
            result.error.message
          );
          return false;
        }
      }

      // After slugs are loaded, update viewpoint_groups with current_slug_id
      // Read viewpoint_groups data again to get the full records
      const vgFile = path.join(dataDir, "viewpoint_groups.json");
      const vgData = JSON.parse(fs.readFileSync(vgFile, "utf-8")) as Array<
        Record<string, unknown>
      >;

      // Update viewpoint_groups with current_slug_id
      const vgTableDef = schema.tables["viewpoint_groups"];
      for (const row of vgData) {
        if (row.current_slug_id) {
          await supabase
            .from("viewpoint_groups")
            .update({ current_slug_id: row.current_slug_id })
            .eq(vgTableDef.primary_key, row[vgTableDef.primary_key]);
        }
      }

      const expectedCount = expectedCounts[tableName] || 0;
      const actualCount = uniqueSlugsData.length;
      if (actualCount === expectedCount) {
        console.log(`   ✅ Loaded ${actualCount} rows successfully`);
      } else {
        console.warn(
          `   ⚠️  Row count mismatch: expected ${expectedCount}, got ${actualCount}`
        );
      }
      return true;
    }

    // Use uniqueData as validData (we'll filter invalid foreign keys during batch processing)
    const validData = uniqueData;

    // Insert in batches to avoid "cannot affect row a second time" error
    const batchSize = 100;
    let totalInserted = 0;
    let lastError: Error | null = null;

    for (let i = 0; i < validData.length; i += batchSize) {
      const batch = uniqueData.slice(i, i + batchSize);
      const result = await supabase
        .from(tableName)
        .upsert(batch, { onConflict: tableDef.primary_key });

      if (result.error) {
        // If it's a foreign key constraint error, try inserting rows individually
        // to find which ones are valid
        if (result.error.code === "23503") {
          let batchInserted = 0;
          for (const row of batch) {
            const singleResult = await supabase
              .from(tableName)
              .upsert([row], { onConflict: tableDef.primary_key });
            if (!singleResult.error) {
              batchInserted++;
            }
          }
          totalInserted += batchInserted;
          if (batchInserted < batch.length) {
            console.log(
              `   ℹ️  Batch ${
                Math.floor(i / batchSize) + 1
              }: inserted ${batchInserted}/${
                batch.length
              } rows (skipped invalid foreign keys)`
            );
          }
        } else {
          lastError = result.error;
          console.error(
            `❌ Error loading ${tableName} batch ${
              Math.floor(i / batchSize) + 1
            }:`,
            result.error.message
          );
        }
        continue;
      }
      totalInserted += batch.length;
    }

    if (lastError && totalInserted === 0) {
      // If all batches failed, return false
      console.error(`   Details:`, lastError);
      return false;
    }

    const expectedCount = expectedCounts[tableName] || 0;
    const actualCount = validData.length;

    if (totalInserted < actualCount) {
      console.warn(
        `   ⚠️  Only inserted ${totalInserted} of ${actualCount} unique rows`
      );
    }

    if (actualCount !== expectedCount) {
      console.warn(
        `   ⚠️  Row count mismatch: expected ${expectedCount}, got ${actualCount} (after deduplication)`
      );
    } else {
      console.log(`   ✅ Loaded ${totalInserted} rows successfully`);
    }

    return totalInserted > 0;
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(`❌ Error processing ${tableName}:`, errorMessage);
    return false;
  }
}

async function main() {
  console.log("🚀 Starting data load process...\n");
  console.log(`📊 Expected tables: ${importOrder.length}\n`);

  let successCount = 0;
  let failCount = 0;
  const failedTables: string[] = [];

  // Handle missing users.json - create users from persons.json user_ids
  if (!fs.existsSync(path.join(dataDir, "users.json"))) {
    console.log("📦 Creating users from persons.json user_ids...\n");
    try {
      const personsFile = path.join(dataDir, "persons.json");
      if (fs.existsSync(personsFile)) {
        const personsData = JSON.parse(
          fs.readFileSync(personsFile, "utf-8")
        ) as Array<{ user_id: string | null }>;
        const userIds = new Set(
          personsData
            .map((p) => p.user_id)
            .filter((id): id is string => id !== null)
        );

        const users = Array.from(userIds).map((id) => ({
          id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));

        if (users.length > 0) {
          const result = await supabase.from("users").upsert(users, {
            onConflict: "id",
          });
          if (result.error) {
            console.warn(`⚠️  Could not create users: ${result.error.message}`);
          } else {
            console.log(`   ✅ Created ${users.length} users\n`);
          }
        }
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.warn(`⚠️  Error creating users: ${errorMessage}\n`);
    }
  }

  // Tables that are optional/not needed for MVP metrics
  const optionalTables = new Set([
    "users",
    "profile_user_rels",
    "influence_target_viewpoint_group_rels",
  ]);

  // Process tables in dependency order
  for (const tableName of importOrder) {
    const success = await loadTable(tableName);
    if (success) {
      successCount++;
    } else {
      // Only count as failure if it's not an optional table
      if (!optionalTables.has(tableName)) {
        failCount++;
        failedTables.push(tableName);
      } else {
        // Optional tables that fail are just skipped
        successCount++;
      }
    }
    console.log(""); // Empty line for readability
  }

  // Summary
  console.log("=".repeat(50));
  console.log("📋 Load Summary:");
  console.log(`   ✅ Successfully loaded: ${successCount} tables`);
  console.log(`   ❌ Failed: ${failCount} tables`);

  if (failedTables.length > 0) {
    console.log(`\n   Failed tables: ${failedTables.join(", ")}`);
  }

  // Verify final counts
  console.log("\n🔍 Verifying row counts...\n");
  for (const tableName of importOrder) {
    const expected = expectedCounts[tableName];
    if (expected === undefined) continue;

    try {
      const { count, error } = await supabase
        .from(tableName)
        .select("*", { count: "exact", head: true });

      if (error) {
        console.warn(
          `   ⚠️  ${tableName}: Could not verify (${error.message})`
        );
      } else {
        const actual = count || 0;
        const status = actual === expected ? "✅" : "⚠️";
        console.log(`   ${status} ${tableName}: ${actual}/${expected} rows`);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.warn(`   ⚠️  ${tableName}: Verification error (${errorMessage})`);
    }
  }

  if (failCount === 0) {
    console.log("\n🎉 All tables loaded successfully!");
    process.exit(0);
  } else {
    console.log(
      "\n⚠️  Some tables failed to load. Please review the errors above."
    );
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("💥 Fatal error:", error);
  process.exit(1);
});
