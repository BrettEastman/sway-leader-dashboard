import type { ElectoralInfluenceResult } from "@/lib/queries/types";
import styles from "./ElectoralInfluenceTable.module.css";

interface ElectoralInfluenceTableProps {
  data: ElectoralInfluenceResult;
}

export function ElectoralInfluenceTable({
  data,
}: ElectoralInfluenceTableProps) {
  // Sort jurisdictions by supporter count (descending)
  const sortedJurisdictions = [...data.byJurisdiction].sort(
    (a, b) => b.supporterCount - a.supporterCount
  );

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    // Use UTC date parts for deterministic formatting
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = date.getUTCDate();
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];
    return `${monthNames[month]} ${day}, ${year}`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Electoral Influence</h2>
        <p className={styles.subtitle}>Supporters by jurisdiction</p>
      </div>

      {sortedJurisdictions.length > 0 ? (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>Jurisdiction</th>
                  <th className={styles.th}>State</th>
                  <th className={`${styles.th} ${styles.thRight}`}>
                    Supporters
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedJurisdictions.map((jurisdiction) => (
                  <tr key={jurisdiction.jurisdictionId} className={styles.tr}>
                    <td className={styles.td}>
                      {jurisdiction.jurisdictionName || "Unknown"}
                    </td>
                    <td className={styles.td}>
                      {jurisdiction.state || "—"}
                    </td>
                    <td className={`${styles.td} ${styles.tdRight}`}>
                      {formatNumber(jurisdiction.supporterCount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.upcomingElections.length > 0 && (
            <div className={styles.upcomingSection}>
              <h3 className={styles.upcomingTitle}>Upcoming Elections</h3>
              <div className={styles.upcomingList}>
                {data.upcomingElections.map((election) => (
                  <div key={election.electionId} className={styles.upcomingItem}>
                    <div className={styles.upcomingHeader}>
                      <span className={styles.upcomingName}>
                        {election.electionName || "Unknown Election"}
                      </span>
                      <span className={styles.upcomingCount}>
                        {formatNumber(election.totalSupporters)} supporters
                      </span>
                    </div>
                    {election.pollDate && (
                      <div className={styles.upcomingDate}>
                        {formatDate(election.pollDate)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className={styles.emptyState}>
          <p>No electoral influence data available</p>
        </div>
      )}
    </div>
  );
}

