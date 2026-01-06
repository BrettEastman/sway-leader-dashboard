# Sway GraphQL API Schema Reference

This document captures the discovered schema fields from the Sway GraphQL API (`https://sway-production.hasura.app/v1/graphql`).

## Authentication

- Exchange API key for JWT using: `curl -X POST https://api.sway.co/rest/auth/token -H "x-api-key: YOUR_API_KEY"`
- Use JWT in Authorization header: `Bearer <token>`

## Root Query Fields (Hasura patterns)

- Use plural form: `viewpointGroups`, `elections`, `profiles`, etc.
- Filter with `where: { field: { _eq: value } }`
- Variable types use `uuid!` for IDs

---

## ViewpointGroups

```
- createdAt (NON_NULL)
- currentSlug (OBJECT: Slugs)
- currentSlugId (SCALAR: uuid)
- description (SCALAR: String)
- groupMission (SCALAR: String)
- headerImage (OBJECT: Media)
- headerImageId (SCALAR: uuid)
- id (NON_NULL)
- influenceTargetNotes (SCALAR: String)
- influenceTargetViewpointGroupRels (NON_NULL)
- isPublic (NON_NULL)
- isSearchable (NON_NULL)
- modules (NON_NULL)
- modulesAggregate (NON_NULL)
- profileViewpointGroupRels (NON_NULL)
- profileViewpointGroupRelsAggregate (NON_NULL)
- slugs (NON_NULL)
- summary (OBJECT: ViewpointGroupSummaries)
- tagViewpointGroupRels (NON_NULL)
- tagViewpointGroupRelsAggregate (NON_NULL)
- thermometerObjective (SCALAR: String)
- thermometerTarget (SCALAR: Int)
- title (SCALAR: String)
- updatedAt (NON_NULL)
```

## ViewpointGroupSummaries

```
- createdAt (NON_NULL)
- supporterCount (NON_NULL)
- updatedAt (NON_NULL)
- verifiedSupporterCount (NON_NULL)
- viewpointGroup (NON_NULL)
- viewpointGroupId (NON_NULL)
```

**Note:** Only aggregated totals are available. No per-jurisdiction breakdown.

---

## Profiles

```
- avatarMedia (OBJECT: Media)
- avatarMediaId (SCALAR: uuid)
- bio (SCALAR: String)
- createdAt (NON_NULL)
- currentSlug (OBJECT: Slugs)
- currentSlugId (SCALAR: uuid)
- displayNameLong (NON_NULL)
- displayNameShort (SCALAR: String)
- extendedBio (SCALAR: String)
- headerImage (OBJECT: Media)
- headerImageId (SCALAR: uuid)
- id (NON_NULL)
- isDisabled (NON_NULL)
- isIdVerified (NON_NULL)
- isLeader (SCALAR: Boolean)
- location (SCALAR: String)           ← User location (free-form string)
- person (OBJECT: Persons)
- personId (SCALAR: uuid)
- profileExternalLinks (NON_NULL)
- profileType (ENUM: ProfileTypesEnum)
- profileUserRels (NON_NULL)
- profileViewpointGroupRels (NON_NULL)
- profileViewpointGroupRelsAggregate (NON_NULL)
- referral (OBJECT: Referrals)
- referralId (SCALAR: uuid)
- referrals (NON_NULL)
- slugs (NON_NULL)
- updatedAt (NON_NULL)
```

**Note:** `voterVerifications` is NOT exposed on Profiles through this public API.

---

## Elections

```
- id (NON_NULL)
- name (SCALAR: String)
- pollDate (SCALAR: Date)
- ballotItems (NON_NULL) ← Related ballot items
```

## BallotItems

```
- ballotItemOptions (NON_NULL)
- createdAt (NON_NULL)
- election (NON_NULL)
- electionId (NON_NULL)
- id (NON_NULL)
- isRankedChoice (NON_NULL)
- jurisdiction (NON_NULL)             ← Related jurisdiction
- jurisdictionId (NON_NULL)
- measure (OBJECT: Measures)          ← For ballot measures
- numSelectionsMax (NON_NULL)
- numWinners (NON_NULL)
- race (OBJECT: Races)                ← For races/offices
- recommendations (NON_NULL)
- updatedAt (NON_NULL)
```

## Jurisdictions

```
- id (NON_NULL)
- name (SCALAR: String)
- state (SCALAR: String)              ← State abbreviation (e.g., "GA", "SC")
```

## Races

**Note:** `office` field is NOT available on Races. Need to introspect further for race details.

---

## Useful Queries

### Get Sway Score (supporter counts)

```graphql
query GetSwayScore($id: uuid!) {
  viewpointGroups(where: { id: { _eq: $id } }) {
    id
    title
    summary {
      supporterCount
      verifiedSupporterCount
    }
    profileViewpointGroupRelsAggregate {
      aggregate {
        count
      }
    }
  }
}
```

### Get Growth Over Time

```graphql
query GetGrowthOverTime($id: uuid!) {
  viewpointGroups(where: { id: { _eq: $id } }) {
    profileViewpointGroupRels(orderBy: { createdAt: ASC }) {
      createdAt
    }
  }
}
```

### Get Upcoming Elections

```graphql
query GetUpcomingElections {
  elections(
    where: { pollDate: { _gte: "now()" } }
    orderBy: { pollDate: ASC }
    limit: 10
  ) {
    id
    name
    pollDate
    ballotItems {
      id
      jurisdictionId
      jurisdiction {
        id
        name
        state
      }
    }
  }
}
```

### Get Supporter Locations

```graphql
query GetSupportersWithLocation($id: uuid!) {
  viewpointGroups(where: { id: { _eq: $id } }) {
    summary {
      supporterCount
    }
    profileViewpointGroupRels {
      profile {
        location
      }
    }
  }
}
```

---

## Voter Verification Data

The API exposes voter verification data at root level but blocks paths to filter by viewpoint group:

### Available Root Queries

```
- jurisdictions (NON_NULL)
- jurisdictionsByPk (OBJECT: Jurisdictions)
- voterVerificationJurisdictionRels (NON_NULL)
- voterVerificationJurisdictionRelsAggregate (NON_NULL)
```

### VoterVerificationJurisdictionRels Fields

```
- jurisdiction (NON_NULL) ← Only this field is exposed
```

### Blocked Paths

- `Profiles` → `voterVerifications` - NOT exposed
- `VoterVerificationJurisdictionRels` → `voterVerification` - NOT filterable

This means you CAN query all voter verification jurisdictions, but you CANNOT filter them by profiles belonging to a specific viewpoint group.

---

## Limitations

1. **Jurisdiction-level supporter counts** - The API exposes `verifiedSupporterCount` as a total, but blocks the path to get per-jurisdiction breakdown. The Supabase RPC has access to voter verification tables that the public API intentionally restricts.
2. **Race/office titles** - `office` field not available on Races type
3. **Location data** - Profile `location` is free-form string (e.g., "San Francisco, CA", "Florida")
4. **Supporter count discrepancy** - `summary.supporterCount` (e.g., 734) may be higher than the number of records in `profileViewpointGroupRels` (e.g., 307). This means some supporters exist in Sway's system but their profile data isn't exposed through the relationship query. Only supporters with profile records can have their location data analyzed.
