import type { SwayScoreResult, GrowthOverTimeResult } from "@/lib/queries/types";
import styles from "./SwayScoreCard.module.css";

interface SwayScoreCardProps {
  swayScore: SwayScoreResult;
  growthOverTime: GrowthOverTimeResult;
}

export function SwayScoreCard({
  swayScore,
  growthOverTime,
}: SwayScoreCardProps) {
  const hasGrowth = growthOverTime.totalGrowth !== 0;
  const growthPercentage =
    growthOverTime.totalGrowth > 0 && swayScore.count > growthOverTime.totalGrowth
      ? ((growthOverTime.totalGrowth / (swayScore.count - growthOverTime.totalGrowth)) * 100).toFixed(1)
      : null;

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h2 className={styles.title}>Sway Score</h2>
        <p className={styles.subtitle}>Total verified voters aligned</p>
      </div>
      <div className={styles.content}>
        <div className={styles.score}>{formatNumber(swayScore.count)}</div>
        {hasGrowth && (
          <div
            className={`${styles.trend} ${
              growthOverTime.totalGrowth > 0 ? styles.trendUp : styles.trendDown
            }`}
          >
            <span className={styles.trendArrow}>
              {growthOverTime.totalGrowth > 0 ? "↑" : "↓"}
            </span>
            <span className={styles.trendValue}>
              {growthOverTime.totalGrowth > 0 ? "+" : ""}
              {formatNumber(Math.abs(growthOverTime.totalGrowth))}
            </span>
            {growthPercentage && (
              <span className={styles.trendPercentage}>
                ({growthPercentage}%)
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

