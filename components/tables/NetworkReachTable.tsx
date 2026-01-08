import type { NetworkReachResult } from "@/lib/queries/types";
import styles from "./NetworkReachTable.module.css";

interface NetworkReachTableProps {
  data: NetworkReachResult;
}

export function NetworkReachTable({ data }: NetworkReachTableProps) {
  // Sort network leaders by downstream reach (descending)
  const sortedLeaders = [...data.networkLeaders].sort(
    (a, b) => b.downstreamVerifiedVoters - a.downstreamVerifiedVoters
  );

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  return (
    <div
      className={styles.container}
      role="region"
      aria-labelledby="network-reach-title"
    >
      <div className={styles.header}>
        <h2 id="network-reach-title" className={styles.title}>
          Network Reach
        </h2>
        <p className={styles.subtitle}>
          Voters supporting this group who became leaders themselves
        </p>
      </div>

      {sortedLeaders.length > 0 ? (
        <>
          <div className={styles.summary} role="status">
            <span className={styles.summaryLabel}>Total downstream reach:</span>
            <span className={styles.summaryValue}>
              {formatNumber(data.totalDownstreamReach)} verified voters
            </span>
          </div>

          <div className={styles.tableWrapper}>
            <table
              className={styles.table}
              aria-label="Network reach table showing downstream voters by leader"
            >
              <caption className={styles.caption}>
                Table showing voters supporting this group who became leaders
                themselves
              </caption>
              <thead>
                <tr>
                  <th className={styles.th}>Leader</th>
                  <th className={styles.th}>Viewpoint Group</th>
                  <th className={`${styles.th} ${styles.thRight}`}>
                    Downstream Voters
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedLeaders.map((leader) => (
                  <tr key={leader.profileId} className={styles.tr}>
                    <td className={styles.td}>
                      {leader.displayName || "Unknown"}
                    </td>
                    <td className={styles.td}>
                      {leader.viewpointGroupTitle || "—"}
                    </td>
                    <td className={`${styles.td} ${styles.tdRight}`}>
                      {formatNumber(leader.downstreamVerifiedVoters)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className={styles.emptyState} role="status">
          <p>No network leaders found</p>
        </div>
      )}
    </div>
  );
}
