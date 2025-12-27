# Milestones

## Milestone 1 — Setup & Data

- ✅ Next.js app scaffolded (already complete)
- Supabase project created and configured
- Database schema defined (viewpoint_groups, profiles, profile_viewpoint_group_rels, voter_verifications, jurisdictions, elections, ballot_items)
- Dataset loaded into Supabase
- Environment variables configured
- Supabase client library setup

## Milestone 2 — Queries & Metrics

Implement server-side queries for all 4 core metrics:

- **Sway Score**: Total verified voter count for the leader
- **Electoral Influence**: Supporter counts by jurisdiction/race
  - Jurisdiction aggregation
  - Upcoming election alignment
- **Growth Over Time**: Sway Score change over time (time series data)
- **Network Reach**: Supporters who became leaders themselves (with downstream counts)

Create reusable query functions in `lib/queries/`

## Milestone 3 — Dashboard UI

Build visualization components for all metrics:

- **Sway Score**: Hero metric card with prominent display and trend indicator
- **Electoral Influence**: Comparative jurisdiction view (table or list)
- **Growth Over Time**: Time series line chart (using Recharts)
- **Network Reach**: List/table of network leaders with downstream reach
- Dashboard layout: Route structure at `app/leader/[leaderId]/dashboard`
- Metric summary cards component

## Milestone 4 — Polish & Documentation

- README updates (if needed)
- Future evolution notes
- Code cleanup and final review pass
- Verify all 4 core metrics are displayed and functional
