"use client";

import { useRouter, useSearchParams } from "next/navigation";
import styles from "./DataSourceToggle.module.css";

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

  return (
    <div className={styles.toggleContainer}>
      <label className={styles.label}>Data Source:</label>
      <button
        onClick={handleToggle}
        className={`${styles.toggle} ${
          dataSource === "sway_api" ? styles.active : ""
        }`}
        aria-label={`Using ${
          dataSource === "sway_api" ? "Sway API" : "Test Data"
        }`}
      >
        <span className={styles.toggleLabel}>
          {dataSource === "sway_api"
            ? "Switch to Test Data"
            : "Switch to Sway API"}
        </span>
        <span className={styles.toggleSwitch} />
      </button>
    </div>
  );
}
