# Enhanced Internal Linking Implementation Plan

**Created:** January 27, 2026  
**Status:** Planning Phase  
**Estimated Effort:** 2-2.5 hours (AI-assisted)

---

## Overview

Add strategic internal links between related pages to improve SEO (PageRank distribution) and UX (user engagement). This is the final high-value pSEO improvement remaining from the original quick wins plan.

---

## Why Internal Linking Matters

### SEO Benefits

**1. PageRank Distribution (Primary Benefit)**
- Internal links pass authority between pages
- External backlinks → spread value across site via internal links
- Well-linked pages rank higher than isolated pages
- Each link hop distributes ~85% of authority (Google's dampening factor)

**2. Improved Crawl Depth**
- Google discovers pages by following links
- More internal links = easier discovery for deep pages
- Alternate discovery paths beyond main navigation
- Faster indexation of new content

**3. Topical Relevance Signals**
- Internal links help Google understand page relationships
- Linking Eagles ↔ Cowboys signals rivalry/connection
- Builds semantic understanding of content

### UX Benefits

**1. Increased Pages Per Session**
- More navigation options = more exploration
- Current: User lands → sees countdown → leaves (1 page)
- Enhanced: User lands → countdown → opponent link → related games (3+ pages)

**2. Better User Discovery**
- Users find related content they didn't know they wanted
- Fantasy players can track multiple teams
- Fans discover interesting matchups

**3. Reduced Bounce Rate**
- More paths to keep users engaged
- Lower bounce rate signals valuable content to Google
- Longer session duration (positive ranking signal)

---

## Current State Analysis

### Link Structure (Limited)

**Existing links:**
- Homepage → League pages (3 links)
- League pages → Team pages via dropdown (92 links)
- Team pages → Game pages (multiple links per team)
- Breadcrumbs → Parent pages (new!)

**Missing links:**
- ❌ Game pages → Opponent team page
- ❌ Game pages → Related games
- ❌ Team pages → Opponent-specific game links

### Problem: Game Pages Are Dead Ends

**Current game page (`/nfl/phi/sep-4-2025-dal`):**
```
Breadcrumb: Home > NFL > Eagles > vs Cowboys Sep 4
Countdown: 47 days...
Game info: Sep 4, 2025 at 8:15 PM
[NO OUTBOUND LINKS - USER JOURNEY ENDS]
```

**Impact:**
- ~8,000 game pages with zero outbound links
- Wasted PageRank (authority stops here instead of flowing)
- High bounce rate (nowhere else to go)
- Missed engagement opportunities

---

## Implementation Plan

### Feature 1: Opponent Links (Team + Game Pages) 🔥 HIGHEST PRIORITY

**What:** Make opponent name clickable, linking to opponent's team page

**Where:** Both team pages AND game pages

**Example - Team Page:**
```
[Eagles team page]

Next game: vs Dallas Cowboys Sep 4    [← "Dallas Cowboys" is clickable]
```

**Example - Game Page:**
```
[Eagles vs Cowboys game page]

Countdown: 47 days, 12 hours, 34 minutes
vs Indiana Pacers    [← "Indiana Pacers" is clickable]
```

**Design Approach:**
- Make the existing opponent name text clickable
- NO additional "View schedule →" text (cleaner UI)
- Subtle underline or hover state to indicate it's a link
- Natural, intuitive interaction

**Implementation:**

#### A. Make Opponent Name Clickable (Game Pages)

**File:** `app/components/countdown.tsx`

**Find the existing opponent display (the "vs Indiana Pacers" text):**

Currently looks something like:
```tsx
<div className="text-sm">
  vs {opposingTeam.fullName}
</div>
```

**Change to make opponent name a link:**
```tsx
<div className="text-sm">
  vs{' '}
  <Link
    to={`/${LEAGUE.toLowerCase()}/${opposingTeam.abbreviation.toLowerCase()}`}
    className="underline decoration-white/50 hover:decoration-white hover:text-white transition-colors"
  >
    {opposingTeam.fullName}
  </Link>
</div>
```

**Styling notes:**
- Subtle underline with 50% opacity (not too bold)
- Full opacity underline on hover (clear affordance)
- Text brightens on hover
- Smooth transition

**Data needed:**
- `opposingTeam` - already calculated in game page component
- `LEAGUE` - already available from context

**Effort:** 10-15 minutes  
**Impact:** Very High - adds ~8,000 new internal links from game pages

---

#### B. Make Opponent Name Clickable (Team Pages)

**File:** `app/components/countdown.tsx`

**Find the "next game" opponent display on team pages:**

Same code location as game pages - the opponent name display

**Apply same link treatment:**
```tsx
<div className="text-sm">
  vs{' '}
  <Link
    to={`/${LEAGUE.toLowerCase()}/${opposingTeam.abbreviation.toLowerCase()}`}
    className="underline decoration-white/50 hover:decoration-white hover:text-white transition-colors"
  >
    {opposingTeam.fullName}
  </Link>
</div>
```

**Effort:** 5-10 minutes (same code, already modified for game pages)  
**Impact:** High - adds ~92 high-value team-to-team links

---

#### C. Consider: Opponent Links in Game List

**File:** `app/components/game-list.tsx`

**Optional enhancement:** Make opponent names clickable in the "All Games" list too

**Current:**
```
All Games:
• vs Cowboys Sep 4
• @ Falcons Sep 15
```

**Enhanced:**
```
All Games:
• vs Cowboys Sep 4    [← "Cowboys" clickable]
• @ Falcons Sep 15    [← "Falcons" clickable]
```

**Pros:**
- ✅ Multiple opportunities to explore opponents
- ✅ Hundreds more internal links (92 teams × 10 games avg = 920+ links)

**Cons:**
- ⚠️ Could compete with game page links (each list item is already a link to the game)
- ⚠️ Might be confusing (click team name vs click whole row?)

**Recommendation:** Start without this, add later if needed

**Effort if added:** 20-30 minutes  
**Impact:** Medium - more links but potentially confusing UX

---

### Feature 2: Related Games Component ⚡ HIGH PRIORITY

**What:** Show 2-3 other games happening in the same week

**Example:**
```
Other games this week:
• Cowboys vs Giants - Sep 5
• Patriots vs Bengals - Sep 7
• 49ers vs Rams - Sep 8
```

**Implementation:**

#### A. Create Related Games Component

**File:** `app/components/related-games.tsx`

```tsx
import { Game } from '~/lib/types'
import { Link } from '@remix-run/react'
import { isSameWeek } from 'date-fns'

interface RelatedGamesProps {
  currentGame: Game
  allGames: Game[]
  league: string
  currentTeamAbbrev: string
}

export default function RelatedGames({
  currentGame,
  allGames,
  league,
  currentTeamAbbrev,
}: RelatedGamesProps) {
  if (!currentGame.time) return null

  const currentGameDate = new Date(currentGame.time)
  const lowercaseLeague = league.toLowerCase()

  // Find games in the same week (excluding current game)
  const relatedGames = allGames
    .filter((g) => {
      if (!g.time || g.id === currentGame.id) return false
      if (!g.homeTeam || !g.awayTeam) return false
      return isSameWeek(new Date(g.time), currentGameDate)
    })
    .slice(0, 3) // Show max 3 games

  if (relatedGames.length === 0) return null

  return (
    <div className="mt-6 p-4 bg-white/10 rounded-lg">
      <h3 className="text-lg font-semibold mb-3">Other games this week</h3>
      <ul className="space-y-2">
        {relatedGames.map((game) => {
          const homeAbbrev = game.homeTeam!.abbreviation.toLowerCase()
          const gameSlug = getGameSlug(game, homeAbbrev)
          
          const gameDate = new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
          }).format(new Date(game.time!))

          return (
            <li key={game.id}>
              <Link
                to={`/${lowercaseLeague}/${homeAbbrev}/${gameSlug}`}
                className="text-white/80 hover:text-white text-sm flex items-center gap-2"
              >
                <span>•</span>
                <span>
                  {game.homeTeam!.fullName} vs {game.awayTeam!.fullName} - {gameDate}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
```

#### B. Integrate into Game Pages

**File:** `app/routes/$league.$teamAbbrev.$gameSlug.tsx`

**Pass all games to Countdown:**
```tsx
<Countdown
  // ... existing props
  relatedGamesData={{ currentGame: game, allGames: games, league: LEAGUE }}
/>
```

**Update Countdown component to render RelatedGames**

**Effort:** 45-60 minutes  
**Impact:** High - better engagement, more cross-linking between games

---

### Feature 3: Opponent Links in Game List ⚡ OPTIONAL

**What:** Make opponent names clickable in the "All Games" list on team pages

**Example:**
```
All Games:
• vs Cowboys Sep 4    [← "Cowboys" clickable]
• @ Falcons Sep 15    [← "Falcons" clickable]
• vs Saints Sep 22    [← "Saints" clickable]
```

**Consideration:** Each game list item is already a link to the game page. Adding a nested link (opponent name) might create confusion about what clicking does.

**Options:**
1. Make opponent name clickable (nested link inside game row)
2. Add subtle icon/button next to opponent name
3. Skip this - opponent link on featured next game is sufficient

**Recommendation:** Start without this feature
- Featured next game already has opponent link
- Avoid UX confusion with nested links
- Can add later if user testing shows demand

**Effort if added:** 20-30 minutes  
**Impact:** Medium - more links but potentially confusing UX

---

## Files to Create/Modify

### Create (1 file)
- `app/components/related-games.tsx` - Component for showing related games

### Modify (3-4 files)
- `app/components/countdown.tsx` - Add opponent link section
- `app/routes/$league.$teamAbbrev.$gameSlug.tsx` - Pass related games data
- `app/components/game-list.tsx` - Add opponent links (optional)
- `app/lib/getGameSlug.ts` - Export for use in related-games component

---

## Implementation Order

**Phase 1: Opponent Links (20-30 min)**
1. Find opponent name display in `countdown.tsx`
2. Make opponent text clickable (wrap in Link component)
3. Add subtle underline styling for link affordance
4. Test on both team pages AND game pages
5. Verify link works and goes to correct opponent team page

**Phase 2: Related Games (45-60 min)**
1. Create `related-games.tsx` component
2. Update game page loader to pass all games
3. Integrate into Countdown component
4. Test related games appear and link correctly

**Phase 3: Upcoming Opponents (30-45 min) - Optional**
1. Update `game-list.tsx` or create new section
2. Add opponent links to team pages
3. Test links work

**Total Time:** 1.5-2 hours (reduced from original estimate due to simpler opponent link approach)

---

## Design Decisions

### Decision: Make Existing Text Clickable vs. Add New Link

**Chosen Approach:** Make existing opponent name text clickable

**Why this is better:**

**Option A: Make "vs Indiana Pacers" clickable** ✅ **SELECTED**
- ✅ Cleaner UI - no additional visual elements
- ✅ Obvious affordance - underline/color change on hover
- ✅ Natural interaction - see opponent, click opponent
- ✅ Less clutter - no redundant "View schedule →" text
- ✅ Mobile-friendly - larger tap target (full opponent name)
- ✅ Follows web conventions - underlined text = link
- ✅ Simpler implementation - just wrap existing text

**Option B: Add separate "View schedule →" link** ❌ **REJECTED**
- ❌ Extra line of text (visual noise)
- ❌ Redundant (opponent name already displayed)
- ❌ Takes mobile screen space
- ❌ More code to maintain

**Examples from the wild:**
- Google search results - team names are direct links
- ESPN schedules - opponent names are clickable
- Standard web pattern - make the thing itself clickable

---

## Design Considerations

### Placement

**Opponent Link:**
- **Recommended:** After game matchup info, before game list
- In white content area (not on colored background)
- Subtle text with arrow icon

**Related Games:**
- **Recommended:** After game list section
- In semi-transparent box (`bg-white/10`)
- Clearly labeled section

### Styling

**Opponent Name Links:**
- Base: Inherit current text color
- Underline: `decoration-white/50` (subtle indication it's a link)
- Hover underline: `decoration-white` (full opacity)
- Hover text: `text-white` (brighter)
- Transition: `transition-colors` (smooth change)

**Example classes:**
```tsx
className="underline decoration-white/50 hover:decoration-white hover:text-white transition-colors"
```

**Alternative (no underline):**
```tsx
className="text-white/90 hover:text-white font-medium transition-colors cursor-pointer"
```

**Related Games:**
- Links: `text-white/80` base color
- Hover: `text-white` (emphasized)
- Typography: `text-sm` for list items
- Section heading: `text-lg` (18px)

### Mobile Considerations

- All links should be tappable (min 44px touch target)
- Related games list should be scrollable if needed
- Keep design compact on small screens

---

## Data Requirements

### For Opponent Links
✅ Already available:
- `opposingTeam` - calculated in game page component
- `LEAGUE` - from context
- `isTeamPage` - from props

### For Related Games
✅ Already available:
- `currentGame` - from loader
- `allGames` - would need to pass from loader (currently available)
- `team` abbreviation - for constructing game URLs

⚠️ Need to import:
- `isSameWeek` from date-fns
- `getGameSlug` function for URL generation

---

## Edge Cases & Handling

### Issue 1: TBD Opponents

**Problem:** Some games might not have opponent data yet

**Solution:**
```tsx
{opposingTeam ? (
  <Link to={opponentUrl}>{opposingTeam.fullName}</Link>
) : (
  <span>{opposingTeam?.fullName ?? 'TBD'}</span>
)}
```

Only make opponent text a link if opponent data exists. Otherwise, show plain text.

---

### Issue 2: No Related Games

**Problem:** First/last week of season might have few games

**Solution:**
```tsx
if (relatedGames.length === 0) return null
```

Only render component if at least 1 related game exists

---

### Issue 3: Opponent Link to Same Team

**Problem:** Linking from Eagles page back to Eagles page

**Solution:** Already handled - opponent is always the OTHER team

---

### Issue 4: Very Long Team Names

**Problem:** "Philadelphia Eagles" in link might wrap awkwardly

**Solution:**
- Use full name (more descriptive)
- Allow natural wrapping
- Team names are already displayed this way, so no change needed

---

### Issue 5: Nested Links in Game List

**Problem:** If we add opponent links to game list items, we'd have nested links (list item links to game, opponent name links to team)

**Solution:** 
- Skip opponent links in game list (Feature 3)
- Only add opponent link to featured "next game" display
- Avoids nested link confusion

---

### Issue 6: Game List Click Behavior

**Problem:** Should clicking "vs Cowboys" in game list go to game page or team page?

**Solution:**
- Row/date clicks → game page (current behavior)
- Just opponent name click → team page (only on featured next game)
- Keep it simple, avoid nested links

---

## Testing Strategy

### Visual Testing
- ✅ Test opponent link on game pages (all 3 leagues)
- ✅ Verify link goes to correct opponent team page
- ✅ Test related games appear with correct links
- ✅ Check on mobile (touch targets, layout)
- ✅ Verify styling matches existing design

### Functional Testing
- ✅ Click opponent link → lands on correct team page
- ✅ Click related game link → lands on correct game page
- ✅ Breadcrumbs work from newly linked pages
- ✅ No broken links or 404s

### TypeScript Verification
- ✅ Run `npm run typecheck`
- ✅ No new type errors

---

## Expected Impact

### SEO Metrics (3-6 months)

**Before:**
- Game pages: 0 outbound internal links
- Pages per session: ~1.5
- Bounce rate: ~60-70%

**After:**
- Game pages: 1-4 outbound internal links each
- Pages per session: ~2.5-3.5 (estimated 50-100% increase)
- Bounce rate: ~40-50% (estimated 15-30% reduction)

**Ranking improvements:**
- Better indexation of all game pages
- Improved rankings for team pages (more internal links pointing to them)
- Better rankings for long-tail game queries

### User Engagement

- ✅ Longer session duration
- ✅ More page views per visit
- ✅ Better content discovery
- ✅ Higher user satisfaction

### Link Graph Stats

**Current:**
- ~8,000 game pages with 0 outbound links

**After Feature 1 (Opponent Links):**
- ~8,000 game pages with 1 outbound link each = **8,000 new internal links**

**After Feature 2 (Related Games):**
- ~8,000 game pages with 1-4 additional links = **16,000-32,000 more internal links**

**Total new links:** 24,000-40,000 internal links added to site!

---

## Implementation Details

### Feature 1: Opponent Link on Game Pages

**Component:** `app/components/countdown.tsx`

**Logic:**
```tsx
const opposingTeam = game?.homeTeam?.abbreviation === team?.abbreviation
  ? game?.awayTeam
  : game?.homeTeam
```

**UI Addition:**
```tsx
{/* Add after game info, before game list */}
{game && !isTeamPage && opposingTeam && (
  <div className="mt-6 text-center">
    <Link
      to={`/${LEAGUE.toLowerCase()}/${opposingTeam.abbreviation.toLowerCase()}`}
      className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm"
    >
      <span>View {opposingTeam.fullName} schedule</span>
      <svg 
        className="w-4 h-4" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M9 5l7 7-7 7" 
        />
      </svg>
    </Link>
  </div>
)}
```

**Placement:** After countdown display, before "All Games" section

---

### Feature 2: Related Games Component

**New Component:** `app/components/related-games.tsx`

**Props Interface:**
```tsx
interface RelatedGamesProps {
  currentGame: Game
  allGames: Game[]
  league: string
  currentTeamAbbrev: string
}
```

**Logic:**
- Find games in same week using `isSameWeek` from date-fns
- Exclude current game from results
- Limit to 3 games (keep it concise)
- Filter out games without full data (homeTeam/awayTeam/time)

**UI:**
```tsx
<div className="mt-6 p-4 bg-white/10 rounded-lg">
  <h3 className="text-lg font-semibold mb-3">Other games this week</h3>
  <ul className="space-y-2">
    {relatedGames.map((game) => (
      <li key={game.id}>
        <Link 
          to={gameUrl}
          className="text-white/80 hover:text-white text-sm flex items-center gap-2 transition-colors"
        >
          <span className="text-white/40">•</span>
          <span>{homeTeam} vs {awayTeam} - {date}</span>
        </Link>
      </li>
    ))}
  </ul>
</div>
```

**Integration:**
- Import in `countdown.tsx`
- Pass required props from game page data
- Render after game list section

**Route update needed:**
- `app/routes/$league.$teamAbbrev.$gameSlug.tsx` already passes `games` array
- No loader changes needed!

---

### Feature 3: Upcoming Opponents on Team Pages (Optional)

**Two Approaches:**

#### Option A: Enhance Existing Game List

**File:** `app/components/game-list.tsx`

**Add to each game item:**
```tsx
<div className="flex justify-between items-center">
  <span>vs {opponent} - {date}</span>
  <Link
    to={`/${league}/${opponentAbbrev}`}
    className="text-xs text-white/50 hover:text-white"
  >
    View schedule →
  </Link>
</div>
```

#### Option B: Create "Upcoming Opponents" Section

**New section on team pages:**
```tsx
<div className="mb-6">
  <h3 className="text-lg mb-2">Upcoming Opponents</h3>
  <div className="flex gap-2 flex-wrap">
    {nextThreeOpponents.map((opponent) => (
      <Link
        to={opponentUrl}
        className="px-3 py-1 bg-white/10 rounded hover:bg-white/20"
      >
        {opponent.fullName}
      </Link>
    ))}
  </div>
</div>
```

**Recommendation:** Option A (enhance existing list) - less intrusive

**Effort:** 30-45 minutes

---

## Alternative Considerations

### Link to Opponent's Game Page (Not Just Team Page)

**Current plan:** Eagles game → Cowboys team page

**Alternative:** Eagles game → Cowboys' version of same game
- Eagles game (`/nfl/phi/sep-4-2025-dal`) → Cowboys game (`/nfl/dal/sep-4-2025-phi`)
- Creates reciprocal links between both perspectives of same game

**Pros:**
- ✅ More specific (links to exact same matchup)
- ✅ Bidirectional game-to-game links
- ✅ User sees same game from opponent's perspective

**Cons:**
- ❌ Less useful for user (both pages show same countdown)
- ❌ More complex URL construction
- ❌ Link between identical content (less value)

**Verdict:** Stick with linking to opponent's team page (more useful)

---

## SEO Research Insights (2026)

From recent SEO research:

**Key Quote:**
> "Internal linking is a PageRank distribution system. Links on pages that receive external backlinks determine how much PageRank reaches your money pages. A link to a poorly-connected page wastes authority."

**Application to your site:**
- Your game pages are currently "poorly-connected" (no outbound links)
- Adding opponent links turns them into "hub pages"
- This multiplies the value of any backlinks you earn

**Best Practices for 2026:**
1. ✅ **Quality over quantity** - Few relevant links better than many random ones
2. ✅ **Contextual linking** - Links should make sense to users
3. ✅ **Descriptive anchor text** - "View Cowboys schedule" better than "Click here"
4. ✅ **Bidirectional when relevant** - Create reciprocal relationships
5. ✅ **Topic clustering** - Link related content together

---

## Measurement & Success Metrics

### Google Analytics / Search Console

**Track these metrics:**

**Before implementation:**
- Pages per session
- Average session duration
- Bounce rate
- Organic traffic to game pages
- Organic traffic to team pages

**After implementation (monitor for 30-60 days):**
- **Expected:** 30-50% increase in pages per session
- **Expected:** 20-40% increase in session duration
- **Expected:** 15-30% decrease in bounce rate
- **Expected:** 5-15% increase in organic traffic (3-6 months)

### Internal Link Analysis

**Tools to use:**
- Screaming Frog SEO Spider (crawl internal link graph)
- Google Search Console (internal links report)
- Analytics (user flow report)

**Metrics:**
- Average internal links per page (before vs after)
- Number of orphaned pages (should decrease)
- Link depth distribution

---

## Risks & Mitigation

### Risk 1: Too Many Links (Link Spam)

**Concern:** Adding too many links could look spammy

**Mitigation:**
- Keep it to 1-4 contextual links per page
- All links are highly relevant (opponent, related games)
- Natural user intent (users want this info)

**Verdict:** Low risk - these are all valuable links

---

### Risk 2: Increased Page Size

**Concern:** More HTML = slower page loads

**Mitigation:**
- Each link is ~100 bytes
- 4 links = 400 bytes (negligible)
- Related games component ~1-2KB total
- No meaningful performance impact

**Verdict:** No real risk

---

### Risk 3: User Confusion

**Concern:** Too many navigation options could overwhelm users

**Mitigation:**
- Progressive disclosure (related games in separate section)
- Clear hierarchy (breadcrumbs → opponent link → related games)
- Subtle styling (not competing with main countdown)

**Verdict:** Low risk - actually improves UX

---

## Next Steps After Implementation

1. **Deploy to production**
2. **Monitor analytics** for engagement metrics
3. **Check Search Console** for internal link changes
4. **Track bounce rate** and pages per session
5. **Measure organic traffic** to game/team pages over 60-90 days
6. **Iterate** - add more link types if successful

---

## Comparison to Completed Work

### How Internal Linking Compares

| Feature | Effort | SEO Impact | UX Impact | Total Value |
|---------|--------|------------|-----------|-------------|
| **Structured Data** ✅ | 4-6 hours | 🔥🔥🔥 Very High | ⚡ Low | 🔥🔥🔥 Very High |
| **Breadcrumbs** ✅ | 1 hour | 🔥 High | 🔥 High | 🔥🔥 Very High |
| **Internal Linking** ⬜ | 2-2.5 hours | 🔥🔥 High | 🔥🔥 Very High | 🔥🔥🔥 Very High |

**Internal linking has:**
- Similar SEO impact to breadcrumbs
- **BETTER UX impact** than structured data
- Best effort-to-value ratio of remaining tasks

---

## Key Design Decisions

### ✅ DECIDED: Make Existing Opponent Text Clickable

**Approach:** Transform "vs Indiana Pacers" text into a clickable link

**Why:**
- Cleaner UI (no additional "View schedule" text)
- Natural interaction (click the thing you want to see)
- Simpler implementation (just wrap existing text)
- Better mobile UX (larger touch target)
- Follows web conventions

**Styling:**
```tsx
vs{' '}
<Link className="underline decoration-white/50 hover:decoration-white">
  Indiana Pacers
</Link>
```

Subtle underline indicates clickability without being obtrusive.

---

### ✅ DECIDED: Add to Both Team and Game Pages

**Scope:** Opponent links on:
- Team pages (next game opponent)
- Game pages (current game opponent)

**Why both:**
- Same user value on both page types
- Minimal extra effort (same code logic)
- Strengthens team-to-team relationships

---

### ✅ DECIDED: Skip Opponent Links in Game List

**Scope:** Do NOT add opponent links to "All Games" list on team pages

**Why:**
- Avoids nested link confusion (row is already clickable)
- Featured next game has opponent link (sufficient)
- Can add later if user feedback suggests it

---

## Questions to Answer Before Implementation

1. ✅ **Make existing text clickable vs. add new link?**
   - DECIDED: Make existing text clickable

2. ✅ **Add opponent links to team pages too?**
   - DECIDED: Yes, on both team and game pages

3. ✅ **Opponent links in game list?**
   - DECIDED: No, skip to avoid nested link confusion

4. ❓ **How many related games to show?**
   - Recommendation: 3 games (enough options, not overwhelming)

5. ❓ **Underline style or no underline?**
   - Recommendation: Subtle underline (`decoration-white/50`) for affordance

---

## Why This Is The Last "Quick Win"

After internal linking, remaining pSEO opportunities are:
- Content expansion (requires content strategy)
- New page types (requires new features/data)
- FAQ schema (diminishing returns)

**Internal linking is:**
- ✅ Last low-hanging fruit
- ✅ High impact for moderate effort
- ✅ Completes the core pSEO foundation

**After this, you'll have:**
1. ✅ Comprehensive structured data
2. ✅ Breadcrumb navigation
3. ✅ Strong internal link structure
4. ✅ Solid foundation for organic growth

---

_Ready for implementation when approved_
