# NHL Implementation Plan

✅ **IMPLEMENTATION COMPLETE** - NHL support has been fully added to the countdown app.

This document outlines the plan for adding NHL support to the countdown app.

## Overview

- **API:** Official NHL API at `https://api-web.nhle.com` (requires follow redirects)
- **Logo Source:** `https://assets.nhle.com/logos/nhl/svg/{TEAM}_light.svg`
- **Featured Team:** Florida Panthers (FLA) - 2024 Stanley Cup Champions
- **Total Teams:** 32

## All NHL Teams

| Abbrev | Team Name |
|--------|-----------|
| ANA | Anaheim Ducks |
| BOS | Boston Bruins |
| BUF | Buffalo Sabres |
| CAR | Carolina Hurricanes |
| CBJ | Columbus Blue Jackets |
| CGY | Calgary Flames |
| CHI | Chicago Blackhawks |
| COL | Colorado Avalanche |
| DAL | Dallas Stars |
| DET | Detroit Red Wings |
| EDM | Edmonton Oilers |
| FLA | Florida Panthers |
| LAK | Los Angeles Kings |
| MIN | Minnesota Wild |
| MTL | Montreal Canadiens |
| NJD | New Jersey Devils |
| NSH | Nashville Predators |
| NYI | New York Islanders |
| NYR | New York Rangers |
| OTT | Ottawa Senators |
| PHI | Philadelphia Flyers |
| PIT | Pittsburgh Penguins |
| SEA | Seattle Kraken |
| SJS | San Jose Sharks |
| STL | St. Louis Blues |
| TBL | Tampa Bay Lightning |
| TOR | Toronto Maple Leafs |
| UTA | Utah Hockey Club |
| VAN | Vancouver Canucks |
| VGK | Vegas Golden Knights |
| WPG | Winnipeg Jets |
| WSH | Washington Capitals |

## Files to Create

| File | Description | Status |
|------|-------------|--------|
| `nhl_colors.json` | Team colors for all 32 NHL teams | ✅ Complete |
| `app/lib/nhlGameToGame.ts` | Type transformations for NHL API data | ✅ Complete |
| `cron/getNhlSchedule.ts` | Schedule fetching script | ✅ Complete |
| `data/nhl_schedule.json` | Generated schedule data (1241 games) | ✅ Complete |
| `public/logos/nhl/*.svg` | 32 team logo files | ✅ Complete |

## Files to Modify

| File | Changes | Status |
|------|---------|--------|
| `app/lib/types.ts` | Add `NhlTeamApi`, `NhlGameApi`, `NhlScheduleApi` interfaces | ✅ Complete |
| `app/lib/getTeamAndGames.ts` | Add NHL case to league validation and data loading | ✅ Complete |
| `app/lib/getAllGames.ts` | Add NHL case for game loading | ✅ Complete |
| `app/routes/$league._index.tsx` | Add NHL to validation, hero image, footer attribution | ✅ Complete |
| `app/routes/$league.$teamAbbrev.manifest.ts` | Add NHL manifest support | ✅ Complete |
| `app/routes/_index.tsx` | Add NHL to homepage league list | ✅ Complete |
| `app/root.tsx` | Add NHL redirect handling for old `nhlcountdown.tweeres.com` URLs | ✅ Complete |
| `tailwind.config.ts` | Add NHL colors to Tailwind safelist | ✅ Complete |
| `cron/package.json` | Add `get-nhl-schedule` script | ✅ Complete |
| `cron/crontab` | Add NHL cron entry | ✅ Complete |
| `cron/Dockerfile` | Copy NHL files into container | ✅ Complete |

## Implementation Steps

### 1. Create `nhl_colors.json`

Create team colors file at project root with format:

```json
[
  {
    "team": "Florida Panthers",
    "abbreviation": "FLA",
    "color_1": "#041E42",
    "color_2": "#C8102E"
  }
]
```

### 2. Update `app/lib/types.ts`

Add NHL API interfaces:

```typescript
export interface NhlTeamApi {
  id: number
  commonName: { default: string }
  placeName: { default: string }
  abbrev: string
}

export interface NhlGameApi {
  id: number
  gameDate: string
  startTimeUTC: string
  gameType: number  // 1=preseason, 2=regular, 3=playoffs
  gameState: string
  homeTeam: NhlTeamApi & { score?: number }
  awayTeam: NhlTeamApi & { score?: number }
}

export interface NhlScheduleApi {
  games: NhlGameApi[]
}
```

### 3. Create `app/lib/nhlGameToGame.ts`

Transformation functions following the pattern of other leagues:

```typescript
import nhlColors from '../../nhl_colors.json'
import { Team, Game, NhlTeamApi, NhlGameApi } from './types'

export function nhlTeamToTeam(nhlTeam: NhlTeamApi): Team {
  const color = nhlColors.find(
    (c) => c.abbreviation === nhlTeam.abbrev
  )
  
  return {
    id: nhlTeam.id,
    nickName: nhlTeam.commonName.default,
    fullName: `${nhlTeam.placeName.default} ${nhlTeam.commonName.default}`,
    abbreviation: nhlTeam.abbrev,
    primaryColor: color?.color_1 || '#000',
    secondaryColor: color?.color_2 || '#fff',
  }
}

export function nhlGameToGame(nhlGame: NhlGameApi): Game {
  return {
    id: String(nhlGame.id),
    time: nhlGame.startTimeUTC,
    homeTeam: nhlTeamToTeam(nhlGame.homeTeam),
    awayTeam: nhlTeamToTeam(nhlGame.awayTeam),
    startTimeTbd: false,
  }
}
```

### 4. Create `cron/getNhlSchedule.ts`

Schedule fetching script that:
- Fetches schedule from NHL API
- Filters out preseason games (`gameType !== 1`)
- Saves to `data/nhl_schedule.json`
- Follows pattern of `getNbaSchedule.ts` (simpler, no Puppeteer)

API endpoint: `https://api-web.nhle.com/v1/club-schedule-season/{team}/now`

### 5. Update `cron/package.json`

Add script:

```json
"get-nhl-schedule": "tsx getNhlSchedule.ts"
```

### 6. Run Schedule Fetcher

Generate initial `data/nhl_schedule.json` by running:

```bash
cd cron && npm run get-nhl-schedule
```

### 7. Download Logos

Download all 32 team SVGs from NHL assets:

```bash
mkdir -p public/logos/nhl
curl -sL "https://assets.nhle.com/logos/nhl/svg/FLA_light.svg" > public/logos/nhl/fla.svg
# ... repeat for all teams
```

### 8. Update `app/lib/getTeamAndGames.ts`

- Add `'NHL'` to league validation array (line 16)
- Add NHL schedule loading case
- Add NHL teams/games transformation using `nhlTeamToTeam` and `nhlGameToGame`

### 9. Update `app/routes/$league._index.tsx`

- Add `'NHL'` to league validation (line 54)
- Add NHL schedule file path case (lines 58-63)
- Add NHL teams extraction logic (lines 68-83)
- Update hero image reference (lines 114-127)
- Add hockey icon attribution in footer (lines 147-168)

### 10. Update `cron/crontab`

Add entry:

```
0 3 * * * cd /app && npm run get-nhl-schedule > /proc/1/fd/1 2> /proc/1/fd/2
```

### 11. Update `cron/Dockerfile`

Add lines:

```dockerfile
COPY ./nhl_colors.json /
COPY ./cron/getNhlSchedule.ts .
```

### 12. Test

- Run `npm run dev`
- Visit `/nhl` - should show team picker
- Visit `/nhl/fla` - should show Florida Panthers countdown
- Test a few other teams

### 13. Add NHL Legacy Redirects to `app/root.tsx`

The old NHL Countdown site at `nhlcountdown.tweeres.com` uses a different URL pattern that needs to be redirected.

- Add `nhlSlugToAbbrev` mapping constant (see Legacy URL Redirects section below)
- Add special case handling for `nhlcountdown.tweeres.com` hostname
- Handle both `/{slug}` and `/{slug}/countdown` patterns → redirect to `/nhl/{abbrev}`
- Add `'nhl'` to the existing league list for the standard redirect pattern

### 14. Run Typecheck

```bash
npm run typecheck
```

## Legacy URL Redirects

The old NHL Countdown site at `nhlcountdown.tweeres.com` uses a different URL pattern than the other leagues.

### Old URL Patterns

- `https://nhlcountdown.tweeres.com/{team-slug}` → Landing page
- `https://nhlcountdown.tweeres.com/{team-slug}/countdown` → Countdown page

Both should redirect to: `https://teamcountdown.com/nhl/{abbrev}`

### Slug to Abbreviation Mapping

The old site uses `teamName` run through `kebabCase` (formerly `paramCase`) from the `change-case` npm package.

Verified mapping (generated using `change-case` library):

| Old Slug | New Abbrev | Team |
|----------|------------|------|
| `devils` | `njd` | New Jersey Devils |
| `islanders` | `nyi` | New York Islanders |
| `rangers` | `nyr` | New York Rangers |
| `flyers` | `phi` | Philadelphia Flyers |
| `penguins` | `pit` | Pittsburgh Penguins |
| `bruins` | `bos` | Boston Bruins |
| `sabres` | `buf` | Buffalo Sabres |
| `canadiens` | `mtl` | Montreal Canadiens |
| `senators` | `ott` | Ottawa Senators |
| `maple-leafs` | `tor` | Toronto Maple Leafs |
| `hurricanes` | `car` | Carolina Hurricanes |
| `panthers` | `fla` | Florida Panthers |
| `lightning` | `tbl` | Tampa Bay Lightning |
| `capitals` | `wsh` | Washington Capitals |
| `blackhawks` | `chi` | Chicago Blackhawks |
| `red-wings` | `det` | Detroit Red Wings |
| `predators` | `nsh` | Nashville Predators |
| `blues` | `stl` | St. Louis Blues |
| `flames` | `cgy` | Calgary Flames |
| `avalanche` | `col` | Colorado Avalanche |
| `oilers` | `edm` | Edmonton Oilers |
| `canucks` | `van` | Vancouver Canucks |
| `ducks` | `ana` | Anaheim Ducks |
| `stars` | `dal` | Dallas Stars |
| `kings` | `lak` | Los Angeles Kings |
| `sharks` | `sjs` | San Jose Sharks |
| `blue-jackets` | `cbj` | Columbus Blue Jackets |
| `wild` | `min` | Minnesota Wild |
| `jets` | `wpg` | Winnipeg Jets |
| `coyotes` | `uta` | Arizona Coyotes (now Utah) |
| `golden-knights` | `vgk` | Vegas Golden Knights |
| `kraken` | `sea` | Seattle Kraken |

### Implementation Code for `app/root.tsx`

Add this mapping constant at the top of the file:

```typescript
// NHL slug to abbreviation mapping for legacy nhlcountdown.tweeres.com redirects
const nhlSlugToAbbrev: Record<string, string> = {
	'devils': 'njd',
	'islanders': 'nyi',
	'rangers': 'nyr',
	'flyers': 'phi',
	'penguins': 'pit',
	'bruins': 'bos',
	'sabres': 'buf',
	'canadiens': 'mtl',
	'senators': 'ott',
	'maple-leafs': 'tor',
	'hurricanes': 'car',
	'panthers': 'fla',
	'lightning': 'tbl',
	'capitals': 'wsh',
	'blackhawks': 'chi',
	'red-wings': 'det',
	'predators': 'nsh',
	'blues': 'stl',
	'flames': 'cgy',
	'avalanche': 'col',
	'oilers': 'edm',
	'canucks': 'van',
	'ducks': 'ana',
	'stars': 'dal',
	'kings': 'lak',
	'sharks': 'sjs',
	'blue-jackets': 'cbj',
	'wild': 'min',
	'jets': 'wpg',
	'coyotes': 'uta', // Arizona Coyotes moved to Utah in 2024
	'golden-knights': 'vgk',
	'kraken': 'sea',
}
```

Add this redirect handling in the `loader` function (before the existing `oldDomainMatch` handling):

```typescript
// Handle old nhlcountdown.tweeres.com redirects (different URL structure)
if (url.hostname === 'nhlcountdown.tweeres.com') {
	const pathParts = url.pathname.split('/').filter(Boolean)
	const teamSlug = pathParts[0]

	console.log(
		`NHL legacy redirect: ${url.hostname}${url.pathname} -> slug: ${teamSlug}`
	)

	// Handle /{slug} and /{slug}/countdown patterns
	if (teamSlug && nhlSlugToAbbrev[teamSlug]) {
		const abbrev = nhlSlugToAbbrev[teamSlug]
		const newUrl = `https://teamcountdown.com/nhl/${abbrev}`
		console.log(`Redirecting to: ${newUrl}`)
		return Response.redirect(newUrl, 308)
	}

	// No valid team slug, redirect to NHL index
	const newUrl = 'https://teamcountdown.com/nhl'
	console.log(`Redirecting to NHL index: ${newUrl}`)
	return Response.redirect(newUrl, 308)
}
```

Also update the existing league list to include NHL:

```typescript
// Handle supported leagues (NFL, NBA, MLB, NHL)
if (['nfl', 'nba', 'mlb', 'nhl'].includes(league) && teamAbbrev) {
```

and:

```typescript
// If no team abbreviation, redirect to league index
if (['nfl', 'nba', 'mlb', 'nhl'].includes(league)) {
```

## API Reference

### Get Team Schedule (Current Season)

```
GET https://api-web.nhle.com/v1/club-schedule-season/{team}/now
```

Returns full season schedule for a team including:
- `games[]` - Array of game objects
- Each game has `id`, `gameDate`, `startTimeUTC`, `gameType`, `homeTeam`, `awayTeam`

### Get Standings (for team list)

```
GET https://api-web.nhle.com/v1/standings/now
```

Returns all teams with:
- `teamAbbrev.default` - Team abbreviation
- `teamName.default` - Full team name
- `teamLogo` - Logo URL

## Notes

- NHL API requires following redirects (`-L` flag in curl, or equivalent in fetch)
- Season format is `YYYYYYYY` (e.g., `20252026` for 2025-2026 season)
- `gameType`: 1 = preseason, 2 = regular season, 3 = playoffs
- Filter out preseason games when displaying schedule
- Utah Hockey Club (UTA) replaced Arizona Coyotes in 2024
