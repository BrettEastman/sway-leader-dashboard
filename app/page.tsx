import { LeaderCard } from "@/components/LeaderCard";
import { DataSourceToggle } from "@/components/DataSourceToggle";
import { getAllViewpointGroups } from "@/lib/queries/viewpoint-groups";
import styles from "./page.module.css";

interface HomeProps {
  searchParams: Promise<{ dataSource?: string }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const { dataSource } = await searchParams;
  const dataSourceValue =
    dataSource === "sway_api" ? ("sway_api" as const) : ("supabase" as const);
  const viewpointGroups = await getAllViewpointGroups(dataSourceValue);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>Sway Voting Groups</h1>
            <DataSourceToggle />
          </div>
          <p className={styles.subtitle}>
            Select a voting group to view their influence metrics
          </p>

          {viewpointGroups.length > 0 ? (
            <div className={styles.leadersList}>
              {viewpointGroups.map((group) => (
                <LeaderCard
                  key={group.id}
                  id={group.id}
                  title={group.title}
                  dataSource={dataSourceValue}
                />
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
