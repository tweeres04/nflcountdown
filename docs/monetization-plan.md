# Monetization Plan for Team Countdown

**Created:** January 28, 2026  
**Status:** Planning Phase  
**Estimated Effort:** 4-6 hours (AI-assisted)

---

## Table of Contents

1. [Overview](#overview)
2. [Current State](#current-state)
   - [Traffic & Audience](#traffic--audience)
   - [Technical Context](#technical-context)
3. [Monetization Strategy](#monetization-strategy)
   - [Why Affiliates First?](#why-affiliates-first)
   - [Phase Timeline](#phase-timeline)
4. [Phase 1: Affiliate Marketing](#phase-1-affiliate-marketing-primary-focus)
   - [Selected Affiliate Programs](#selected-affiliate-programs)
   - [1. Ticket Affiliates](#1-ticket-affiliates)
   - [2. Sports Betting Affiliates](#2-sports-betting-affiliates)
   - [3. Sports Merchandise Affiliates](#3-sports-merchandise-affiliates)
   - [Revenue Projections](#revenue-projections-conservative)
5. [Technical Implementation](#technical-implementation)
   - [Architecture Overview](#architecture-overview)
   - [Files to Create](#files-to-create)
   - [Files to Modify](#files-to-modify)
   - [Configuration Management](#configuration-management)
6. [Legal & Compliance](#legal--compliance)
   - [FTC Affiliate Disclosure Requirements](#ftc-affiliate-disclosure-requirements)
   - [Sports Betting Legal Considerations](#sports-betting-legal-considerations)
   - [Link Attributes & SEO](#link-attributes--seo)
7. [Tracking & Analytics](#tracking--analytics)
   - [What to Track](#what-to-track)
   - [Implementation Options](#implementation-options)
8. [UI/UX Considerations](#uiux-considerations)
   - [Design Principles](#design-principles)
   - [Placement Strategy](#placement-strategy)
   - [Button Styling](#button-styling)
9. [Testing Strategy](#testing-strategy)
   - [Before Launch](#before-launch)
   - [After Launch](#after-launch)
   - [Success Metrics](#success-metrics-first-30-days)
10. [Affiliate Program Details](#affiliate-program-details)
    - [Application Process](#application-process)
    - [Approval Requirements](#approval-requirements)
11. [Rollout Plan](#rollout-plan)
12. [Future Enhancements](#future-enhancements)
13. [Risk Mitigation](#risk-mitigation)
14. [Expected Results](#expected-results)
15. [Key Decisions & Rationale](#key-decisions--rationale)
16. [Resources & References](#resources--references)
17. [Questions & Answers](#questions--answers)
18. [Success Criteria](#success-criteria)

---

## Overview

This document outlines the monetization strategy for teamcountdown.com, focusing on affiliate marketing as the primary revenue source. The approach prioritizes user intent alignment and non-intrusive implementation while maximizing revenue potential.

---

## Current State

### Traffic & Audience
- **Current Traffic:** ~3,000 monthly page views
- **User Intent:** Users are actively researching upcoming games ("When is the next [team] game?")
- **High-Intent Actions:** After finding game times, users naturally want to:
  1. Buy tickets to attend
  2. Watch/stream the game
  3. Bet on the game
  4. Buy team merchandise

### Technical Context
- **Platform:** Remix (React SSR)
- **Key Component:** `app/components/countdown.tsx` (renders on both team and game pages)
- **Pages:** ~8,100+ game pages + 92 team pages
- **User Flow:** Most users land directly on team pages via search (e.g., "Eagles next game"). Game pages see less traffic.
- **Primary Landing Pages:** Team pages (`/$league/$teamAbbrev`) - ~92 pages
- **Secondary Pages:** Game pages (`/$league/$teamAbbrev/$gameSlug`) - ~8,100 pages

---

## Monetization Strategy

### Why Affiliates First?

1. **No minimum traffic requirements** - Can start earning immediately
2. **User intent alignment** - Users are already in "buying mode"
3. **Non-intrusive** - Just links, not ads
4. **Better margins** - Affiliate commissions beat low-traffic ad RPMs
5. **Scales with traffic** - Revenue grows linearly with page views

### Phase Timeline

| Phase | When | Focus | Est. Monthly Revenue |
|-------|------|-------|---------------------|
| Phase 1 | Now (3K traffic) | Affiliate links (tickets, betting, merch) | $50-90 |
| Phase 2 | 10K+ traffic | Add display ads (single unit) | $250+ total |
| Phase 3 | 50K+ traffic | Premium ad networks (Mediavine) | $1,000+ total |
| Phase 4 | 100K+ traffic | Direct sponsorships | $3,000+ total |

**Growth Strategy:** Monetization works best alongside traffic growth. The recent pSEO improvements (structured data, breadcrumbs, internal linking) should drive organic traffic from 3K → 10K over 3-6 months. Focus on validating affiliate performance now, then scale revenue as traffic grows.

---

## Phase 1: Affiliate Marketing (Primary Focus)

### Selected Affiliate Programs

#### 1. Ticket Affiliates

| Program | Commission | Cookie | Apply At | Priority |
|---------|------------|--------|----------|----------|
| **StubHub** | 4-6% | 7 days | stubhub.com/affiliates (via Partnerize) | High |
| **SeatGeek** | 5% | 30 days | CJ Affiliate network | High |
| **Vivid Seats** | 6% | 30 days | Impact/Rakuten network | Medium |

**Why tickets:**
- Perfect user intent match (researching game → buy tickets)
- Highest click-through rate expected (3-5%)
- Average order value: $50-200
- Best UX fit (natural next action)

**Link strategy:**
- Link to team ticket search page (e.g., `stubhub.com/philadelphia-eagles-tickets`)
- Simpler than linking to specific games (no API required)
- Works for both team and game pages

---

#### 2. Sports Betting Affiliates

| Program | Payout Model | Amount | Apply At | Priority |
|---------|--------------|--------|----------|----------|
| **DraftKings** | CPA (Cost Per Acquisition) | $25-100 | draftkings.com/affiliates | High |
| **FanDuel** | CPA | $25-100 | fanduel.com/affiliates | High |
| **BetMGM** | CPA | $25-75 | betmgm.com/affiliates | Medium |

**Why betting:**
- Highest payout per conversion ($25-100 vs $2-10 for tickets)
- User researching game time → likely considering betting
- CPA model = one-time signup commission
- Expected conversion: 1-2% of clicks

**Legal considerations:**
- Must be 21+ (include disclaimer)
- Sports betting legal in 38+ US states (as of 2026)
- Gambling problem hotline: 1-800-GAMBLER
- Consider geo-filtering (optional, betting sites handle this)

**Link strategy:**
- Link to general sportsbook (not specific game bets)
- Include referral/promo code in URL
- Simpler implementation, better for branding

---

#### 3. Sports Merchandise Affiliates

| Program | Commission | Cookie | Apply At | Priority |
|---------|------------|--------|----------|----------|
| **Fanatics** | 1-10% (varies) | 7 days | Impact Affiliate network | High |
| **NFL Shop** | 4% | 7 days | Rakuten/CJ Affiliate | Medium |
| **NBA Store** | 4% | 7 days | Rakuten/CJ Affiliate | Medium |
| **MLB Shop** | 4% | 7 days | Rakuten/CJ Affiliate | Medium |

**Why merchandise:**
- Team loyalty drives purchases
- Works especially well on team pages
- Recurring purchases (fans buy multiple items)
- Average order value: $30-80
- Expected conversion: 1-2%

**Link strategy:**
- Link to team-specific shop page (e.g., `fanatics.com/nfl/philadelphia-eagles`)
- Fanatics operates most official team shops (consolidated affiliate)
- League-specific shops for direct official merchandise

---

### Revenue Projections (Conservative)

**At 3,000 monthly page views (current):**

| Source | Click Rate | Clicks/mo | Conversion | Conv/mo | Avg Payout | Revenue |
|--------|------------|-----------|------------|---------|------------|---------|
| Tickets | 3% | 90 | 3% | 2-3 | $5 | $10-15 |
| Betting | 1% | 30 | 5% | 1-2 | $35 | $35-70 |
| Merchandise | 2% | 60 | 2% | 1 | $8 | $8 |
| **TOTAL** | | | | | | **$53-93** |

**Traffic Distribution Note:** Most of the 3,000 monthly page views go to team pages. The affiliate CTAs will have maximum exposure since they appear on the Countdown component, which renders on both team and game pages.

**At 10,000 monthly page views:**

| Source | Click Rate | Clicks/mo | Conversion | Conv/mo | Avg Payout | Revenue |
|--------|------------|-----------|------------|---------|------------|---------|
| Tickets | 3% | 300 | 3% | 9 | $5 | $45 |
| Betting | 1% | 100 | 5% | 5 | $35 | $175 |
| Merchandise | 2% | 200 | 2% | 4 | $8 | $32 |
| **TOTAL** | | | | | | **$252** |

**At 50,000 monthly page views:**

| Source | Revenue |
|--------|---------|
| Tickets | $225 |
| Betting | $875 |
| Merchandise | $160 |
| **TOTAL** | **$1,260** |

**At 100,000+ monthly page views:**
- Affiliate revenue: ~$2,500/month
- Can add display ads: +$1,500-3,000/month
- Total potential: **$4,000-5,500/month**

---

## Technical Implementation

### Architecture Overview

```
Route Loaders
  ↓ Generate affiliate links for team/game
  ↓ Pass to Countdown component
  ↓
Countdown Component
  ↓ Receives affiliateLinks prop
  ↓ Renders inline CTA buttons
  ↓
User clicks → External affiliate site
```

### Files to Create/Modify

#### 1. `app/lib/affiliate-links.ts` (New file to create)

**Purpose:** Generate affiliate URLs with proper tracking

```typescript
interface AffiliateLinks {
  tickets: string      // StubHub/SeatGeek
  betting: string      // DraftKings/FanDuel
  merch: string        // Fanatics/Official Shop
  watch?: string       // Future: ESPN+/streaming
}

interface AffiliateConfig {
  stubhub: {
    affiliateId: string
    baseUrl: string
  }
  draftkings: {
    referralCode: string
    baseUrl: string
  }
  fanatics: {
    affiliateId: string
    baseUrl: string
  }
}

function getAffiliateLinks(
  team: Team, 
  league: string, 
  config: AffiliateConfig
): AffiliateLinks {
  return {
    tickets: generateTicketLink(team, config.stubhub),
    betting: generateBettingLink(config.draftkings),
    merch: generateMerchLink(team, league, config.fanatics),
  }
}

function generateTicketLink(team: Team, config): string {
  // Example: https://www.stubhub.com/philadelphia-eagles-tickets?affid=YOUR_ID
  return `${config.baseUrl}/${team.slug}-tickets?affid=${config.affiliateId}`
}

function generateBettingLink(config): string {
  // Example: https://sportsbook.draftkings.com?referral=YOUR_CODE
  return `${config.baseUrl}?referral=${config.referralCode}`
}

function generateMerchLink(team: Team, league: string, config): string {
  // Example: https://www.fanatics.com/nfl/philadelphia-eagles?_ref=YOUR_ID
  return `${config.baseUrl}/${league.toLowerCase()}/${team.slug}?_ref=${config.affiliateId}`
}
```

**Team slug mapping:**
- Most teams: lowercase abbreviation (`phi`, `dal`, `bos`)
- May need custom mappings for special cases
- Can use existing `team.abbreviation.toLowerCase()` as starting point

---

#### 2. Update `app/components/ui/button.tsx` to Add Affiliate Variant

**Purpose:** Add an `affiliate` variant to the existing Button component for affiliate links

**Why use Button component with variants:**
- Consistent with existing design system
- Uses Radix Slot pattern (`asChild`) to render as `<a>` tag
- Follows same pattern as `badge.tsx` (uses `class-variance-authority`)
- Reusable across the site if needed elsewhere

**Implementation:**

```tsx
import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '~/lib/utils'

const buttonVariants = cva(
  // Base styles (shared across all variants)
  'flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-950 focus-visible:ring-offset-2 transition-colors',
  {
    variants: {
      variant: {
        default: 
          'w-full lg:w-auto justify-center border-2 rounded-sm border-white px-5 py-2',
        affiliate: 
          'inline-flex gap-1.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-sm font-medium',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant }), className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
```

**Usage in `countdown.tsx`:**

```tsx
{/* Affiliate CTAs */}
{affiliateLinks && (
  <div className="flex flex-wrap gap-3 mt-6 justify-center">
    <Button variant="affiliate" asChild>
      <a 
        href={affiliateLinks.tickets}
        target="_blank"
        rel="noopener noreferrer sponsored"
      >
        🎟️ Tickets
      </a>
    </Button>
    <Button variant="affiliate" asChild>
      <a 
        href={affiliateLinks.betting}
        target="_blank"
        rel="noopener noreferrer sponsored"
      >
        🎰 Bet
      </a>
    </Button>
    <Button variant="affiliate" asChild>
      <a 
        href={affiliateLinks.merch}
        target="_blank"
        rel="noopener noreferrer sponsored"
      >
        👕 Gear
      </a>
    </Button>
  </div>
)}
```

**Styling notes:**
- `variant="default"` - Existing button style (border-2, border-white) - maintains backward compatibility
- `variant="affiliate"` - New pill-shaped style for affiliate links
- `asChild` prop renders as `<a>` tag using Radix Slot (semantic HTML)
- `bg-white/10` - Subtle on team-colored backgrounds
- `hover:bg-white/20` - Clear hover state
- `rounded-full` - Pill shape, more subtle than default's `rounded-sm border-2`
- Exports `buttonVariants` for consistency with shadcn patterns (like `badgeVariants`)

---

### Files to Modify

#### 1. `app/components/countdown.tsx`

**Add prop:**
```typescript
interface CountdownProps {
  // ... existing props
  affiliateLinks?: AffiliateLinks
}
```

**Add to JSX (after countdown display, before "You might like"):**
```tsx
{/* Affiliate CTAs */}
{affiliateLinks && (
  <div className="flex flex-wrap gap-3 mt-6 justify-center">
    <a href={affiliateLinks.tickets} 
       target="_blank" 
       rel="noopener noreferrer sponsored"
       className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-sm font-medium transition-colors">
      🎟️ Tickets
    </a>
    <a href={affiliateLinks.betting}
       target="_blank"
       rel="noopener noreferrer sponsored"  
       className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-sm font-medium transition-colors">
      🎰 Bet
    </a>
    <a href={affiliateLinks.merch}
       target="_blank"
       rel="noopener noreferrer sponsored"
       className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-sm font-medium transition-colors">
      👕 Gear
    </a>
  </div>
)}
```

**Why `rel="noopener noreferrer sponsored"`:**
- `noopener` - Security best practice for `target="_blank"`
- `noreferrer` - Privacy consideration
- `sponsored` - Signals to Google that this is a paid/affiliate link (SEO best practice)

---

#### 3. `app/components/ui/button.tsx` (Modify to add affiliate variant)

**Add variant support using `class-variance-authority`** (same pattern as `badge.tsx`)

See detailed implementation above in "Files to Create/Modify" section.

---

#### 4. `app/routes/$league.$teamAbbrev_.tsx` (Team Pages)

**In loader:**
```typescript
export async function loader({ params }: LoaderFunctionArgs) {
  // ... existing code ...
  
  const affiliateLinks = getAffiliateLinks(team, LEAGUE, affiliateConfig)
  
  return json({
    // ... existing data
    affiliateLinks,
  })
}
```

**Pass to Countdown:**
```tsx
<Countdown
  // ... existing props
  affiliateLinks={affiliateLinks}
/>
```

---

#### 5. `app/routes/$league.$teamAbbrev.$gameSlug.tsx` (Game Pages)

**Same as team pages:**
```typescript
export async function loader({ params }: LoaderFunctionArgs) {
  // ... existing code ...
  
  const affiliateLinks = getAffiliateLinks(team, LEAGUE, affiliateConfig)
  
  return json({
    // ... existing data
    affiliateLinks,
  })
}
```

---

#### 6. `app/root.tsx` (Add Affiliate Disclosure to Footer)

**Add to footer:**
```tsx
<footer className="text-center text-xs text-stone-500 py-8">
  <p>
    Some links on this site are affiliate links. We may earn a commission if you make a purchase.
  </p>
  <p className="mt-2">
    21+ for betting links. Gambling problem? Call{' '}
    <a href="tel:1-800-GAMBLER" className="underline">
      1-800-GAMBLER
    </a>
  </p>
</footer>
```

**Or create separate disclosure page:**
- `app/routes/affiliate-disclosure.tsx`
- Link from footer: "Affiliate Disclosure"
- More detailed explanation of partnerships

---

### Configuration Management

**Option 1: Environment Variables (Recommended)**

```bash
# .env
STUBHUB_AFFILIATE_ID=your_id_here
DRAFTKINGS_REFERRAL_CODE=your_code_here
FANATICS_AFFILIATE_ID=your_id_here
```

**Option 2: Config File**

```typescript
// app/lib/affiliate-config.ts
export const affiliateConfig = {
  stubhub: {
    affiliateId: process.env.STUBHUB_AFFILIATE_ID || 'PLACEHOLDER',
    baseUrl: 'https://www.stubhub.com',
  },
  draftkings: {
    referralCode: process.env.DRAFTKINGS_REFERRAL_CODE || 'PLACEHOLDER',
    baseUrl: 'https://sportsbook.draftkings.com',
  },
  fanatics: {
    affiliateId: process.env.FANATICS_AFFILIATE_ID || 'PLACEHOLDER',
    baseUrl: 'https://www.fanatics.com',
  },
}
```

**Benefits of env vars:**
- Keep affiliate IDs out of version control
- Easy to change without code deployment
- Can have different IDs for staging/production

---

## Legal & Compliance

### FTC Affiliate Disclosure Requirements

**Required:** Clear disclosure that site contains affiliate links

**Options:**
1. Footer text on every page (simplest)
2. Dedicated disclosure page (more thorough)
3. Per-link disclosure (overkill for this use case)

**Recommended language:**
> "This site contains affiliate links. We may earn a commission if you make a purchase through these links at no additional cost to you."

---

### Sports Betting Legal Considerations

**Legal in 38+ US states as of 2026:**
- Must include age restriction (21+)
- Must include problem gambling helpline
- Consider geo-filtering (optional, betting sites handle this)

**Disclaimer text:**
> "21+ only. Sports betting is subject to state regulations. Gambling problem? Call 1-800-GAMBLER."

**Implementation options:**

**Option A: Show to everyone (simpler)**
- Let betting sites handle geo-restrictions
- Just show disclaimer

**Option B: Geo-filter links (complex)**
- Use IP geolocation API
- Only show betting links in legal states
- More development work, questionable ROI

**Recommendation:** Start with Option A (simpler, betting sites will block users from illegal states anyway)

---

### Link Attributes & SEO

**Use `rel="sponsored"` for affiliate links:**
- Signals to Google that link is paid/affiliate
- SEO best practice (prevents potential penalties)
- Required by Google's Webmaster Guidelines

**Full attribute set:**
```html
<a 
  href="..." 
  target="_blank" 
  rel="noopener noreferrer sponsored"
>
```

---

## Tracking & Analytics

### What to Track

1. **Click-through rates** - Which links get clicked most?
2. **Conversions** - How many clicks turn into sales/signups?
3. **Revenue** - How much each affiliate program earns
4. **Page performance** - Which pages/teams drive most revenue?

### Implementation Options

**Option 1: UTM Parameters (Recommended)**

Add to affiliate URLs:
```
?utm_source=teamcountdown
&utm_medium=affiliate
&utm_campaign=team_page  // or game_page - set dynamically based on page type
&utm_content=tickets_button
```

**Benefits:**
- Track in Google Analytics
- See which placements perform best
- No additional code needed

**Option 2: Analytics Events**

Track button clicks:
```tsx
onClick={() => {
  gtag('event', 'affiliate_click', {
    affiliate: 'stubhub',
    team: team.abbreviation,
    page_type: 'team', // or 'game' - set dynamically
  })
}}
```

**Recommendation:** Start with UTM parameters, add events later if needed

---

## UI/UX Considerations

### Design Principles

1. **Clear but not pushy** - Visible CTAs but don't dominate
2. **User intent alignment** - Place where users naturally want them
3. **Mobile-first** - Buttons must work on small screens
4. **Consistent styling** - Match existing design system

### Placement Strategy

**On Team Pages (Primary - Most Traffic):**
```
[Team Header]
[Next Game Countdown]

[🎟️ Tickets]  [🎰 Bet]  [👕 Gear]  ← Add here

[Full Schedule]
```

**On Game Pages (Secondary):**
```
[Game Header]
[Countdown Timer]
[AI Preview]

[🎟️ Tickets]  [🎰 Bet]  [👕 Gear]  ← Add here

[You Might Like]
```

**Note:** Both page types use the shared `Countdown` component, so affiliate CTAs will appear on both automatically. Team pages are the priority since they receive the majority of traffic.

### Button Styling

**Colors:**
- Base: `bg-white/10` (subtle on team colors)
- Hover: `bg-white/20` (clear interaction)
- Text: `text-white` (inherits from parent)

**Shape:**
- `rounded-full` (pill shape, modern)
- `px-4 py-2` (comfortable padding)
- `text-sm` (not too large, not too small)

**Icons:**
- Emoji for simplicity (no icon library needed)
- Universal recognition (🎟️ = tickets, 🎰 = betting, 👕 = merch)

---

## Testing Strategy

### Before Launch

1. **Verify affiliate links work** - Click each link, confirm tracking
2. **Test on mobile** - Buttons wrap properly, clickable
3. **Check all teams** - URLs generate correctly for all abbreviations
4. **Verify disclosures** - Legal text visible on all pages

### After Launch

1. **Monitor click rates** - Are users clicking? (Target: 3-5% for tickets)
2. **Track conversions** - Check affiliate dashboards weekly
3. **A/B test placements** - Try different button orders/copy
4. **Revenue tracking** - Track actual earnings vs projections

### Success Metrics (First 30 Days)

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Click-through rate | 3-5% | Google Analytics / Affiliate dashboards |
| Tickets conversion | 3%+ | StubHub affiliate dashboard |
| Betting conversion | 5%+ | DraftKings affiliate dashboard |
| Total revenue | $50+ | Sum of all affiliate payouts |
| User complaints | 0 | Email/social media feedback |

**Note:** At 3,000 monthly page views, even small conversion improvements have limited impact. Focus on validating the concept and user acceptance. Revenue will scale as traffic grows from SEO improvements.

---

## Affiliate Program Details

### Application Process

| Program | Application Time | Requirements | Notes |
|---------|------------------|--------------|-------|
| StubHub | 1-2 weeks | Website review, traffic stats | Via Partnerize network |
| DraftKings | 1-2 weeks | Website review, compliance check | Strict approval process |
| Fanatics | 1 week | Basic website review | Via Impact Radius network |

**Pro tip:** Apply to all programs in parallel to save time

### Approval Requirements

Most affiliate programs look for:
- **Established website** (✅ You have this)
- **Relevant content** (✅ Sports schedules = relevant)
- **Quality traffic** (✅ Organic search traffic)
- **No policy violations** (✅ Clean site)

**Potential concerns:**
- Low traffic (under 10K/month) - Most programs don't have strict minimums
- New site - Explain the pSEO strategy and growth potential

---

## Rollout Plan

### Phase 1: Preparation (Week 1)
- [ ] Sign up for affiliate programs (StubHub, DraftKings, Fanatics)
- [ ] Wait for approvals (1-2 weeks)
- [ ] Receive affiliate IDs and tracking links

### Phase 2: Development (Week 2-3)
- [ ] Create `app/lib/affiliate-links.ts` with config
- [ ] Add affiliate IDs to `.env` file
- [ ] Update `app/components/ui/button.tsx` to add `affiliate` variant
- [ ] Update `countdown.tsx` to use `<Button variant="affiliate">` for affiliate links
- [ ] Update team page route to pass affiliate links
- [ ] Update game page route to pass affiliate links
- [ ] Add affiliate disclosure to footer
- [ ] Test all links on local environment

### Phase 3: Testing (Week 3)
- [ ] Verify links work for all teams
- [ ] Test on mobile devices
- [ ] Check button styling on different team colors
- [ ] Confirm legal disclosures visible
- [ ] Test affiliate tracking (click links, check dashboards)

### Phase 4: Launch (Week 4)
- [ ] Deploy to production
- [ ] Monitor first 24 hours for issues
- [ ] Check Google Analytics for click data
- [ ] Verify affiliate tracking working

### Phase 5: Optimization (Ongoing)
- [ ] Review weekly revenue reports
- [ ] A/B test button copy/order
- [ ] Add more affiliate programs if needed
- [ ] Consider adding streaming affiliates (ESPN+, etc.)

---

## Future Enhancements

### Short-term (1-3 months)
- [ ] Add streaming service affiliates (ESPN+, NFL Game Pass)
- [ ] Experiment with button copy ("Buy Tickets" vs "Tickets")
- [ ] Add team-specific merchandise links (more targeted)
- [ ] A/B test button order (which goes first?)

### Medium-term (3-6 months)
- [ ] Add display ads when traffic hits 10K+
- [ ] Implement geo-filtering for betting links
- [ ] Add more betting affiliates (BetMGM, Caesars)
- [ ] Create dedicated "Where to Watch" pages with streaming links

### Long-term (6-12 months)
- [ ] Direct sponsorship deals with sportsbooks
- [ ] Premium ad network (Mediavine at 50K+ traffic)
- [ ] League-specific sponsorships
- [ ] Player pages with fantasy sports affiliates

---

## Risk Mitigation

### Potential Issues & Solutions

| Risk | Mitigation |
|------|------------|
| **Affiliate programs reject application** | Apply to multiple alternatives (SeatGeek, Vivid Seats, etc.) |
| **Low conversion rates** | A/B test placement, copy, button design |
| **Users complain about commercialization** | Keep design minimal, don't add intrusive ads |
| **Affiliate links break** | Monitor regularly, use link checking tools |
| **Betting compliance issues** | Include all required disclosures, consult legal if needed |
| **Google penalizes affiliate links** | Use `rel="sponsored"`, don't overdo link volume |

---

## Expected Results

### Revenue Timeline

| Month | Traffic | Tickets | Betting | Merch | Total |
|-------|---------|---------|---------|-------|-------|
| Month 1 | 3K | $10 | $35 | $8 | **$53** |
| Month 3 | 5K | $18 | $60 | $14 | **$92** |
| Month 6 | 10K | $45 | $175 | $32 | **$252** |
| Month 12 | 20K | $90 | $350 | $64 | **$504** |

**Note:** These projections assume organic traffic growth from improved SEO (structured data, breadcrumbs, internal linking already implemented). Actual results depend on seasonality, team performance, and content quality.

### Non-Revenue Benefits

1. **User value** - Convenient access to relevant services
2. **SEO boost** - More engagement signals (longer sessions)
3. **Brand partnerships** - Opens door to direct deals later
4. **Data insights** - Learn what users want (tickets vs betting)

---

## Key Decisions & Rationale

### Why Inline Buttons?
- Matches minimal design aesthetic
- Clear CTAs without being pushy
- Mobile-friendly (wraps naturally)
- Easy to implement (no complex UI)

### Why All Three Affiliates at Once?
- Maximize revenue potential from day one
- Learn which performs best through data
- Users have different preferences (some want tickets, some want betting)
- Minimal extra development work

### Why No Display Ads Yet?
- Low traffic = low ad revenue ($10-30/month)
- Ads hurt UX on a utility site
- Affiliates pay better at this scale
- Wait until 10K+ traffic for better rates

### Why Place After Countdown?
- User has already seen the game info (primary value delivered)
- Natural next action (now what? → buy tickets, bet, etc.)
- Doesn't interfere with core countdown experience
- Above "You might like" (better visibility)
- Works on both team and game pages (shared Countdown component)
- Team pages get most traffic, so maximum exposure

---

## Resources & References

### Affiliate Networks
- **Impact Radius** - https://impact.com (Fanatics)
- **CJ Affiliate** - https://www.cj.com (NFL Shop, NBA Store)
- **Rakuten Advertising** - https://rakutenadvertising.com
- **Partnerize** - https://partnerize.com (StubHub)

### Legal Resources
- **FTC Affiliate Disclosure Guide** - https://www.ftc.gov/business-guidance/resources/disclosures-101-social-media-influencers
- **Google Webmaster Guidelines** - https://developers.google.com/search/docs/essentials
- **Sports Betting Legality by State** - https://www.legalsportsreport.com/sports-betting/map/

### Industry Benchmarks
- Average ticket affiliate conversion: 2-5%
- Average sports betting CPA: $25-150
- Average merchandise conversion: 1-3%
- Sports site click-through rate: 3-8%

---

## Questions & Answers

### Q: Will this hurt SEO?
**A:** No, if done properly. Using `rel="sponsored"` tells Google these are affiliate links. The site still provides unique value (countdown functionality).

### Q: What if users don't click?
**A:** Even 2-3% click rate generates revenue. If lower, we can A/B test placement, copy, and design. Worst case, we remove and try display ads instead.

### Q: How long until we see revenue?
**A:** First commissions appear within 30-45 days (cookie duration + payment cycle). Full performance data takes 60-90 days.

### Q: Do we need geo-filtering for betting?
**A:** Not required. Betting sites already block users from illegal states. We just need the legal disclaimer.

### Q: What about international traffic?
**A:** StubHub works globally. Betting is US-only (show disclaimer). Fanatics has international versions we can link to.

---

## Success Criteria

### Must-Haves (Launch)
- ✅ All affiliate links working
- ✅ Legal disclosures present
- ✅ Mobile-responsive buttons
- ✅ No JavaScript errors
- ✅ Analytics tracking active

### Nice-to-Haves (Post-Launch)
- ⬜ A/B testing framework
- ⬜ Geo-filtering for betting
- ⬜ Team-specific ticket links (vs search)
- ⬜ Streaming service affiliates
- ⬜ Custom analytics dashboard

### Revenue Goals
- **Month 1:** $50+ (validation)
- **Month 3:** $90+ (steady growth)
- **Month 6:** $250+ (scaling with traffic)
- **Month 12:** $500+ (established revenue stream)

---

## Contact & Support

### Affiliate Program Support
- **StubHub:** [\[email protected\]](mailto:stubhub-affiliates@partnerize.com)
- **DraftKings:** draftkings.com/affiliates/contact
- **Fanatics:** Via Impact Radius dashboard

### Technical Questions
- Reference this document
- Check affiliate program FAQs
- Review FTC guidelines if legal question

---

**Last Updated:** January 28, 2026  
**Next Review:** After 30 days of live data
