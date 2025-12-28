import { getAllViewpointGroups } from "@/lib/queries/viewpoint-groups";
import { LeaderCard } from "@/components/LeaderCard";
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
                <LeaderCard key={group.id} id={group.id} title={group.title} />
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
