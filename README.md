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

- **Next.js 16 (App Router with React Compiler)**
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

## AI Usage

AI tools were used as a development assistant - ChatGPT for discussion and preplanning, Cursor for scaffolding and iteration. All product decisions, metric definitions, and architectural choices were made intentionally and reviewed manually.

---

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) and create a new project
2. Choose a project name (e.g., "sway-leader-dashboard")
3. Set a database password (save this securely)
4. Choose a region closest to you
5. Wait for the project to initialize (~2 minutes)

### 3. Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
cp .env.example .env.local
```

Then edit `.env.local` and add your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-publishable-key
SUPABASE_SECRET_KEY=your-secret-key
```

**Note:** The `SUPABASE_SECRET_KEY` (also called "secret" key in the dashboard) is used for admin operations that bypass RLS. The `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` is used for regular client operations.

### 4. Copy/paste Supabase Credentials

From your Supabase project dashboard:

1. Go to **Project Settings → Data API**
2. Copy the **URL** to NEXT_PUBLIC_SUPABASE_URL in .env.local
3. Go to **API Keys**
4. Copy the **Publishable key** to NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
5. Copy the **Secret key** to SUPABASE_SECRET_KEY

### 5. Run Database Migration

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open `supabase/migrations/001_initial_schema.sql`
4. Copy the entire SQL file contents
5. Paste into the SQL Editor
6. Click **Run** to create all tables

### 6. Load Data

After the migration succeeds, load the JSON data into Supabase:

```bash
npm run load-data
```

This script will:

- Read JSON files from the `data/` directory
- Load them in the correct dependency order
- Validate row counts
- Report any errors

**Note:** Make sure your `.env.local` file is configured before running this script.

---

## Running Locally

After completing the setup steps above:

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.
