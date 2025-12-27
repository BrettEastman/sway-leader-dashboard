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

- Scoped CSS-in-JS (e.g. CSS Modules or styled-jsx)
- No utility frameworks
- Emphasis on clarity and restraint

## Data Access

- Supabase Postgres
- Server-side queries
- No static JSON imports

## Folder Structure (Proposed)

- app/leader/[leaderId]/dashboard
- components/
  - charts/
  - cards/
- lib/
  - db/
  - queries/
- types/
