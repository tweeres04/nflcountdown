# Monetization Plan for Team Countdown

**Created:** January 28, 2026  
**Status:** Phase 1 (tickets) shipped. Betting and merch not yet implemented.  
**Updated:** February 25, 2026  
**Estimated Effort:** 4-6 hours (AI-assisted) for Phase 1; 12-20 hours for Phase 5

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

### Update (February 6, 2026)

**Impact.com Application Status:** Rejected with reason "Does not meet MPUA standards"

**MPUA** stands for **Minimum Publisher Underwriting Assessment**. It's Impact.com's quality checklist for evaluating whether a publisher site is legitimate and trustworthy enough to join their affiliate marketplace.

**Root cause:** The site was missing essential trust and legal pages that affiliate networks require:
- No Privacy Policy page
- No Terms of Service page
- No About page
- No Contact page
- No affiliate disclosure in footer
- No copyright notice

**Resolution:** All missing pages have been created and the footer has been updated with proper legal links, affiliate disclosure, and copyright notice. The site now meets standard MPUA requirements and is ready for reapplication.

**Next steps:** Wait a reasonable period (7-14 days) before reapplying to Impact.com to demonstrate the improvements have been live and stable.

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
| Phase 5 | When SDK stable | ChatGPT App distribution channel | TBD (affiliate + PWA installs) |

**Growth Strategy:** Monetization works best alongside traffic growth. The recent pSEO improvements (structured data, breadcrumbs, internal linking) should drive organic traffic from 3K → 10K over 3-6 months. Focus on validating affiliate performance now, then scale revenue as traffic grows.

---

## Phase 1: Affiliate Marketing (Primary Focus)

### Selected Affiliate Programs

#### 1. Ticket Affiliates

**Status: Shipped** via TicketNetwork through CJ Affiliate. See `docs/ticketnetwork-integration.md` for full implementation details.

| Program | Commission | Cookie | Apply At | Priority |
|---------|------------|--------|----------|----------|
| **TicketNetwork (via CJ)** ✅ | CJ-negotiated | 7 days | CJ Affiliate — approved | **Live** |
| StubHub | 4-6% | 7 days | stubhub.com/affiliates (via Partnerize) | Fallback |
| SeatGeek | 5% | 30 days | CJ Affiliate network | Fallback |

**Why tickets:**
- Perfect user intent match (researching game → buy tickets)
- Highest click-through rate expected (3-5%)
- Average order value: $50-200
- Best UX fit (natural next action)

**Implementation:**
- `app/lib/cj-service.ts` — queries TicketNetwork via CJ GraphQL API, matches by game date, caches per-event to `data/cache/cj-tickets.json` (7-day TTL)
- Links are game-specific (not generic team search) — deferred/streamed via Remix `defer()` with Suspense
- All leagues live: NFL, MLB, NBA, NHL, WNBA, MLS. CPL excluded (no coverage).

---

#### 2. Sports Betting Affiliates

| Program | Payout Model | Amount | Network | Status |
|---------|--------------|--------|---------|--------|
| **BetMGM** | CPA | up to $50 | CJ #6218491 | Pending |
| **UKLG_FanDual** | Lead | $1.75/lead | CJ #4601118 | Pending |
| **UKLG_William Hill** | Lead | $0–4.80/lead | CJ #5353892 | Pending |
| DraftKings | CPA | $25-100 | draftkings.com/affiliates | Pending |
| FanDuel | CPA | $25-100 | fanduel.com/affiliates | Not applied |

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

| Program | Commission | Network | Status |
|---------|------------|---------|--------|
| **DICK'S Sporting Goods** | 2% | CJ #7345657 | Pending |
| **PUMA US** | 2–5% | CJ #5881002 | Pending |
| Fanatics | 1-10% (varies) | Impact | Not applied |
| NFL Shop | 4% | Rakuten/CJ | Not applied |

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
Route Loaders (defer)
  ↓ getAffiliateLinks() → Promise<AffiliateLinks | null>
  ↓ passed to defer() as unresolved promise
  ↓
Countdown Component
  ↓ <Suspense> + <Await> — invisible placeholder while loading
  ↓ Fades in button when promise resolves
  ↓
User clicks → TicketNetwork (via CJ tracked link)
```

### Key files

| File | Purpose |
|------|---------|
| `app/lib/cj-service.ts` | CJ GraphQL API client, game matching, disk cache |
| `app/components/countdown.tsx` | Suspense/Await wrapper, ticket button UI |
| `app/routes/$league.$teamAbbrev_.tsx` | Team page — deferred affiliate links |
| `app/routes/$league.$teamAbbrev.$gameSlug.tsx` | Game page — deferred affiliate links |
| `data/cache/cj-tickets.json` | Per-event disk cache (7-day TTL) |

### Environment variables

```bash
CJ_ACCESS_TOKEN=...
CJ_COMPANY_ID=...
CJ_WEBSITE_PID=...
CJ_TICKETNETWORK_PARTNER_ID=...
```

### Not yet implemented

- **Betting affiliates** (DraftKings, FanDuel) — highest per-conversion payout, next priority
- **Merch affiliates** (Fanatics) — lower priority, smaller payout

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

### Phase 1: Tickets (Complete)
- [x] Apply to CJ Affiliate / TicketNetwork
- [x] Receive CJ credentials and partner ID
- [x] Build `app/lib/cj-service.ts` — CJ GraphQL API, game matching, disk cache
- [x] Add deferred affiliate links to team and game page loaders
- [x] Update `countdown.tsx` with Suspense/Await, invisible placeholder, fade-in
- [x] Add affiliate disclosure to footer
- [x] Deploy to production

### Phase 2: Betting (Pending approval)
- [x] Apply to BetMGM (CJ #6218491) — pending
- [x] Apply to DraftKings — pending (applied directly, no response yet)
- [x] Apply to UKLG_FanDual (CJ #4601118) — pending, Lead: $1.75
- [x] Apply to UKLG_William Hill (CJ #5353892) — pending, Lead: $0–4.80
- [ ] Once approved: add betting link to `AffiliateLinks` interface and `countdown.tsx`
- [ ] Include 21+ disclaimer and 1-800-GAMBLER hotline near betting button
- [ ] Deploy

### Phase 3: Merch (Pending approval)
- [x] Apply to DICK'S Sporting Goods (CJ #7345657) — pending, Sale: 2%
- [x] Apply to PUMA US (CJ #5881002) — pending, Sale: 2–5%
- [ ] Once approved: add merch link to `AffiliateLinks` interface and `countdown.tsx`
- [ ] Deploy

### Phase 3b: Second ticket provider (Pending approval)
- [x] Apply to TicketSmarter (CJ #5346842) — pending, Sale: 3%, 7-day EPC: $91.24
- [ ] If approved and TicketNetwork coverage is insufficient: integrate as fallback

### Phase 4: Optimization (Ongoing)
- [ ] Review weekly revenue reports from CJ dashboard
- [ ] A/B test button copy/order
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

### Phase 5: ChatGPT App Distribution Channel (Future)

**Overview:** Build a ChatGPT App using OpenAI's Apps SDK that renders countdown widgets directly in ChatGPT conversations. The app serves as both a monetization channel (affiliate links in widget UI) and a growth channel (PWA install funnel).

**User Flow:**
1. User asks ChatGPT: "When is the next Seahawks game?"
2. ChatGPT calls Team Countdown's MCP server
3. Widget renders in ChatGPT with:
   - Team name, logo, colors
   - Game date, time, opponent
   - Countdown timer (client-side)
   - "Get tickets" / "Bet" / "Shop gear" buttons (affiliate links)
   - "Add to your home screen in one tap" CTA → links to teamcountdown.com/nfl/sea

**Monetization Channels:**
- **Affiliate conversions** - Users click affiliate buttons directly in ChatGPT widget
- **PWA installs** - Users click through to site and install the home screen app (long-term retention)
- **Brand awareness** - Discovery through ChatGPT app store

**Prerequisites:**
- [ ] At least one affiliate program approved (tickets or betting)
- [ ] Apps SDK publicly available and stable (currently in gated beta - docs behind auth)
- [ ] Submission guidelines reviewed - confirm affiliate links are allowed in widget UI
- [ ] MCP server hosting plan (Node.js server required)

**Technical Requirements:**

1. **Public JSON API endpoint** (add to Remix site):
   - Route: `/api/next-game` 
   - Params: `team` (e.g., "sea"), `league` (e.g., "nfl")
   - Returns: JSON with team info, next game details, affiliate links
   - Example response:
     ```json
     {
       "team": { "name": "Seattle Seahawks", "abbrev": "sea", "logo": "https://...", "primaryColor": "#002244" },
       "game": { "opponent": "San Francisco 49ers", "date": "2026-03-05T13:00:00-08:00", "broadcast": "FOX" },
       "affiliateLinks": { "tickets": "https://...", "betting": "https://...", "merch": "https://..." },
       "installUrl": "https://teamcountdown.com/nfl/sea"
     }
     ```

2. **MCP Server** (separate Node.js project):
   - Exposes "get_next_game" tool to ChatGPT
   - Calls Team Countdown API endpoint
   - Returns data in MCP protocol format
   - Hosting: Deploy to same VPS or separate service (Render, Railway, Fly.io)

3. **React Widget UI** (separate React app):
   - Built with `@openai/apps-sdk-ui` (official component library)
   - Uses React 18/19 + Tailwind 4 (same stack as main site)
   - Components available: Badge, Button, ButtonLink, TextLink, Icons
   - Renders countdown card with team branding
   - Affiliate buttons use `ButtonLink` component for external links
   - PWA install CTA uses `Button` component

**Development Effort:** 
- API endpoint: 2-4 hours
- MCP server: 4-6 hours (first time with MCP)
- React widget UI: 4-6 hours
- Testing & submission: 2-4 hours
- **Total: 12-20 hours (1.5-2.5 AI-assisted days)**

**Revenue Potential:**
- Unknown at this stage - depends on:
  - ChatGPT app store discovery/ranking
  - Affiliate link click-through rates in widget UI
  - PWA install conversion rates
- Early mover advantage: Platform is very new (Apps SDK v0.2.1, Dec 2025), less competition

**Open Questions (require Apps SDK access to answer):**
- Are affiliate links explicitly allowed in widget UI? (check `/apps-sdk/build/monetization` and `/apps-sdk/app-submission-guidelines` docs)
- Does OpenAI take a revenue share from affiliate conversions?
- What are the app review/approval timelines?
- Can widgets update dynamically (e.g., live countdown timer)?

**Next Steps:**
1. Sign up for Apps SDK beta access at platform.openai.com/apps-sdk
2. Read monetization and submission guidelines
3. Build API endpoint (useful for other integrations too)
4. Wait for SDK to stabilize before committing to full build

**Risk Assessment:**
- **Platform risk:** Apps SDK is very new (2 months old), could have breaking changes or deprecation
- **Approval risk:** App might be rejected if affiliate links violate submission guidelines
- **Maintenance burden:** Requires separate MCP server deployment and ongoing maintenance
- **Low traffic risk:** Current ChatGPT referrals (2 users/month) don't justify investment yet

**Go/No-Go Decision Criteria:**
- ✅ Apps SDK docs confirm affiliate links are allowed
- ✅ At least one affiliate program approved
- ✅ ChatGPT referral traffic grows to 20+ users/month (demonstrates demand)
- ✅ Apps SDK reaches v1.0 or shows production-readiness signals

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

**Last Updated:** February 25, 2026  
**Next Review:** After betting affiliate approved and live
