/**
 * Test Queries Script
 *
 * This script is a development tool for testing all query functions.
 * It can be run via: npm run test-queries
 *
 * Useful for:
 * - Debugging query issues
 * - Verifying data loading
 * - Testing query performance
 */

import * as dotenv from "dotenv";
import * as path from "path";
import {
  getSwayScore,
  getElectoralInfluence,
  getGrowthOverTime,
  getNetworkReach,
} from "../lib/queries";

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

// Use the viewpoint_group_id from your schema.json
const VIEWPOINT_GROUP_ID = "4d627244-5598-4403-8704-979140ae9cac";

async function testQueries() {
  console.log("🧪 Testing Query Functions\n");
  console.log(`Using viewpoint_group_id: ${VIEWPOINT_GROUP_ID}\n`);

  // Verify environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    console.error("❌ Missing Supabase environment variables!");
    console.error("Please ensure .env.local contains:");
    console.error("  NEXT_PUBLIC_SUPABASE_URL");
    console.error("  SUPABASE_SECRET_KEY");
    process.exit(1);
  }

  console.log("✅ Environment variables loaded");
  console.log(`   Supabase URL: ${supabaseUrl.substring(0, 30)}...\n`);

  try {
    // Test Sway Score
    console.log("1️⃣  Testing getSwayScore()...");
    const swayScore = await getSwayScore(VIEWPOINT_GROUP_ID);
    console.log("   Result:", swayScore);
    console.log(`   ✅ Sway Score: ${swayScore.count} verified voters\n`);

    // Test Electoral Influence
    console.log("2️⃣  Testing getElectoralInfluence()...");
    const electoralInfluence = await getElectoralInfluence(VIEWPOINT_GROUP_ID);
    console.log("   ✅ Electoral Influence:");
    console.log(
      `      - Jurisdictions: ${electoralInfluence.byJurisdiction.length}`
    );
    console.log(`      - Races: ${electoralInfluence.byRace.length}`);
    console.log(
      `      - Upcoming Elections: ${electoralInfluence.upcomingElections.length}`
    );
    if (electoralInfluence.byJurisdiction.length > 0) {
      const top = electoralInfluence.byJurisdiction[0];
      console.log(
        `      - Top Jurisdiction: ${top.jurisdictionName || "Unknown"} (${
          top.supporterCount
        } supporters)`
      );
    }
    if (electoralInfluence.byRace.length > 0) {
      const topRace = electoralInfluence.byRace[0];
      console.log(
        `      - Top Race: ${topRace.raceName || "Unknown"} (${
          topRace.supporterCount
        } supporters)`
      );
    }
    console.log();

    // Test Growth Over Time
    console.log("3️⃣  Testing getGrowthOverTime()...");
    const growthOverTime = await getGrowthOverTime(VIEWPOINT_GROUP_ID);
    console.log("   ✅ Growth Over Time:");
    console.log(`      - Data Points: ${growthOverTime.dataPoints.length}`);
    console.log(`      - Total Growth: ${growthOverTime.totalGrowth}`);
    if (growthOverTime.growthRate !== undefined) {
      console.log(
        `      - Growth Rate: ${growthOverTime.growthRate.toFixed(2)}%`
      );
    }
    if (growthOverTime.dataPoints.length > 0) {
      const first = growthOverTime.dataPoints[0];
      const last =
        growthOverTime.dataPoints[growthOverTime.dataPoints.length - 1];
      console.log(
        `      - First Date: ${first.date} (${first.cumulativeCount} voters)`
      );
      console.log(
        `      - Last Date: ${last.date} (${last.cumulativeCount} voters)`
      );
    }
    console.log();

    // Test Network Reach
    console.log("4️⃣  Testing getNetworkReach()...");
    const networkReach = await getNetworkReach(VIEWPOINT_GROUP_ID);
    console.log("   ✅ Network Reach:");
    console.log(
      `      - Network Leaders: ${networkReach.networkLeaders.length}`
    );
    console.log(
      `      - Total Downstream Reach: ${networkReach.totalDownstreamReach} verified voters`
    );
    if (networkReach.networkLeaders.length > 0) {
      const topLeader = networkReach.networkLeaders[0];
      console.log(
        `      - Top Network Leader: ${topLeader.displayName || "Unknown"} (${
          topLeader.downstreamVerifiedVoters
        } downstream voters)`
      );
    }
    console.log();

    console.log("✅ All tests completed successfully!");
  } catch (error) {
    console.error("❌ Error testing queries:", error);
    if (error instanceof Error) {
      console.error("   Message:", error.message);
      console.error("   Stack:", error.stack);
    }
    process.exit(1);
  }
}

testQueries();
