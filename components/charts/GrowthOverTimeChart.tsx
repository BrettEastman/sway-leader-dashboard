"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { GrowthOverTimeResult } from "@/lib/queries/types";
import styles from "./GrowthOverTimeChart.module.css";

interface GrowthOverTimeChartProps {
  data: GrowthOverTimeResult;
}

export function GrowthOverTimeChart({ data }: GrowthOverTimeChartProps) {
  // Format dates for display
  const chartData = data.dataPoints.map((point) => ({
    date: new Date(point.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    fullDate: point.date,
    count: point.cumulativeCount,
  }));

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Growth Over Time</h2>
        <p className={styles.subtitle}>Cumulative verified voter count</p>
      </div>
      {chartData.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No growth data available</p>
        </div>
      ) : (
        <div className={styles.chartContainer}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--card-border)"
              />
              <XAxis
                dataKey="date"
                stroke="var(--text-secondary)"
                style={{ fontSize: "0.75rem" }}
              />
              <YAxis
                stroke="var(--text-secondary)"
                style={{ fontSize: "0.75rem" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--card-background)",
                  border: "1px solid var(--card-border)",
                  borderRadius: "var(--radius-md)",
                  color: "var(--text-primary)",
                }}
                labelStyle={{ color: "var(--text-primary)" }}
                formatter={(value: number) => [
                  new Intl.NumberFormat("en-US").format(value),
                  "Verified Voters",
                ]}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="var(--accent)"
                strokeWidth={2}
                dot={{ fill: "var(--accent)", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
