# Adding a New League - Implementation Guide

## Overview

This guide documents the complete process for adding a new sports league to Team Countdown, based on the NHL implementation. Use this as a checklist when adding leagues like EPL, PWHL, or NWSL.

---

## Prerequisites

Before starting, gather:
1. **API Source** - Find an official or reliable API for schedule data
2. **Team Colors** - Hex codes for primary and secondary colors (avoid white `#FFFFFF` for secondary)
3. **Team Logos** - SVG preferred, need PNG versions for PWA manifests
4. **Team List** - All teams with abbreviations, full names, nicknames

---

## Files to Create

| File | Description |
|------|-------------|
| `{league}_colors.json` | Team colors (at project root) |
| `app/lib/{league}GameToGame.ts` | API data transformation functions |
| `cron/get{League}Schedule.ts` | Schedule fetching script |
| `data/{league}_schedule.json` | Generated schedule data |
| `public/logos/{league}/*.svg` | Team logo SVGs |
| `public/logos/{league}/*.png` | Team logo PNGs (for PWA manifest) |
| `public/logos/{league}.svg` | League-level logo (for homepage picker and fallback favicon) |
| `public/logos/{league}.png` | League-level logo PNG version |
| `public/{league}-hero.png` | Hero image for league page (optional) |

---

## Files to Modify

| File | Changes |
|------|---------|
| `app/lib/types.ts` | Add API interfaces (`{League}TeamApi`, `{League}GameApi`, `{League}ScheduleApi`) — or type aliases if the API format matches an existing league |
| `app/lib/getAllGames.ts` | Add league case for game loading |
| `app/lib/getTeamAndGames.ts` | Add league case for team/game extraction |
| `app/routes/$league._index.tsx` | Add league to validation array, schedule file mapping, `LEAGUE_META` record (with `teamCount`, `seasonLength`, `seasonMonths`), and hero image alt/caption text |
| `app/routes/$league.$teamAbbrev.manifest.ts` | Add manifest support for PWA icons |
| `app/routes/_index.tsx` | Add league to homepage picker |
| `app/routes/sitemap[.]xml.ts` | Add league to sitemap generation |
| `app/lib/getSeasonStartDate.ts` | Add calculated season start date fallback rule for the league |
| `app/lib/schema-helpers.ts` | Add league to `getSportName`, `getLeagueFullName`, `getLeagueSameAs`, and `generateWebSiteSchema` |
| `app/lib/cj-service.ts` | Add league to `LEAGUE_CATEGORY` if TicketNetwork has listings for it. If omitted, the service falls back to unfiltered results which may still return valid tickets. |
| `data/ticketmaster-attractions.json` | Add Ticketmaster attractionIds for every team in the league (see Step 6b) |
| `app/root.tsx` | Add legacy redirects (if migrating from old domain) |
| `app/components/ui/teams-dropdown.tsx` | Add league to "More leagues" dropdown |
| `app/components/countdown.tsx` | Add league-specific text (e.g., soccer uses "play next" without "the") |
| `app/components/footer.tsx` | Add league to trademark disclaimer (if publicly launching) |
| `cron/package.json` | Add schedule fetch script |
| `cron/crontab` | Add cron entry for schedule updates |
| `cron/Dockerfile` | Copy new files into container |

---

## Step-by-Step Implementation

### 1. Create Team Colors File

Create `{league}_colors.json` at project root:

```json
[
  {
    "team": "Team Full Name",
    "abbreviation": "ABC",
    "color_1": "#123456",
    "color_2": "#789ABC"
  }
]
```

**Note:** Color file format can vary. Common patterns:
- `color_1` / `color_2` (MLB, NBA, NHL, WNBA, CPL, NWSL)
- `primaryColor` / `secondaryColor` (MLS)

If using a different format, update the `{league}TeamToTeam` function in `app/lib/{league}GameToGame.ts` to map the fields to `primaryColor` and `secondaryColor` on the `Team` type.

**Critical:** All hex color values MUST include the `#` prefix:
- ✅ Correct: `"#9d2235"`
- ❌ Wrong: `"9d2235"` (produces invalid CSS like `--tw-gradient-from: 9d2235`)

**Important:** Avoid `#FFFFFF` for `color_2` or `secondaryColor` - use a darker shade or official alternate color instead. Check teamcolorcodes.com for official alternatives. Also avoid pure `#000000` for `color_1` — it produces invisible text on the dark countdown background.

---

### 2. Add TypeScript Interfaces

In `app/lib/types.ts`, add interfaces matching the API response:

```typescript
export interface {League}TeamApi {
  id: number
  // ... fields from API
}

export interface {League}GameApi {
  id: number
  // ... fields from API
}

export interface {League}ScheduleApi {
  games: {League}GameApi[]
}
```

**Tip:** If the new league uses the same API format as an existing league (e.g., NWSL reuses the MLS/ESPN format), use type aliases instead of duplicating interfaces:

```typescript
export type {League}TeamApi = MlsTeamApi
export type {League}EventApi = MlsEventApi
export type {League}ScheduleApi = MlsScheduleApi
```

---

### 3. Create Transformation Functions

Create `app/lib/{league}GameToGame.ts`:

```typescript
import {league}Colors from '../../{league}_colors.json'
import { Team, Game, {League}TeamApi, {League}GameApi } from './types'

export function {league}TeamToTeam(apiTeam: {League}TeamApi): Team {
  const color = {league}Colors.find(
    (c) => c.abbreviation === apiTeam.abbrev
  )
  
  return {
    id: apiTeam.id,
    nickName: apiTeam.name,
    fullName: `${apiTeam.location} ${apiTeam.name}`,
    abbreviation: apiTeam.abbrev,
    primaryColor: color?.color_1 || '#000',
    secondaryColor: color?.color_2 || '#333',
  }
}

export function {league}GameToGame(apiGame: {League}GameApi): Game {
  return {
    id: String(apiGame.id),
    time: apiGame.startTime,
    homeTeam: {league}TeamToTeam(apiGame.homeTeam),
    awayTeam: {league}TeamToTeam(apiGame.awayTeam),
    startTimeTbd: false,
  }
}
```

---

### 4. Create Schedule Fetcher

Create `cron/get{League}Schedule.ts`:

```typescript
import { writeFile } from 'node:fs/promises'

async function main() {
  // Fetch from API
  const response = await fetch('https://api.example.com/schedule')
  const data = await response.json()
  
  // Transform and save
  await writeFile(
    '../data/{league}_schedule.json',
    JSON.stringify(data, null, 2)
  )
  
  console.log(`Saved ${data.games.length} games`)
}

main()
```

Add to `cron/package.json`:
```json
"get-{league}-schedule": "tsx get{League}Schedule.ts"
```

---

### 5. Download Team Logos

**Critical: filenames must be lowercase.** The app constructs logo paths using `team.abbreviation.toLowerCase()`, so a team with abbreviation `SEA` must have logos named `sea.png` and `sea.svg` — not `SEA.png`.

**Both `.svg` and `.png` are required for every team:**
- `.svg` — used on the league index page and countdown page
- `.png` — used for PWA manifests

**Always check the source dimensions before resizing.** Logos are rarely square — shields tend to be portrait, wordmarks landscape. Using a plain `-resize 512x512` will squish non-square logos. Always check first and preserve the aspect ratio:

```bash
# Check dimensions of source files
magick identify public/logos/{league}/sea.svg  # SVG
magick identify public/logos/{league}/van.png  # PNG/WebP

# Correct approach: fit within 512x512, pad the shorter dimension with transparency
magick -density 300 -background none input.svg -resize 512x512 -gravity center -extent 512x512 output.png
magick input.png -resize 512x512 -background none -gravity center -extent 512x512 output.png
```

**If SVGs are available from an official CDN** (preferred):
```bash
mkdir -p public/logos/{league}
curl -sL "https://example.com/logos/team.svg" > public/logos/{league}/team.svg
# Then generate PNGs from the SVGs (preserving aspect ratio):
for svg in public/logos/{league}/*.svg; do
  png="${svg%.svg}.png"
  magick -density 300 -background none "$svg" -resize 512x512 -gravity center -extent 512x512 "$png"
done
```

**If only raster images are available** (PNG or WebP — e.g., ESPN CDN):
```bash
mkdir -p public/logos/{league}
# Download images (use lowercase filenames!)
curl -sL "https://a.espncdn.com/i/teamlogos/soccer/500/{TEAM_ID}.png" > "public/logos/{league}/{abbr}.png"

# Optionally convert to WebP for smaller file sizes (preserve aspect ratio!):
magick input.png -resize 500x500 -background none -gravity center -extent 500x500 output.webp

# Create SVG wrappers with the image embedded as base64 (one per team).
# IMPORTANT: Do NOT use an external href like href="/logos/..." — browsers block
# external resource loads when an SVG is rendered via <img src="...">, so the
# logo will appear empty. Embed as a data URI instead. Works with both PNG and WebP.
for img in public/logos/{league}/*.png; do  # or *.webp
  abbr="${img%.*}"; abbr="${abbr##*/}"
  mime="image/png"  # or image/webp
  b64=$(base64 -i "$img")
  printf '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">\n  <image href="data:%s;base64,%s" width="500" height="500"/>\n</svg>\n' "$mime" "$b64" > "public/logos/{league}/${abbr}.svg"
done
```

**Finding logo URLs on JS-rendered pages** (e.g., NWSL, MLS official sites): The initial HTML won't contain image URLs since they're injected by JavaScript. Use the agent-browser tool to get the fully rendered page and extract URLs:
```bash
agent-browser open https://example.com/teams
agent-browser wait --load networkidle
agent-browser eval "JSON.stringify([...document.querySelectorAll('img')].map(i => i.src).filter(s => s.includes('teams')))"
```

**Cropping SVG viewBox** to remove unwanted elements (e.g., stars, wordmarks): Identify the y-coordinate where the desired content starts, then update the `viewBox` attribute. For a 308-unit tall SVG where content starts at y=71:
```svg
<svg viewBox="0 71 169.51 237.24" ...>  <!-- 237.24 = 308.24 - 71 -->
```

**League-level logos** (used on the homepage and as fallback when no team is selected):
```bash
# Download or create league.svg and league.png
curl -sL "https://example.com/league-logo.svg" > public/logos/{league}.svg
magick -background none -resize 512x512 public/logos/{league}.svg public/logos/{league}.png
```

**Important:** Use logo variants designed for dark backgrounds (white/light colored logos).

---

### 6. Update Route and Library Files

**`app/lib/getAllGames.ts`** - Add case:
```typescript
case 'LEAGUE':
  const raw = await readFile('data/{league}_schedule.json', 'utf-8')
  const schedule: {League}ScheduleApi = JSON.parse(raw)
  return schedule.games.map({league}GameToGame)
```

**`app/lib/getTeamAndGames.ts`** - Add to validation and team extraction:
```typescript
if (!['NFL', 'NBA', 'MLB', 'NHL', 'LEAGUE'].includes(LEAGUE)) {
  throw new Response(null, { status: 404 })
}

// Add case for team extraction
else if (LEAGUE === 'LEAGUE') {
  const raw = await readFile('data/{league}_schedule.json', 'utf-8')
  const schedule: {League}ScheduleApi = JSON.parse(raw)
  teams = uniqBy(schedule.games.map((g) => g.homeTeam), 'id').map({league}TeamToTeam)
}
```

**`app/routes/$league._index.tsx`** - Add to validation array, schedule file mapping, and `LEAGUE_META`:
```typescript
// 1. Add to validation array in loader:
if (!['NFL', 'NBA', 'MLB', 'NHL', ..., 'NEWLEAGUE'].includes(LEAGUE)) {
  throw new Response(null, { status: 404 })
}

// 2. Add to schedule file mapping:
: LEAGUE === 'NEWLEAGUE'
? 'data/{league}_schedule.json'

// 3. Add entry to LEAGUE_META record:
NEWLEAGUE: {
  fullName: 'Full League Name',
  shortName: 'NEWLEAGUE',
  seasonTerm: 'kickoff', // or 'opening day', 'tip-off', 'puck drop'
  titleKeyword: 'NEWLEAGUE Season',
  crossYear: false, // true if season spans two calendar years (e.g. NBA, NHL)
  teamCount: 16,
  seasonLength: '26 games per team',
  seasonMonths: 'March to November',
},

// 4. Add to hero image alt and caption text (two places in the JSX):
: LEAGUE === 'NEWLEAGUE'
? 'Example Team Name'
```

**Note on `crossYear`:** Set to `true` for leagues whose season spans two calendar years (e.g. NBA, NHL). These display as "2025-26 Season"; others display as "2026 Season".

**`app/routes/$league.$teamAbbrev.manifest.ts`** - Add manifest support

**`app/routes/_index.tsx`** - Add to homepage:
```typescript
const leagues = [
  // ... existing leagues
  { code: '{league}', name: 'LEAGUE', fullName: 'Full League Name' },
]
```

**`app/routes/sitemap[.]xml.ts`** - Add to sitemap generation

**`app/lib/getSeasonStartDate.ts`** - Add calculated fallback for offseason:
```typescript
if (LEAGUE === 'NEWLEAGUE') {
  // e.g. Last Saturday of February
  date = lastWeekdayOfMonth(year, 1, isSaturday, nextSaturday)
  date.setUTCHours(18, 0, 0, 0)
  return date
}
```

**`app/lib/schema-helpers.ts`** - Add to all four locations:
```typescript
// getSportName()
case 'NEWLEAGUE': return 'Soccer' // or 'American Football', 'Basketball', etc.

// getLeagueFullName()
case 'NEWLEAGUE': return 'Full League Name'

// getLeagueSameAs()
NEWLEAGUE: 'https://www.example.com',

// generateWebSiteSchema() — add to the `about` array:
{ '@type': 'SportsOrganization', name: 'Full League Name' },
```

---

### 6b. Add Ticketmaster Attraction IDs

Look up each team's Ticketmaster `attractionId` using the Discovery API and add them to `data/ticketmaster-attractions.json`. This enables game-specific ticket links via Ticketmaster (primary ticket provider), with CJ/TicketNetwork as fallback.

```bash
# Look up a team's attractionId
curl -s "https://app.ticketmaster.com/discovery/v2/attractions.json?keyword=Seattle+Seahawks&classificationName=Football&apikey=${TICKET_MASTER_API_KEY}&size=3" | python3 -c "
import sys, json
d = json.load(sys.stdin)
for a in d.get('_embedded', {}).get('attractions', [])[:3]:
    print(f'{a[\"id\"]} - {a[\"name\"]}')
"
```

Add the results to the league's section in `data/ticketmaster-attractions.json`:
```json
{
  "NEWLEAGUE": {
    "Team Full Name": "K8vZ...",
    "Another Team": "K8vZ..."
  }
}
```

**Classification names for the API:** Football, Baseball, Basketball, Hockey, Soccer.

**Tips:**
- Pick the first result that matches the actual team (skip "Training Camp", "Preseason" etc.)
- If a team can't be found by full name, try the nickname only (e.g., "Athletics" instead of "Oakland Athletics")
- Teams with no Ticketmaster coverage get `null` — the system falls back to CJ/TicketNetwork automatically

---

### 7. Add Legacy Redirects (if needed)

If migrating from an old domain, add redirect mapping in `app/root.tsx`:

```typescript
const {league}SlugToAbbrev: Record<string, string> = {
  'old-slug': 'new',
  // ...
}

// Handle old domain redirects
if (url.hostname === '{league}countdown.tweeres.com') {
  // ... redirect logic
}
```

---

### 8. Update Navigation and Footer

**`app/components/ui/teams-dropdown.tsx`** — Add the league to the "More leagues" list (appears in two places in the file — the hover state and the mobile menu).

**`app/components/countdown.tsx`** — Add league-specific text if needed:
- Soccer leagues: add to the "no 'the' prefix" condition (`CPL`, `MLS`, `NWSL`)
- Season term: add to the appropriate season term condition (`kickoff`, `opening day`, `tip-off`, `puck drop`)

**`app/components/footer.tsx`** — Add the league to the trademark disclaimer paragraph when publicly launching.

---

### 9. Update Cron Configuration

**`cron/crontab`:**
```
0 3 * * * cd /app && npm run get-{league}-schedule > /proc/1/fd/1 2> /proc/1/fd/2
```

**`cron/Dockerfile`:**
```dockerfile
COPY ./{league}_colors.json /
COPY ./cron/get{League}Schedule.ts .
```

---

### 10. Generate Initial Data

```bash
cd cron && npm run get-{league}-schedule
```

---

### 11. Verify Implementation

```bash
# Run typecheck
npm run typecheck

# Start dev server
npm run dev

# Test URLs:
# - /{league} - League page
# - /{league}/{team} - Team page
# - /{league}/{team}/manifest.webmanifest - PWA manifest
# - /{league}/season - Redirects to /{league} (season countdown is on the league page)
```

---

## Checklist

- [ ] `{league}_colors.json` created (no white secondary colors, no pure black primary!)
- [ ] TypeScript interfaces (or type aliases) added to `app/lib/types.ts`
- [ ] `app/lib/{league}GameToGame.ts` created
- [ ] `cron/get{League}Schedule.ts` created
- [ ] `cron/package.json` updated with script
- [ ] `data/{league}_schedule.json` generated
- [ ] SVG logos in `public/logos/{league}/` (download or create wrappers around PNGs)
- [ ] PNG logos in `public/logos/{league}/` for PWA manifests
- [ ] All logo filenames are lowercase
- [ ] League-level logos created (`public/logos/{league}.svg` + `.png`)
- [ ] `app/lib/getAllGames.ts` updated
- [ ] `app/lib/getTeamAndGames.ts` updated
- [ ] `app/routes/$league._index.tsx` updated (validation, schedule file, `LEAGUE_META`, hero image text)
- [ ] `app/routes/$league.$teamAbbrev.manifest.ts` updated
- [ ] `app/routes/_index.tsx` updated (homepage)
- [ ] `app/routes/sitemap[.]xml.ts` updated
- [ ] `app/lib/getSeasonStartDate.ts` updated (add calculated fallback rule)
- [ ] `app/lib/schema-helpers.ts` updated (all 4 locations)
- [ ] `app/lib/cj-service.ts` updated (add to `LEAGUE_CATEGORY` if TicketNetwork has listings; omitting falls back to unfiltered which may still return valid results)
- [ ] `data/ticketmaster-attractions.json` updated (add attractionIds for every team in the league)
- [ ] `app/root.tsx` updated (legacy redirects if needed)
- [ ] `app/components/ui/teams-dropdown.tsx` updated
- [ ] `app/components/countdown.tsx` updated (league-specific text if needed)
- [ ] `app/components/footer.tsx` updated (add league to disclaimer if publicly launching)
- [ ] `cron/crontab` updated
- [ ] `cron/Dockerfile` updated
- [ ] Typecheck passes
- [ ] Manual testing completed

---

## League-Specific Notes

### MLS (Major League Soccer)
- **API**: ESPN API (`site.api.espn.com/apis/site/v2/sports/soccer/usa.1/scoreboard`)
- **Logos**: Official MLS CDN at `https://images.mlssoccer.com/image/upload/assets/logos/{ABBR}.svg`
  - Exception: NY Red Bulls uses `RBNY` in URL but `NY` as abbreviation
- **Season**: February - November
- **30 teams** (includes 3 Canadian teams)
- **Countdown text**: No "the" prefix - "till Seattle play next" (like CPL)
- **Color format**: Uses `primaryColor`/`secondaryColor` instead of `color_1`/`color_2`

### NWSL (National Women's Soccer League)
- **API**: ESPN API (`site.api.espn.com/apis/site/v2/sports/soccer/usa.nwsl/scoreboard`) — identical format to MLS
- **Types**: Reuse MLS type aliases (`NwslTeamApi = MlsTeamApi`, etc.)
- **Logos**: Official NWSL CDN SVGs for most teams — `https://images.nwslsoccer.com/image/private/t_q-best/{version}/prd/assets/teams/{team-slug}.svg`. Find version timestamps by loading `nwslsoccer.com/teams/index` with a browser tool (the page is JS-rendered). For teams not yet on the CDN (Boston Legacy FC, Denver Summit FC) or rebranded teams (Gotham FC, Chicago Stars FC), use official team sites or WebP/PNG with base64-embedded SVG wrappers. For Gotham's shield SVG, the raw path data is available in their site's React component source (`LogoWordmark2025.tsx`) — you may want to crop the viewBox to remove the stars at the top.
- **Season**: March - November
- **16 teams** (2026 season includes two new expansion teams: Boston Legacy FC, Denver Summit FC)
- **Countdown text**: No "the" prefix - "till Seattle play next" (same as MLS/CPL)
- **Color format**: Uses `color_1`/`color_2` format
- **Colors**: Source from teamcolorcodes.com — ESPN's colors for some teams are incorrect (e.g., Boston = `#00FF00` placeholder green, Portland = pure black primary)

### EPL (English Premier League)
- API: football-data.org or similar
- Handle timezone differences (UK times)
- 20 teams
- Season runs August-May

### PWHL (Professional Women's Hockey League)
- **API**: HockeyTech (`lscluster.hockeytech.com`) — the same backend that powers `thepwhl.com`. The API key is publicly embedded in the PWHL site's page source (`var appKey = '446521baf8c38984'`). Fetch with `client_code=pwhl&league_id=1`. Filter to the current season using the `SeasonID` field (season 8 = 2025-26).
- **Types**: Completely different format from all other leagues — HockeyTech `Scorebar` objects with `Home*`/`Visitor*` prefixed fields. Cannot reuse any existing types; requires new `PwhlGameApi`/`PwhlScheduleApi` interfaces.
- **`pwhlTeamToTeam`**: Takes individual fields as parameters (not a single team object), since the API embeds team data inline in each game row rather than as a nested object.
- **Logos**: Mixed sources — 4 real vector SVGs from Wikipedia (MTL, NY, OTT, TOR), 4 WebP-embedded SVG wrappers from Wikipedia PNGs (BOS, MIN, SEA, VAN). League-level logo is a real vector SVG (wordmark, 575×122 aspect ratio — regenerate PNG with aspect ratio preserved).
- **Colors**: No teamcolorcodes.com entries. Extract hex values from SVG source files directly; for PNG-only logos use ImageMagick histogram analysis (`-colors 8 -format "%c" histogram:info:`).
- **8 teams** (2025-26 season includes two expansion teams: Seattle Torrent, Vancouver Goldeneyes)
- **Season**: January to April, `crossYear: true` (displays as "2025-26 Season")
- **Season term**: "puck drop" (shared with NHL in `countdown.tsx`)
- **Countdown text**: Uses "the" prefix — "till the Frost play next" (same as NHL)

### WNBA
- **API**: WNBA CDN (`cdn.wnba.com/static/json/staticData/scheduleLeagueV2.json`) — same format as NBA
- **Types**: Reuses NBA type interfaces (`WnbaTeamApi = NbaTeamApi`)
- **13 teams** (2026 season)
- **Season**: May - September

---

## Common Pitfalls

1. **White Secondary Colors** - Always check for `#FFFFFF` in secondary colors and replace with darker alternatives from teamcolorcodes.com
2. **Black Primary Colors** - Avoid `#000000` for `color_1` — it makes team names invisible on the countdown page dark background
3. **Missing `#` in hex colors** - Colors must be `"#123456"` not `"123456"` for valid CSS gradients
4. **Logo Variants** - Use logos designed for dark backgrounds (typically `_dark` or `_light` variants)
5. **Logo URL exceptions** - Some teams may use different abbreviations in logo URLs (e.g., NY Red Bulls uses `RBNY` in URL but `NY` as team abbreviation)
6. **PNG Generation** - PWA manifests require PNG versions, not just SVG
7. **Logo filename casing** - All logo filenames must be **lowercase** (e.g., `sea.svg`, not `SEA.svg`). The app constructs paths using `team.abbreviation.toLowerCase()`, so a casing mismatch causes broken images silently.
8. **SVG required for every team** - The league index page and countdown component load `.svg` files. If the source only provides PNGs (e.g., ESPN CDN), create SVG wrappers with the image embedded as a **base64 data URI** (not an external `href`) — see Step 5. Using an external path like `href="/logos/nwsl/sea.png"` produces an empty image because browsers block external resource loads when SVGs are rendered via `<img src="..."`.
9. **Non-square logos need aspect-ratio-safe resizing** - Most logos are not square (shields are portrait, wordmarks are landscape). Always check source dimensions with `magick identify` first, then use `-resize 512x512 -gravity center -background none -extent 512x512` to fit within the box with transparent padding. Plain `-resize 512x512` will squish the logo.
10. **Logo sizing in countdown** - `countdown.tsx` has two logo sizing modes. Check which fits your league's logo shape:
    - `h-[256px] md:h-[384px] my-8` — height-constrained, width unconstrained (NHL, CPL, MLS, NWSL, PWHL). Use for tall/portrait logos or shields.
    - `w-[256px] h-[256px] md:w-[384px] md:h-[384px]` — fixed square (NFL, NBA, MLB, WNBA). Use for circular or square badges.
    - `py-8 lg:py-16` — extra vertical padding (MLB only). Add this if the logo needs breathing room within the square box.
11. **League-level logos** - Don't forget `public/logos/{league}.svg` and `.png` for the homepage picker
12. **Navigation dropdowns** - Don't forget to add the league to `teams-dropdown.tsx` for the "More leagues" menu
13. **Footer disclaimer** - Add the league to `footer.tsx` trademark disclaimer when publicly launching (keep in "stealth mode" until launch if desired)
14. **Schema helpers** - `app/lib/schema-helpers.ts` has four separate locations to update: `getSportName`, `getLeagueFullName`, `getLeagueSameAs`, and `generateWebSiteSchema`
15. **Soccer countdown text** - Soccer leagues typically omit "the" before team names ("till Seattle play next" not "till the Seattle play next")
16. **Timezone Handling** - Ensure game times are in UTC or properly converted
17. **API Rate Limiting** - Add delays between requests when fetching large datasets
18. **Team ID Uniqueness** - Ensure team IDs are unique when using `uniqBy`
19. **`$league.season.tsx` is a redirect** - This file is now just a 301 redirect to `/{league}`. Do NOT add league data here. Season countdown functionality lives in `$league._index.tsx` via `LEAGUE_META`.
20. **Don't rewrite `types.ts`** - Only append new types to the end of the file. Rewriting the file risks changing field names that existing `GameToGame` files depend on, causing cascading type errors across the whole codebase.
21. **Homepage league ordering** - Place new leagues after their same-sport counterpart (e.g., PWHL after NHL, NWSL after MLS), not just appended to the end.

---

## Implementation References

### NHL Implementation

For a complete hockey league example, see the NHL implementation documented in `docs/NHL_IMPLEMENTATION_PLAN.md`.

Key commits:
- Initial implementation: `860d516`
- Logo fixes: `eca09a7`
- PNG generation: `3b2574e`
- Color fixes: `38d7916`
- Sitemap addition: `d7ce64e`

### MLS Implementation

For a complete soccer league example, see the MLS implementation:

**Key files:**
- Color file: `mls_colors.json` (uses `primaryColor`/`secondaryColor` format)
- Schedule fetcher: `cron/getMlsSchedule.ts`
- Transformation: `app/lib/mlsGameToGame.ts`
- Logos: Downloaded from `https://images.mlssoccer.com/image/upload/assets/logos/{ABBR}.svg`

**Key lessons learned:**
1. **Color format validation** - Always verify hex colors have `#` prefix before committing
2. **White color replacement** - Found 3 teams (LA Galaxy, San Jose, Vancouver) with white colors that needed replacement using official alternatives from teamcolorcodes.com:
   - LA Galaxy: Navy → Gold instead of Navy → White
   - San Jose: Black → Blue instead of Blue → White
   - Vancouver: Deep Sea Blue → Light Blue instead of White → Navy
3. **Logo URL exceptions** - NY Red Bulls uses `RBNY` in logo URL but `NY` as team abbreviation
4. **Soccer-specific text** - Uses "play next" without "the" prefix (in `countdown.tsx`)
5. **Navigation** - Added to both homepage and teams dropdown component
6. **Footer disclaimer** - Added MLS to the trademark disclaimer in `footer.tsx` for public launch

### PWHL Implementation

For a non-ESPN, non-NBA-format example using a third-party API (HockeyTech):

**Key files:**
- Color file: `pwhl_colors.json` (colors extracted via SVG source + ImageMagick histogram)
- Schedule fetcher: `cron/getPwhlSchedule.ts` (HockeyTech API, filter to `SeasonID === '8'`)
- Transformation: `app/lib/pwhlGameToGame.ts` (unique signature — fields passed individually, not as a team object)
- Logos: Mixed Wikipedia SVGs and WebP-embedded wrappers

**Key lessons learned:**
1. **Brand-new API format** — HockeyTech is completely different from ESPN/NBA/NHL. Required new types and a custom transformation signature.
2. **Color extraction without teamcolorcodes.com** — Used `magick -colors 8 histogram:info:` to extract dominant colors from PNG logos; extracted hex values directly from SVG `fill` attributes for vector logos.
3. **types.ts discipline** — Only append new types; do not rewrite the file. Rewriting broke field names that existing `GameToGame` files depended on.
4. **HockeyTech API key** — Found by loading `thepwhl.com/schedule` in a browser and checking `var appKey` in the page source. The same provider is used by many pro and junior hockey leagues (OHL, WHL, AHL, etc.) with `client_code` as the differentiator.
