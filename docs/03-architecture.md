# Architecture

## Framework

- Next.js 16 (App Router)
- TypeScript
- Supabase

## Rendering Strategy

- Default to **Server Components** for data-heavy views
- Use **Client Components** only where interactivity or chart libraries require it

Rationale:

- Simplifies data access
- Avoids client-side data fetching complexity
- Matches analytics-style dashboard use cases

## Styling

- **CSS Modules**: Scoped component styles (`.module.css` files)
- **CSS Custom Properties**: Theme variables defined in `app/globals.css`
- No utility frameworks (Tailwind, etc.)
- Emphasis on clarity and restraint
- Mobile-first responsive design

## Data Access

The application uses an **adapter pattern** to support dual data sources:

### Data Sources

1. **Supabase Postgres** (Test Data)

   - Relational database for test/development data
   - **Optimized RPCs**: Complex metrics use **Supabase RPC functions** to perform multi-stage joins and window functions directly on the database server
   - All data comes from the database at runtime

2. **Sway GraphQL API** (Production Data)
   - Production data from Sway's public GraphQL API
   - Queries use GraphQL introspection to discover available fields
   - JWT authentication via `SWAY_JWT` environment variable
   - See `docs/08-sway-api-schema.md` for schema documentation

### Query Architecture

- **Server-side queries**: Metrics are triggered from Next.js Server Components
- **Query functions**: Reusable functions in `lib/queries/` act as a clean interface between the Next.js frontend and data sources
- **Adapter pattern**: Each query function (`getSwayScore`, `getGrowthOverTime`, etc.) has `FromSupabase` and `FromAPI` variants, with the main function switching based on the `dataSource` parameter
- **Type safety**: Shared TypeScript types between queries and components
- **Runtime switching**: Users can toggle data sources via UI (URL query parameter: `?dataSource=sway_api`)

## Folder Structure

The project follows Next.js 16 App Router conventions:

```
app/
  ├── leader/[leaderId]/dashboard/  # Dynamic route for leader dashboards
  ├── page.tsx                       # Home page (leader selection)
  ├── layout.tsx                     # Root layout
  └── globals.css                    # Global styles

components/
  ├── cards/                         # Metric card components
  │   ├── SwayScoreCard.tsx
  │   └── UpcomingElectionsCard.tsx
  ├── charts/                        # Chart components (Client Components)
  │   └── GrowthOverTimeChart.tsx
  ├── tables/                        # Table components
  │   ├── ElectoralInfluenceTable.tsx
  │   └── NetworkReachTable.tsx
  ├── LeaderCard.tsx                # Leader selection card
  └── DataSourceToggle.tsx          # Data source switcher (Client Component)

lib/
  ├── queries/                       # Server-side query functions
  │   ├── sway-score.ts              # Adapter: Supabase + Sway API
  │   ├── electoral-influence.ts     # Adapter: Supabase + Sway API
  │   ├── growth-over-time.ts         # Adapter: Supabase + Sway API
  │   ├── network-reach.ts           # Adapter: Supabase + Sway API
  │   ├── viewpoint-groups.ts        # Viewpoint group queries
  │   ├── graphql-client.ts          # Sway GraphQL API client
  │   ├── types.ts                   # Shared TypeScript types
  │   └── index.ts                   # Public exports
  ├── supabase/                      # Supabase client utilities
  │   ├── client.ts                 # Client-side client
  │   ├── server.ts                 # Server-side client
  │   └── admin.ts                  # Admin client (bypasses RLS)
  └── db/
      └── types.ts                   # Database type definitions

scripts/
  ├── load-data.ts                   # Data loading script
  └── test-queries.ts                # Query testing utility

supabase/
  └── migrations/
      └── 001_initial_schema.sql     # Database schema
```

## Component Architecture

- **Server Components** (default): All page components and most data-fetching components
- **Client Components**:
  - `GrowthOverTimeChart` (requires Recharts interactivity)
  - `DataSourceToggle` (handles URL query parameter updates)
  - `LeaderCard` (handles navigation with query params)
- **CSS Modules**: Scoped styling for each component (`.module.css` files)
