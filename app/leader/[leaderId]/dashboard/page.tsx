import {
  getSwayScore,
  getElectoralInfluence,
  getGrowthOverTime,
  getNetworkReach,
} from "@/lib/queries";
import type {
  SwayScoreResult,
  ElectoralInfluenceResult,
  GrowthOverTimeResult,
  NetworkReachResult,
} from "@/lib/queries/types";
import { SwayScoreCard } from "@/components/cards/SwayScoreCard";
import { UpcomingElectionsCard } from "@/components/cards/UpcomingElectionsCard";
import { GrowthOverTimeChart } from "@/components/charts/GrowthOverTimeChart";
import { ElectoralInfluenceTable } from "@/components/tables/ElectoralInfluenceTable";
import styles from "./page.module.css";

interface DashboardPageProps {
  params: Promise<{ leaderId: string }>;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { leaderId } = await params;
  const viewpointGroupId = leaderId;

  // Validate viewpointGroupId format (basic UUID check)
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(viewpointGroupId)) {
    return (
      <div className={styles.errorContainer}>
        <h1 className={styles.errorTitle}>Invalid Leader ID</h1>
        <p className={styles.errorMessage}>
          The provided leader ID is not in a valid format.
        </p>
      </div>
    );
  }

  // Fetch all metrics in parallel
  let swayScore: SwayScoreResult | undefined;
  let electoralInfluence: ElectoralInfluenceResult | undefined;
  let growthOverTime: GrowthOverTimeResult | undefined;
  let networkReach: NetworkReachResult | undefined;
  let fetchError: Error | null = null;

  try {
    [swayScore, electoralInfluence, growthOverTime, networkReach] =
      await Promise.all([
        getSwayScore(viewpointGroupId),
        getElectoralInfluence(viewpointGroupId),
        getGrowthOverTime(viewpointGroupId),
        getNetworkReach(viewpointGroupId),
      ]);
  } catch (error) {
    console.error("Error loading dashboard data:", error);
    fetchError = error instanceof Error ? error : new Error("Unknown error");
  }

  if (
    fetchError ||
    !swayScore ||
    !electoralInfluence ||
    !growthOverTime ||
    !networkReach
  ) {
    return (
      <div className={styles.errorContainer}>
        <h1 className={styles.errorTitle}>Error Loading Dashboard</h1>
        <p className={styles.errorMessage}>
          An error occurred while loading the dashboard data. Please try again
          later.
        </p>
        {fetchError && (
          <p className={styles.errorDetails}>{fetchError.message}</p>
        )}
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <h1 className={styles.title}>Leader Dashboard</h1>
        <p className={styles.subtitle}>Influence metrics and insights</p>
      </header>

      <main className={styles.main}>
        {/* Metrics Grid - 2x2 Layout */}
        <section className={styles.metricsGrid}>
          <div className={styles.metricItem}>
            <SwayScoreCard
              swayScore={swayScore}
              growthOverTime={growthOverTime}
            />
          </div>
          <div className={styles.metricItem}>
            <GrowthOverTimeChart data={growthOverTime} />
          </div>
          <div className={`${styles.metricItem} ${styles.scrollable}`}>
            <UpcomingElectionsCard data={electoralInfluence} />
          </div>
          <div className={`${styles.metricItem} ${styles.scrollable}`}>
            <ElectoralInfluenceTable data={electoralInfluence} />
          </div>
        </section>
      </main>
    </div>
  );
}
