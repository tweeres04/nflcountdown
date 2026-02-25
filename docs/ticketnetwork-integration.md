# TicketNetwork affiliate integration

## Table of contents
- [Status](#status)
- [Context](#context)
- [CJ API details](#cj-api-details)
- [Query strategy](#query-strategy)
- [Data structure](#data-structure)
- [Keyword strategy](#keyword-strategy)
- [Category filtering](#category-filtering)
- [Game matching strategy](#game-matching-strategy)
- [Caching strategy](#caching-strategy)
- [Edge cases](#edge-cases)

## Status

**Shipped.** Live on all leagues except CPL.

## Context

TicketNetwork is a ticket marketplace. We're approved as a publisher through CJ Affiliate (Commission Junction). CJ provides a GraphQL API that returns TicketNetwork's event listings with pre-built tracked affiliate links (`clickUrl`). We don't need to construct tracking URLs ourselves — CJ handles domain rotation and tracking parameters.

All leagues confirmed working: NFL, MLB, NBA, NHL, WNBA, MLS. CPL has no coverage (expected) and is explicitly excluded.

## CJ API details

**Endpoint:** `POST https://ads.api.cj.com/query`

**Auth:** `Authorization: Bearer ${CJ_ACCESS_TOKEN}`

**Content-Type:** `application/json`

**Key environment variables:**

| Env var | Description |
|---|---|
| `CJ_ACCESS_TOKEN` | Bearer token for API auth (secret) |
| `CJ_COMPANY_ID` | Our publisher company ID (CID) in CJ |
| `CJ_WEBSITE_PID` | Our website/property ID for link generation |
| `CJ_TICKETNETWORK_PARTNER_ID` | TicketNetwork's advertiser ID in CJ |

**Other reference values (not env vars):**

| Value | Description |
|---|---|
| `13378336` | CJ ad/link ID — appears in all generated clickUrls, set by CJ |

**Rate limits:** 500 calls per 5 minutes. With per-event caching, we rarely hit the API for the same game twice.

## Query strategy

We use the `travelExperienceProducts` query (not the generic `products` query). Key differences:

- Returns only `TravelExperience` type products (events, travel) — already scoped to our use case
- `categoryName` field is available directly (not as an inline fragment field)
- Same `limit`, `keywords`, `partnerIds` arguments

**GraphQL query:**

```graphql
{
  travelExperienceProducts(
    companyId: "${CJ_COMPANY_ID}",
    partnerIds: ["${CJ_TICKETNETWORK_PARTNER_ID}"],
    keywords: ["Toronto Blue Jays", "Blue Jays", "Oakland Athletics", "Athletics"],
    limit: 100
  ) {
    resultList {
      id
      title
      linkCode(pid: "${CJ_WEBSITE_PID}") { clickUrl }
      ... on TravelExperience {
        travelStartDate
        performers
        locationName
        categoryName
      }
    }
  }
}
```

## Data structure

Each product in the response:

| Field | Type | Example | Description |
|---|---|---|---|
| `id` | string | `"7274990"` | TicketNetwork event ID |
| `title` | string | `"Toronto Blue Jays vs. The Athletics"` | Game title |
| `performers` | string | `"The Athletics\|Toronto Blue Jays"` | Pipe-delimited team names |
| `categoryName` | string | `"Sports \| Baseball \| Professional (MLB)"` | TicketNetwork category hierarchy |
| `travelStartDate` | ISO 8601 | `"2026-03-27T08:00:00Z"` | Game date (time portion is midnight UTC, not game time) |
| `locationName` | string | `"Rogers Centre"` | Venue name |
| `linkCode.clickUrl` | string | Full CJ URL | Ready-to-use tracked affiliate link |

**clickUrl format:** `https://www.{cj-domain}.com/click-101691187-13378336?url=https%3A%2F%2Fwww.ticketnetwork.com%2Ftickets%2F{eventId}&cjsku={eventId}`

CJ rotates between domains: `kqzyfj.com`, `anrdoezrs.net`, `tkqlhce.com`, `dpbolvw.net` — never hardcode these.

## Keyword strategy

We pass `[team.fullName, team.nickName, opponent.fullName, opponent.nickName]` as keywords. This handles two problems:

**Problem 1 — Name mismatches:** TicketNetwork doesn't always use our team's `fullName`. For example, `"Oakland Athletics"` returns zero results because TicketNetwork calls them `"The Athletics"`. But `"Athletics"` (the nickName) does find them. Sending both ensures coverage.

**Problem 2 — Relevance:** Including the opponent's names significantly improves result relevance. The top results are almost always the exact matchup we're looking for.

| Keyword array | Result |
|---|---|
| `["Oakland Athletics"]` | Oakland Ballet, World Athletics Championships — 0 MLB games |
| `["Athletics"]` | World Athletics Championships, then MLB games |
| `["Oakland Athletics", "Athletics"]` | MLB Athletics games (World Athletics filtered by categoryName) |
| `["Toronto Blue Jays", "Blue Jays", "Oakland Athletics", "Athletics"]` | Athletics vs Blue Jays games appear first |

If no opponent is available (TBD game), we fall back to just `[team.fullName, team.nickName]`.

## Category filtering

TicketNetwork's `categoryName` field is a pipe-delimited hierarchy, e.g.:
- `"Sports | Baseball | Professional (MLB)"`
- `"Sports | Football | NFL"`
- `"Sports | Basketball | Professional (NBA)"`
- `"Theater | Ballet"`

We filter results to only include products where `categoryName` contains the league string. This eliminates noise like Oakland Ballet or World Athletics Championships that keyword search alone can't prevent.

| League | Filter string | Example categoryName |
|---|---|---|
| NFL | `NFL` | `Sports \| Football \| NFL` |
| MLB | `MLB` | `Sports \| Baseball \| Professional (MLB)` |
| NBA | `NBA` | `Sports \| Basketball \| Professional (NBA)` |
| NHL | `NHL` | `Sports \| Hockey \| Professional (NHL)` |
| WNBA | `WNBA` | `Sports \| Basketball \| Professional (WNBA)` |
| MLS | `MLS` | `Sports \| Soccer \| Professional (MLS)` |

We also filter out season ticket packages by requiring two performers (the `performers` string must contain `|`).

## Game matching strategy

1. Check per-event cache (`data/cache/cj-tickets.json`, key `team-slug|YYYY-MM-DD`) — return immediately on hit
2. On cache miss, query `travelExperienceProducts` with `[team.fullName, team.nickName, opponent.fullName, opponent.nickName]`
3. Filter results by `categoryName` containing the league string
4. Filter to products with two performers (has `|`)
5. Sort by `travelStartDate` ascending
6. Match by date (`travelStartDate.slice(0,10) === gameDate.slice(0,10)`)
7. Fall back to next future game chronologically
8. If no future games, return null (no link shown)
9. Cache the resulting `clickUrl` for this game

## Caching strategy

- **Storage:** Single JSON file at `data/cache/cj-tickets.json` — all leagues, all teams, all games in one flat object
- **Cache key:** `"team-slug|YYYY-MM-DD"` e.g. `"toronto-blue-jays|2026-03-27"`
- **Per-entry TTL:** 7 days — each entry has its own `cachedAt` timestamp
- **Probabilistic cleanup:** ~5% chance on each write to purge expired entries (no cron needed)
- **Granularity:** Per-event, not per-team. Each game is cached independently so one stale entry doesn't invalidate an entire team's cache.
- **Survives:** Server restarts and deploys (disk-based, not in-memory)

## Edge cases

1. **"The Athletics" name mismatch:** Solved by keyword strategy — `nickName` "Athletics" finds them even though `fullName` "Oakland Athletics" doesn't.

2. **NFL offseason / TBD dates:** Events exist with placeholder dates. No date match, so falls back to next future game. Still shows a valid ticket link.

3. **CPL:** No TicketNetwork coverage. Explicitly excluded in both route loaders — `affiliateLinksPromise` resolves to `null` immediately without hitting the API.

4. **CJ API down / timeout:** 8-second `AbortSignal.timeout`. `searchTicketNetworkEvents` wraps everything in try/catch and returns `[]`. Route loaders add `.catch(() => null)`. Page always loads cleanly.

5. **No tickets available:** `getAffiliateLinks` returns `null`. The `<Await>` renders nothing. No button shown.

6. **No date filter on CJ API:** The `travelExperienceProducts` query has no date range argument. We rely on keyword + categoryName filtering to get relevant results, then match by date client-side.
