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

- **Supabase Postgres**: Relational database for all data
- **Server-side queries**: All metrics computed server-side in Next.js Server Components
- **Query functions**: Reusable functions in `lib/queries/` that handle SQL joins and aggregations
- **Type safety**: Shared TypeScript types between queries and components
- **No static JSON imports**: All data comes from the database at runtime

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
  └── LeaderCard.tsx                # Leader selection card

lib/
  ├── queries/                       # Server-side query functions
  │   ├── sway-score.ts
  │   ├── electoral-influence.ts
  │   ├── growth-over-time.ts
  │   ├── network-reach.ts
  │   ├── viewpoint-groups.ts
  │   ├── types.ts                  # Shared TypeScript types
  │   └── index.ts                  # Public exports
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
- **Client Components**: Only `GrowthOverTimeChart` (requires Recharts interactivity)
- **CSS Modules**: Scoped styling for each component (`.module.css` files)
