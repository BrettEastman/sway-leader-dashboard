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
- supporterCount (Int)
- verifiedSupporterCount (Int)
```

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

## Limitations

1. **Voter verification data** - Not exposed through Profiles; cannot get precise jurisdiction-level supporter counts
2. **Race/office titles** - `office` field not available on Races type
3. **Location data** - Profile `location` is free-form string, may require parsing to match with jurisdiction states

