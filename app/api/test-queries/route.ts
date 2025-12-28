import { NextResponse } from "next/server";
import {
  getSwayScore,
  getElectoralInfluence,
  getGrowthOverTime,
  getNetworkReach,
} from "@/lib/queries";

const VIEWPOINT_GROUP_ID = "4d627244-5598-4403-8704-979140ae9cac";

export async function GET() {
  try {
    const [swayScore, electoralInfluence, growthOverTime, networkReach] =
      await Promise.all([
        getSwayScore(VIEWPOINT_GROUP_ID),
        getElectoralInfluence(VIEWPOINT_GROUP_ID),
        getGrowthOverTime(VIEWPOINT_GROUP_ID),
        getNetworkReach(VIEWPOINT_GROUP_ID),
      ]);

    return NextResponse.json({
      swayScore,
      electoralInfluence,
      growthOverTime,
      networkReach,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch queries", details: String(error) },
      { status: 500 }
    );
  }
}
