import type { ElectoralInfluenceResult } from "@/lib/queries/types";
import styles from "./UpcomingElectionsCard.module.css";

interface UpcomingElectionsCardProps {
  data: ElectoralInfluenceResult;
}

export function UpcomingElectionsCard({ data }: UpcomingElectionsCardProps) {
  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    // Use UTC date parts for deterministic formatting
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return `${monthNames[month]} ${day}, ${year}`;
  };

  if (data.upcomingElections.length === 0) {
    return null;
  }

  return (
    <div
      className={styles.container}
      role="region"
      aria-labelledby="upcoming-elections-title"
    >
      <div className={styles.header}>
        <h2 id="upcoming-elections-title" className={styles.title}>
          Upcoming Elections
        </h2>
        <p className={styles.subtitle}>
          Voters supporting this group who can influence other elections
        </p>
      </div>
      <div
        className={styles.electionsList}
        role="list"
        aria-label={`${data.upcomingElections.length} upcoming elections`}
      >
        {data.upcomingElections.map((election) => (
          <div
            key={election.electionId}
            className={styles.electionItem}
            role="listitem"
          >
            <div className={styles.electionHeader}>
              <span className={styles.electionName}>
                {election.electionName || "Unknown Election"}
              </span>
              <span className={styles.electionCount}>
                {formatNumber(election.totalSupporters)} supporters
              </span>
            </div>
            {election.pollDate && (
              <time
                className={styles.electionDate}
                dateTime={election.pollDate}
              >
                {formatDate(election.pollDate)}
              </time>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
