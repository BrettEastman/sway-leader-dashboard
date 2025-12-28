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
        <div className={styles.emptyState}>
          <p>No electoral influence data available</p>
        </div>
      )}
    </div>
  );
}
