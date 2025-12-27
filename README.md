# Leader Influence Dashboard (Sway Take-Home)

## Overview

This project is a prototype **Leader Influence Dashboard** for Sway. It translates raw political support data into actionable insights that help leaders understand **how much influence they have, where it is located, how it is changing, and how it propagates through their network**.

The dashboard focuses on credible political influence: verified voters, electoral concentration, and real-world relevance.

---

## Product Thinking

On Sway, influence is not simply audience size — it is the ability to mobilize a coordinated bloc of verified voters within specific elections.

This prototype helps a leader answer four core questions:

1. How much influence do I have?
2. Where does that influence actually matter?
3. Is my movement gaining momentum?
4. How far does my influence extend through my network?

Each metric is designed to lead directly to insight and action.

---

## Core Metrics (MVP)

### 1. Sway Score

Total number of verified voters aligned with the leader. This is the core currency of influence.

---

### 2. Electoral Influence by Race / Jurisdiction

Supporter counts grouped by race or jurisdiction, providing context for where influence may be meaningful. This metric captures situational leverage without attempting precise outcome prediction.

---

### 3. Growth Over Time

Change in Sway Score over time, indicating momentum or stagnation.

---

### 4. Network Reach

Supporters who have become leaders themselves, representing downstream amplification of influence.

---

## Tech Stack

- **Next.js 16 (App Router)**
- **TypeScript**
- **Supabase (Postgres)**
- **Scoped CSS-in-JS**
- **Recharts** (charts)
- **Deployed on Vercel**

All data is modeled and queried from a real relational database. Metrics are computed server-side.

---

## Data Modeling Approach

The dataset represents a complex political graph: supporters, jurisdictions, elections, and ballot items.

For this MVP:

- Core relational tables are preserved
- Metrics are computed via SQL joins
- Clarity and extensibility are prioritized over premature optimization

At larger scales, this approach would evolve toward aggregation and background computation.

---

## Tradeoffs & Simplifications

- Single leader context
- Read-only analytics
- No real-time updates
- No geographic map visualizations

These decisions keep the scope appropriate for a 4–8 hour prototype.

---

## What Would Change at Scale

At 100k+ supporters or leaders:

- Metrics would be pre-aggregated
- Influence modeling would incorporate turnout and historical margins
- Cross-leader benchmarking would unlock new insights
- Caching and background jobs would become necessary

---

## What I’d Build Next

1. Ranked table of high-impact elections
2. Recruitment targeting based on near-threshold races
3. Comparative influence benchmarks across leaders

---

## Running Locally

```bash
npm install
npm run dev
```
