# Leader Influence Dashboard (Archived)

## Overview

This project is a prototype **Leader Influence Dashboard** take home project for [Sway.co](https://www.sway.co/). It translates raw political support data into actionable insights that help leaders understand **how much influence they have, where it is located, how it is changing, and how it propagates through their network**.

The dashboard focuses on credible political influence: verified voters, electoral concentration, and real-world relevance.

This project has been archived and is no longer deployed, but here are two images of it as it was:
<img width="1230" height="660" alt="Screenshot 2026-01-19 at 12 21 37 PM" src="https://github.com/user-attachments/assets/85080d99-9fa6-407d-8cf7-b9e722ae4704" />
<img width="1230" height="490" alt="Screenshot 2026-01-19 at 12 22 54 PM" src="https://github.com/user-attachments/assets/34bc550c-9b0f-4c36-9935-0ded8c23d367" />

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

**Description:** The total count of verified voters who are aligned with the leader. This metric represents the leader's core influence base—real, verified individuals who can be mobilized for electoral action. Unlike raw follower counts, this focuses on credible political leverage.

**Summary:** Total number of verified voters aligned with the leader. This is the core currency of influence.

---

### 2. Electoral Influence by Race / Jurisdiction

**Description:** A geographic and electoral breakdown showing where the leader's supporters are located and which specific races or jurisdictions they can impact. This metric helps identify where influence is concentrated and which upcoming elections are most relevant, enabling strategic prioritization of mobilization efforts.

**Summary:** Supporter counts grouped by electoral race or jurisdiction, providing context for where influence may be meaningful. This metric captures situational leverage without attempting precise outcome prediction.

---

### 3. Growth Over Time

**Description:** A time series visualization tracking changes in the Sway Score over time. This metric reveals growth trends, momentum patterns, and whether the leader's influence base is expanding, stable, or declining. It helps identify effective recruitment periods and assess the health of the movement.

**Summary:** Change in Sway Score over time, indicating momentum or stagnation.

---

### 4. Network Reach

**Description:** Identifies supporters who have become leaders themselves, creating a network effect that amplifies influence beyond direct connections. This metric measures downstream reach—the total verified voters aligned with network leaders—showing how influence propagates through the supporter base and highlighting key amplification nodes.

**Summary:** Supporters who have become leaders themselves, representing downstream amplification of influence.

---

## Tech Stack

- **Next.js 16 (App Router with React Compiler)**
- **TypeScript**
- **Supabase (Postgres)** - Test data source
- **Sway GraphQL API** - Production data source
- **Scoped CSS-in-JS**
- **Recharts** (charts)
- **Deployed on Vercel**

The application supports **dual data sources** via an adapter pattern:

- **Supabase**: Test data stored in a relational database with RPC functions for complex metrics
- **Sway GraphQL API**: Production data from Sway's public API (https://www.sway.co/docs/api)

Users can switch between data sources using a toggle on the home page. All metrics are computed using the selected data source.

---

## What Would Change at Scale

At 100k+ supporters or leaders, several architectural changes would become necessary:

### Performance Optimizations

- **Materialized Views:** While our RPC functions are currently fast, at massive scale, we would move from "compute-on-request" to pre-aggregating data into Materialized Views or cache tables.
- **Background computation:** Long-running global analytics would be computed in scheduled background jobs (e.g., Supabase Edge Functions) rather than on every dashboard request
- **Result storage:** Pre-computed metrics would be stored in materialized views or cache tables with appropriate refresh intervals, allowing instant dashboard loads

### Enhanced Modeling

- **Influence modeling:** Would incorporate historical election turnout rates and margin data to provide more nuanced leverage predictions
- **Real-time updates:** WebSocket subscriptions or server-sent events would replace the current read-only approach

### Infrastructure

- **Database scaling:** Read replicas for analytics queries, connection pooling, and query optimization
- **Monitoring and alerting:** Comprehensive observability for query performance and system health

### New Capabilities

- **Cross-leader benchmarking:** Comparative analytics showing how one leader's metrics compare to others in similar contexts
- **Geographic visualizations:** Interactive maps showing influence concentration (currently simplified to jurisdiction lists)

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

Then edit `.env.local` and add your credentials:

**For Supabase (Test Data):**

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-publishable-key
SUPABASE_SECRET_KEY=your-secret-key
```

**For Sway API (Production Data - Optional):**

```
SWAY_API_URL=https://sway-production.hasura.app/v1/graphql
SWAY_JWT=your-jwt-token
```

**Note:**

- The `SUPABASE_SECRET_KEY` (also called "secret" key in the dashboard) is used for admin operations that bypass RLS
- To get a `SWAY_JWT`, exchange your API key: `curl -X POST https://api.sway.co/rest/auth/token -H "x-api-key: YOUR_API_KEY"`
- The UI toggle on the home page is the preferred way to switch data sources (no env var needed)

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

### 6. Load Data (\*Note: this data is provided by the folks at Sway in the form of json files you can put in the `data/` directory)

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

### 7. (Optional) Test Queries

To verify your setup and test the query functions, you can run:

```bash
npm run test-queries
```

This script will test all four core metrics with a sample leader ID and display the results in your terminal. Useful for debugging and verifying data loading.

---

## Running Locally

After completing the setup steps above:

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

### Switching Data Sources

Use the **Data Source** toggle on the home page to switch between:

- **Test Data** (Supabase) - Requires Supabase setup and data loading
- **Sway API** (Production) - Requires `SWAY_API_URL` and `SWAY_JWT` in `.env.local`

The selection persists through navigation via URL query parameters (`?dataSource=sway_api`).
