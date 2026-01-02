# Data Model (MVP Subset)

This prototype uses a focused subset of the provided dataset.

## Core Tables

- viewpoint_groups
- profiles
- profile_viewpoint_group_rels
- voter_verifications
- jurisdictions
- elections
- ballot_items

## Derived Concepts

- Supporter count by jurisdiction
- Supporter alignment with upcoming elections
- Network leaders (supporters who became leaders)

## Modeling Strategy

- Preserve relational integrity
- Prefer SQL joins over denormalization
- **Offload complex logic to Supabase RPCs**: Heavy aggregations (like Network Reach and Growth Over Time) are handled in PostgreSQL to minimize network round-trips and latency.
- Compute metrics at query time for MVP simplicity

At scale, these metrics would be transitioned from RPCs to materialized or pre-aggregated tables.
