"use client";

import Link from "next/link";
import { useState } from "react";
import styles from "./LeaderCard.module.css";

interface LeaderCardProps {
  id: string;
  title: string;
  dataSource?: "supabase" | "sway_api";
}

export function LeaderCard({ id, title, dataSource }: LeaderCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = () => {
    setIsLoading(true);
  };

  const href =
    dataSource === "sway_api"
      ? `/leader/${id}/dashboard?dataSource=sway_api`
      : `/leader/${id}/dashboard`;

  return (
    <Link
      href={href}
      className={styles.leaderCard}
      onClick={handleClick}
      aria-label={`View dashboard for ${title}`}
    >
      <h2 className={styles.leaderTitle}>{title}</h2>
      {isLoading ? (
        <div className={styles.spinner} aria-label="Loading">
          <svg
            className={styles.spinnerSvg}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              className={styles.spinnerCircle}
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              className={styles.spinnerPath}
              d="M12 2C13.3132 2 14.6136 2.25866 15.8268 2.7612C17.0401 3.26375 18.1425 4.00035 19.0711 4.92893C19.9997 5.85752 20.7362 6.95991 21.2388 8.17317C21.7413 9.38642 22 10.6868 22 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      ) : (
        <span className={styles.leaderArrow}>→</span>
      )}
    </Link>
  );
}
