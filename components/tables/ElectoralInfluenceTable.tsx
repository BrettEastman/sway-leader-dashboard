import type { ElectoralInfluenceResult } from "@/lib/queries/types";
import styles from "./ElectoralInfluenceTable.module.css";

interface ElectoralInfluenceTableProps {
  data: ElectoralInfluenceResult;
}

export function ElectoralInfluenceTable({
  data,
}: ElectoralInfluenceTableProps) {
  // Aggregate jurisdictions by name + state to combine duplicates
  const jurisdictionMap = new Map<
    string,
    { name: string; state: string | null; count: number }
  >();

  data.byJurisdiction.forEach((jurisdiction) => {
    const name = jurisdiction.jurisdictionName || "Unknown";
    const state = jurisdiction.state;
    // Create a key from name + state (use "Unknown State" for null states to group them)
    const key = `${name}|${state || "Unknown State"}`;

    const existing = jurisdictionMap.get(key);
    if (existing) {
      existing.count += jurisdiction.supporterCount;
    } else {
      jurisdictionMap.set(key, {
        name,
        state,
        count: jurisdiction.supporterCount,
      });
    }
  });

  // Convert map to array and sort by supporter count (descending)
  const sortedJurisdictions = Array.from(jurisdictionMap.values()).sort(
    (a, b) => b.count - a.count
  );

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  return (
    <div
      className={styles.container}
      role="region"
      aria-labelledby="electoral-influence-title"
    >
      <div className={styles.header}>
        <h2 id="electoral-influence-title" className={styles.title}>
          Electoral Influence
        </h2>
        <p className={styles.subtitle}>
          Voters supporting this group, arranged by jurisdiction
        </p>
      </div>

      {sortedJurisdictions.length > 0 ? (
        <>
          <div className={styles.tableWrapper}>
            <table
              className={styles.table}
              aria-label="Electoral influence by jurisdiction"
            >
              <caption className={styles.caption}>
                Table showing voters supporting this group, arranged by
                jurisdiction
              </caption>
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
                {sortedJurisdictions.map((jurisdiction, index) => (
                  <tr
                    key={`${jurisdiction.name}-${jurisdiction.state}-${index}`}
                    className={styles.tr}
                  >
                    <td className={styles.td}>{jurisdiction.name}</td>
                    <td className={styles.td}>{jurisdiction.state || "—"}</td>
                    <td className={`${styles.td} ${styles.tdRight}`}>
                      {formatNumber(jurisdiction.count)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className={styles.emptyState} role="status">
          <p>No electoral influence data available</p>
        </div>
      )}
    </div>
  );
}
