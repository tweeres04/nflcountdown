# Adding a New League - Implementation Guide

## Overview

This guide documents the complete process for adding a new sports league to Team Countdown, based on the NHL implementation. Use this as a checklist when adding leagues like MLS, EPL, PWHL, WNBA, or NWSL.

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
| `public/{league}-hero.png` | Hero image for league page (optional) |

---

## Files to Modify

| File | Changes |
|------|---------|
| `app/lib/types.ts` | Add API interfaces (`{League}TeamApi`, `{League}GameApi`, `{League}ScheduleApi`) |
| `app/lib/getAllGames.ts` | Add league case for game loading |
| `app/lib/getTeamAndGames.ts` | Add league case for team/game extraction |
| `app/routes/$league._index.tsx` | Add league validation, schedule file, teams extraction |
| `app/routes/$league.$teamAbbrev.manifest.ts` | Add manifest support for PWA icons |
| `app/routes/_index.tsx` | Add league to homepage picker |
| `app/routes/sitemap[.]xml.ts` | Add league to sitemap generation |
| `app/root.tsx` | Add legacy redirects (if migrating from old domain) |
| `app/components/ui/teams-dropdown.tsx` | Add league to "More leagues" dropdown |
| `app/components/countdown.tsx` | Add league-specific text (e.g., soccer uses "play next" without "the") |
| `app/components/footer.tsx` | Add league to trademark disclaimer (if publicly launching) |
| `tailwind.config.ts` | Add team colors to Tailwind safelist |
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
- `color_1` / `color_2` (MLB, NBA, NHL, WNBA, CPL)
- `primaryColor` / `secondaryColor` (MLS)

If using a different format, update `tailwind.config.ts` accordingly to map to `DEFAULT` and `secondary`.

**Critical:** All hex color values MUST include the `#` prefix:
- ✅ Correct: `"#9d2235"`
- ❌ Wrong: `"9d2235"` (produces invalid CSS like `--tw-gradient-from: 9d2235`)

**Important:** Avoid `#FFFFFF` for `color_2` or `secondaryColor` - use a darker shade or official alternate color instead. Check teamcolorcodes.com for official alternatives.

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

**SVG logos:**
```bash
mkdir -p public/logos/{league}
curl -sL "https://example.com/logos/TEAM.svg" > public/logos/{league}/team.svg
```

**Convert to PNG (for PWA manifests):**
```bash
for svg in public/logos/{league}/*.svg; do
  png="${svg%.svg}.png"
  magick -background none -resize 512x512 "$svg" "$png"
done
```

**Important:** Use logo variants designed for dark backgrounds (white/light colored logos).

---

### 6. Update Route Files

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

**`app/routes/$league._index.tsx`** - Add league validation and schedule loading

**`app/routes/$league.$teamAbbrev.manifest.ts`** - Add manifest support

**`app/routes/_index.tsx`** - Add to homepage:
```typescript
const leagues = [
  // ... existing leagues
  { code: '{league}', name: 'LEAGUE', fullName: 'Full League Name' },
]
```

**`app/routes/sitemap[.]xml.ts`** - Add to sitemap generation

---

### 7. Update Tailwind Config

In `tailwind.config.ts`:

```typescript
import {league}Colors from './{league}_colors.json'

const {league}Colors_ = {league}Colors.reduce(
  (result, c) => ({
    ...result,
    ['{league}-' + c.abbreviation.toLowerCase()]: {
      DEFAULT: c.color_1,
      secondary: c.color_2,
    },
  }),
  {}
)

colors = {
  ...colors,
  ...{league}Colors_,
}
```

---

### 8. Add Legacy Redirects (if needed)

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
```

---

## Checklist

- [ ] `{league}_colors.json` created (no white secondary colors!)
- [ ] TypeScript interfaces added to `app/lib/types.ts`
- [ ] `app/lib/{league}GameToGame.ts` created
- [ ] `cron/get{League}Schedule.ts` created
- [ ] `cron/package.json` updated with script
- [ ] `data/{league}_schedule.json` generated
- [ ] SVG logos downloaded to `public/logos/{league}/`
- [ ] PNG logos generated for PWA manifests
- [ ] `app/lib/getAllGames.ts` updated
- [ ] `app/lib/getTeamAndGames.ts` updated
- [ ] `app/routes/$league._index.tsx` updated
- [ ] `app/routes/$league.$teamAbbrev.manifest.ts` updated
- [ ] `app/routes/_index.tsx` updated (homepage)
- [ ] `app/routes/sitemap[.]xml.ts` updated
- [ ] `app/root.tsx` updated (legacy redirects if needed)
- [ ] `app/components/ui/teams-dropdown.tsx` updated
- [ ] `app/components/countdown.tsx` updated (league-specific text if needed)
- [ ] `app/components/footer.tsx` updated (add league to disclaimer if publicly launching)
- [ ] `tailwind.config.ts` updated
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
- API: Likely ESPN or official NWSL API
- Consider handling different season structure (March-October)
- ~14 teams

### EPL (English Premier League)
- API: football-data.org or similar
- Handle timezone differences (UK times)
- 20 teams
- Season runs August-May

### PWHL (Professional Women's Hockey League)
- New league (2024), may have limited API options
- 6 teams currently
- Similar structure to NHL

### WNBA
- API: Similar structure to NBA (likely same API provider)
- 12 teams
- Season runs May-September

---

## Common Pitfalls

1. **White Secondary Colors** - Always check for `#FFFFFF` in secondary colors and replace with darker alternatives from teamcolorcodes.com
2. **Missing `#` in hex colors** - Colors must be `"#123456"` not `"123456"` for valid CSS gradients
3. **Logo Variants** - Use logos designed for dark backgrounds (typically `_dark` or `_light` variants)
4. **Logo URL exceptions** - Some teams may use different abbreviations in logo URLs (e.g., NY Red Bulls uses `RBNY` in URL but `NY` as team abbreviation)
5. **PNG Generation** - PWA manifests require PNG versions, not just SVG
6. **Navigation dropdowns** - Don't forget to add the league to `teams-dropdown.tsx` for the "More leagues" menu
7. **Footer disclaimer** - Add the league to `footer.tsx` trademark disclaimer when publicly launching (keep in "stealth mode" until launch if desired)
8. **Soccer countdown text** - Soccer leagues typically omit "the" before team names ("till Seattle play next" not "till the Seattle play next")
9. **Timezone Handling** - Ensure game times are in UTC or properly converted
10. **API Rate Limiting** - Add delays between requests when fetching large datasets
11. **Team ID Uniqueness** - Ensure team IDs are unique when using `uniqBy`

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
