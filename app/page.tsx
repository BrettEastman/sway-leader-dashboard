import { DataSourceToggle } from "@/components/DataSourceToggle";
import { LeaderCard } from "@/components/LeaderCard";
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
      <main className={styles.main} aria-label="Sway Voting Groups home page">
        <div className={styles.container}>
          <div
            className={styles.header}
            aria-label="Sway Voting Groups home page header"
            role="banner"
          >
            <h1 className={styles.title}>Sway Voting Groups</h1>
            <DataSourceToggle />
          </div>
          <p
            className={styles.subtitle}
            aria-label="Sway Voting Groups home page subtitle"
          >
            Select a voting group to view their influence metrics
          </p>

          {viewpointGroups.length > 0 ? (
            <div
              className={styles.leadersList}
              role="list"
              aria-label="List of voting groups"
            >
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
