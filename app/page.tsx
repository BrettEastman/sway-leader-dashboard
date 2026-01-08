import { DataSourceToggle } from "@/components/DataSourceToggle";
import { LeaderCard } from "@/components/LeaderCard";
import { getAllViewpointGroups } from "@/lib/queries/viewpoint-groups";
import styles from "./page.module.css";

// In Next.js 15+, searchParams is automatically provided to page components by the framework. It is a promise that resolves to an object of the search parameters.
interface HomeProps {
  searchParams: Promise<{ dataSource?: string }>;
}

export default async function Home({ searchParams }: HomeProps) {
  // We get just the dataSource param from searchParams so we can find out if it is set to "sway_api" or not
  const { dataSource } = await searchParams;
  // We create dataSourceValue as a const of either "sway_api" or "supabase" based on the dataSource param
  const dataSourceValue =
    dataSource === "sway_api" ? ("sway_api" as const) : ("supabase" as const);
  // Then, we call the getAllViewpointGroups function with the dataSourceValue to get either the list of viewpoint groups from the Sway API or the test data from Supabase
  const viewpointGroups = await getAllViewpointGroups(dataSourceValue);

  return (
    <div className={styles.page}>
      <main className={styles.main} aria-label="Sway Voting Groups home page">
        <div className={styles.container}>
          <div
            className={styles.header}
            aria-label="Sway Voting Groups home page header"
          >
            <h1 className={styles.title}>Sway Voting Groups</h1>
            <DataSourceToggle />
          </div>
          <p className={styles.subtitle}>
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
            <div className={styles.emptyState} role="status" aria-live="polite">
              <p>No leaders found</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
