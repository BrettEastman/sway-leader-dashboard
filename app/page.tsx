import Link from "next/link";
import { getAllViewpointGroups } from "@/lib/queries/viewpoint-groups";
import styles from "./page.module.css";

export default async function Home() {
  const viewpointGroups = await getAllViewpointGroups();

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.container}>
          <h1 className={styles.title}>Leader Influence Dashboard</h1>
          <p className={styles.subtitle}>
            Select a leader to view their influence metrics
          </p>

          {viewpointGroups.length > 0 ? (
            <div className={styles.leadersList}>
              {viewpointGroups.map((group) => (
                <Link
                  key={group.id}
                  href={`/leader/${group.id}/dashboard`}
                  className={styles.leaderCard}
                >
                  <h2 className={styles.leaderTitle}>{group.title}</h2>
                  <span className={styles.leaderArrow}>→</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p>No leaders found</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
