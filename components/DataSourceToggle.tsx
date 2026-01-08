"use client";

import { useRouter, useSearchParams } from "next/navigation";
import styles from "./DataSourceToggle.module.css";

// In client components, we can use the useSearchParams hook to get the current search params.

export function DataSourceToggle() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Derive dataSource directly from searchParams instead of storing in state
  const dataSource =
    searchParams.get("dataSource") === "sway_api"
      ? ("sway_api" as const)
      : ("supabase" as const);

  const handleToggle = () => {
    const newSource = dataSource === "supabase" ? "sway_api" : "supabase";
    const params = new URLSearchParams(searchParams.toString());

    if (newSource === "sway_api") {
      params.set("dataSource", "sway_api");
    } else {
      params.delete("dataSource");
    }

    router.push(`/?${params.toString()}`);
  };

  const toggleId = "data-source-toggle";

  return (
    <div className={styles.toggleContainer}>
      <label htmlFor={toggleId} className={styles.label}>
        Data Source:
      </label>
      <button
        id={toggleId}
        onClick={handleToggle}
        className={`${styles.toggle} ${
          dataSource === "sway_api" ? styles.active : ""
        }`}
        aria-label={`Toggle data source. Currently using ${
          dataSource === "sway_api" ? "Sway API" : "Test Data"
        }. Click to switch to ${
          dataSource === "sway_api" ? "Test Data" : "Sway API"
        }`}
      >
        <span className={styles.toggleLabel}>
          {dataSource === "sway_api"
            ? "Switch to Test Data"
            : "Switch to Sway API"}
        </span>
        <span className={styles.toggleSwitch} aria-hidden="true" />
      </button>
    </div>
  );
}
