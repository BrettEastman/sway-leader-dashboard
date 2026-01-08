import type {
  GrowthOverTimeResult,
  SwayScoreResult,
} from "@/lib/queries/types";
import styles from "./SwayScoreCard.module.css";

interface SwayScoreCardProps {
  swayScore: SwayScoreResult;
  growthOverTime: GrowthOverTimeResult;
}

export function SwayScoreCard({
  swayScore,
  growthOverTime,
}: SwayScoreCardProps) {
  const totalSupporters = swayScore.totalSupporters ?? 0;

  // Calculate growth from one week before the last data point
  let weekAgoCount = 0;
  let weekOverWeekChange = 0;
  let hasGrowth = false;

  if (growthOverTime.dataPoints.length > 0) {
    // Get the last data point (most recent date in the time series)
    const sortedDataPoints = [...growthOverTime.dataPoints].sort((a, b) =>
      b.date.localeCompare(a.date)
    );
    const lastDataPoint = sortedDataPoints[0];
    const lastDate = new Date(lastDataPoint.date);

    // Calculate one week before the last data point
    const oneWeekBeforeLast = new Date(lastDate);
    oneWeekBeforeLast.setDate(oneWeekBeforeLast.getDate() - 7);
    const oneWeekBeforeLastDateStr = oneWeekBeforeLast
      .toISOString()
      .split("T")[0];

    // Find the data point closest to one week before the last data point
    // (or the most recent one before that date)
    const weekAgoDataPoint = growthOverTime.dataPoints
      .filter((dp) => dp.date <= oneWeekBeforeLastDateStr)
      .sort((a, b) => b.date.localeCompare(a.date))[0];

    if (weekAgoDataPoint) {
      weekAgoCount = weekAgoDataPoint.cumulativeCount;
      weekOverWeekChange = swayScore.count - weekAgoCount;
      hasGrowth = weekOverWeekChange !== 0;
    } else if (growthOverTime.dataPoints.length > 1) {
      // If we can't find a point one week back, use the first data point as fallback
      const firstDataPoint = sortedDataPoints[sortedDataPoints.length - 1];
      weekAgoCount = firstDataPoint.cumulativeCount;
      weekOverWeekChange = swayScore.count - weekAgoCount;
      hasGrowth = weekOverWeekChange !== 0;
    }
  }

  // Calculate percentage change (only show if reasonable and we have a baseline)
  const weekOverWeekPercentage =
    weekAgoCount > 0 &&
    Math.abs((weekOverWeekChange / weekAgoCount) * 100) < 1000
      ? Math.abs((weekOverWeekChange / weekAgoCount) * 100).toFixed(1)
      : null;

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  return (
    <div
      className={styles.card}
      role="region"
      aria-labelledby="sway-score-title"
    >
      <div className={styles.header}>
        <h2 id="sway-score-title" className={styles.title}>
          Sway Score
        </h2>
        <p className={styles.subtitle}>Total verified voters aligned</p>
      </div>
      <div className={styles.content}>
        <div
          className={styles.score}
          aria-label={`Sway Score: ${formatNumber(
            swayScore.count
          )} verified voters`}
        >
          {formatNumber(swayScore.count)}
        </div>
        {totalSupporters > 0 && (
          <div className={styles.totalSupporters}>
            out of {formatNumber(totalSupporters)} total supporters
          </div>
        )}
        {hasGrowth && (
          <div
            className={`${styles.trend} ${
              weekOverWeekChange > 0 ? styles.trendUp : styles.trendDown
            }`}
            role="status"
            aria-live="polite"
            aria-label={
              weekOverWeekChange > 0
                ? `Increased by ${formatNumber(Math.abs(weekOverWeekChange))}${
                    weekOverWeekPercentage
                      ? ` (${weekOverWeekPercentage}% increase)`
                      : ""
                  } from last week`
                : `Decreased by ${formatNumber(
                    Math.abs(weekOverWeekChange)
                  )} from last week`
            }
          >
            <span className={styles.trendArrow} aria-hidden="true">
              {weekOverWeekChange > 0 ? "↑" : "↓"}
            </span>
            <span className={styles.trendValue}>
              {weekOverWeekChange > 0 ? "+" : ""}
              {formatNumber(Math.abs(weekOverWeekChange))}
            </span>
            <span className={styles.trendLabel}> from last week</span>
            {weekOverWeekPercentage && (
              <span className={styles.trendPercentage}>
                ({weekOverWeekPercentage}% increase)
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
