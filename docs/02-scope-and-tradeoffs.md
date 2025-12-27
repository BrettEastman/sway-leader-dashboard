# Scope & Tradeoffs

## Intentional Simplifications

- Single leader context
- Read-only dashboard
- Preloaded dataset
- No authentication flows beyond basic setup

## Assumptions

- Verified voters represent credible political leverage
- Jurisdiction-level aggregation is sufficient for insight
- Historical election margins are a reasonable proxy for leverage

## Why These Tradeoffs Are Acceptable

This is an MVP intended to surface insight, not to operationalize mobilization. The chosen scope allows for:

- Clear data modeling
- Meaningful metrics
- A complete end-to-end prototype within time constraints

## What Would Break at Scale

- Heavy relational joins without pre-aggregation
- Recomputing metrics on every request
- Single-tenant assumptions

These issues are acknowledged and addressed in the Future Evolution section of the README.
