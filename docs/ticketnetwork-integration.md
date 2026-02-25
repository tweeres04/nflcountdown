# TicketNetwork affiliate integration plan

## Table of contents
- [Context](#context)
- [CJ API details](#cj-api-details)
- [Data structure](#data-structure)
- [Keyword strategy](#keyword-strategy)
- [Game matching strategy](#game-matching-strategy)
- [Implementation steps](#implementation-steps)
- [Caching strategy](#caching-strategy)
- [Edge cases](#edge-cases)

## Context

TicketNetwork is a ticket marketplace. We're approved as a publisher through CJ Affiliate (Commission Junction). CJ provides a GraphQL Product Search API that returns TicketNetwork's event listings with pre-built tracked affiliate links (`clickUrl`). We don't need to construct tracking URLs ourselves — CJ handles domain rotation and tracking parameters.

Verified that all four leagues we support have events in the catalog: NFL, MLB, NBA, WNBA. NFL offseason events exist with "(Date: TBD)" titles and placeholder dates.

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
| `1621` | TicketNetwork's catalog ID |
| `13378336` | CJ ad/link ID — appears in all generated clickUrls, set by CJ |

**Rate limits:** 500 calls per 5 minutes.

**GraphQL query:**

```graphql
{
    products(
        companyId: "${CJ_COMPANY_ID}",
        partnerIds: ["${CJ_TICKETNETWORK_PARTNER_ID}"],
        keywords: ["Seattle", "Seahawks"],
        limit: 100
    ) {
        resultList {
            id
            title
            price { amount, currency }
            customLabel0
            customLabel1
            linkCode(pid: "${CJ_WEBSITE_PID}") { clickUrl }
            ... on TravelExperience {
                travelStartDate
                travelType
                performers
                locationName
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
| `title` | string | `"Edmonton Oilers vs. Vancouver Canucks"` | Game title |
| `performers` | string | `"Edmonton Oilers\|Vancouver Canucks"` | Pipe-delimited team names |
| `travelStartDate` | ISO 8601 | `"2026-04-16T08:00:00Z"` | Game date (time portion is not game time) |
| `travelType` | string | `"events"` | Always "events" for tickets |
| `locationName` | string | `"Rogers Place"` | Venue name |
| `customLabel0` | string | `"07:00:00 PM"` | Local game time |
| `customLabel1` | string | `"103.4 - 1485.0"` | Price range (low - high) |
| `price.amount` | string | `"103.40"` | Lowest ticket price (USD) |
| `linkCode.clickUrl` | string | Full CJ URL | Ready-to-use tracked affiliate link |

**clickUrl format:** `https://www.{cj-domain}.com/click-101691187-13378336?url=https%3A%2F%2Fwww.ticketnetwork.com%2Ftickets%2F{eventId}&cjsku={eventId}`

CJ rotates between domains: `kqzyfj.com`, `anrdoezrs.net`, `tkqlhce.com`, `dpbolvw.net`

**Fields that are always null/empty for TicketNetwork:** `brand`, `destinationCity`, `destinationName`, `locationId`, `imageLink` (generic placeholder), `availabilityStart`, `availabilityEnd`, `salePriceEffectiveDateStart`, `salePriceEffectiveDateEnd`, `salePrice`

## Keyword strategy

The `keywords` parameter accepts an array of strings. Using the full team name split into words prevents false positives:

| Query | Risk |
|---|---|
| `keywords: "seahawks"` | Matches Wagner Seahawks (college) |
| `keywords: ["Seattle", "Seahawks"]` | Matches only Seattle Seahawks |

**Implementation:** Split `team.fullName` by spaces and pass as the keywords array.

**Edge case:** Teams with short/common city names (e.g., "New York") appear in multiple leagues. The `performers` field in the response lets us filter to the exact team after the query returns.

## Game matching strategy

For a given `Game` object on our site:

1. Query CJ with `keywords` from `team.fullName` split into words
2. Filter results where `performers` (pipe-split) contains our team's full name
3. Match by `travelStartDate` (compare date portion only) to our game's date
4. If matched, use that product's `clickUrl`
5. If no date match (e.g., TBD games), match by opponent name from `performers`
6. If still no match, fall back to no ticket link (don't show broken links)

## Implementation steps

### Step 1: CJ API service module (~15 min)

**New file:** `app/lib/cj-service.ts`

- `searchTicketNetworkEvents(teamFullName: string): Promise<CJProduct[]>`
- Sends GraphQL query to CJ API
- Parses response into typed array
- Handles errors gracefully (returns empty array, logs server-side)
- File-based JSON cache with 7-day TTL (survives server restarts and deploys)

### Step 2: Update affiliate-links.ts (~20 min)

- Make `getAffiliateLinks()` async
- Add TicketNetwork as the ticket provider (replacing StubHub placeholder)
- Accept optional `Game` parameter for game-specific matching
- Call `searchTicketNetworkEvents()` and match to game by date + opponent
- Return `clickUrl` as the `tickets` link

### Step 3: Update route loaders (~10 min)

- `app/routes/$league.$teamAbbrev_.tsx` — `await` the now-async `getAffiliateLinks()`
- `app/routes/$league.$teamAbbrev.$gameSlug.tsx` — Same, pass game for specific matching

### Step 4: UI/copy verification (~10 min)

- Verify affiliate button copy works for TicketNetwork context
- Ensure Mixpanel tracking fires on click
- Test with real links in dev

### Step 5: Environment setup (~5 min)

- Add all four CJ env vars to production environment: `CJ_ACCESS_TOKEN`, `CJ_COMPANY_ID`, `CJ_WEBSITE_PID`, `CJ_TICKETNETWORK_PARTNER_ID`
- Verify `.env.local` is in `.gitignore`

**Total estimated time:** ~1 hour

## Caching strategy

- **Storage:** JSON file on disk (e.g., `data/cache/cj-{teamSlug}.json`)
- **TTL:** 7 days — schedules are stable week-to-week, and even if a price changes, the link still works
- **Key:** Team full name slug
- **Structure:** `{ cachedAt: ISO string, products: CJProduct[] }`
- **Invalidation:** On read, check if `cachedAt` is older than 7 days; if so, re-fetch
- **Survives:** Server restarts, deploys — unlike in-memory caching which resets every time

## Edge cases

1. **NFL offseason / TBD dates:** Events exist with placeholder dates (all in Aug 2026). Titles contain "(Date: TBD)". We can still show ticket links — users land on the TicketNetwork event page which has current info.

2. **Same opponent twice:** A team may play the same opponent multiple times (e.g., division rivals). Match by date + opponent name together for uniqueness.

3. **CJ API down:** Return empty/undefined affiliate links. Never break the page. Log server-side.

4. **Rate limiting:** 500 calls per 5 minutes. With 7-day file caching per team, we'd only re-fetch a team's events once a week. Well under any reasonable limit.

5. **Missing teams:** If a team has no TicketNetwork events (unlikely but possible), `resultList` will be empty. No ticket link shown.

6. **NHL/MLS:** TicketNetwork has NHL events (confirmed with Vancouver Canucks). MLS untested but likely available. Can extend later — the same implementation works for any league.
