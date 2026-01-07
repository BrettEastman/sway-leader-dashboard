"use client";

import type { GrowthOverTimeResult } from "@/lib/queries/types";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useEffect } from "react";
import styles from "./GrowthOverTimeChart.module.css";

interface GrowthOverTimeChartProps {
  data: GrowthOverTimeResult;
}

export function GrowthOverTimeChart({ data }: GrowthOverTimeChartProps) {
  // iOS Safari can report 0px container size on first paint; nudge Recharts to re-measure.
  useEffect(() => {
    const t = window.setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 50);
    return () => window.clearTimeout(t);
  }, []);

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
    <div
      className={styles.container}
      role="region"
      aria-labelledby="growth-chart-title"
    >
      <div className={styles.header}>
        <h2 id="growth-chart-title" className={styles.title}>Growth Over Time</h2>
        <p className={styles.subtitle}>Cumulative verified voter count</p>
      </div>
      {chartData.length === 0 ? (
        <div
          className={styles.emptyState}
          role="status"
          aria-label="No growth data available"
        >
          <p>No growth data available</p>
        </div>
      ) : (
        <div
          className={styles.chartContainer}
          role="img"
          aria-label={
            chartData.length > 0
              ? `Line chart showing cumulative verified voter count over time. Data points range from ${chartData[0].fullDate} to ${chartData[chartData.length - 1].fullDate}. Current count: ${new Intl.NumberFormat("en-US").format(chartData[chartData.length - 1].count)} verified voters.`
              : "Line chart showing cumulative verified voter count over time"
          }
        >
          <ResponsiveContainer width="100%" height="100%" minHeight={220}>
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
