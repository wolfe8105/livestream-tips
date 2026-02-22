# StreamToStage — Session 21 Handoff
## Performer Landing Page + Browse Page Cleanup
**Date:** February 22, 2026

---

## What Was Done

### 1. Performer-Facing Promotional Landing Page (6 iterations)

Built a mobile-first recruitment landing page targeting dancers. Went through 6 versions based on competitive research and iterative feedback:

**v1:** Navy/gold luxury aesthetic — too investor-facing, not for performers
**v2:** Pink/black dressing room energy — better tone but desktop-first
**v3:** Mobile-first rebuild — sticky CTA, swipe cards, 2x2 grids, thumb-friendly
**v4:** Empowerment rewrite — removed exploitative language, viewer-safe if a customer sees it
**v5:** Tease/reveal cycle + removed scrolling ticker (motion sickness) + edgier money talk with percentages not dollar figures
**v6 (FINAL):** Added "level playing field" section — no bots, no AI, no foreign undercutting, no illegal performers

### Competitive Research Completed
Analyzed signup flows, design patterns, payout structures, and messaging for:
- **Cam sites:** Chaturbate, StripChat, LiveJasmin, BongaCams, OnlyFans
- **Club sites:** Sapphire Las Vegas, Scores LV, Rick's Cabaret chain, Hustler Club/Deja Vu
- **Pole Position App** (key competitive intelligence — invite-only dancer platform used by Rick's Cabaret chain)

### Key Design Decisions in Final Landing Page (v6)

**Headline:** "Give them what the club can't." — works for both performers AND viewers

**The tease→reveal cycle (viewer-safe):**
1. The stage — he sees her perform, rules/bouncers/dress codes, leaves wanting more
2. The stream — her space, no restrictions, the version of her the club couldn't show
3. The return — now he's a fan, comes back asking for her by name, wants that private dance
4. The cycle — stage fuels stream, stream fuels stage, two income streams

**"A Fair Stage" section (NEW in v6):**
- 🤖 No AI or deepfakes — "Algorithms can't fake a pay stub"
- 💵 No one undercutting your value — foreign streamers drive prices down, STS is verified U.S. venues only
- 🛡️ No illegal performers — every performer age-verified and club-verified

**Money section:** Edgy but no dollar figures. 55% cut, fast payouts, 2x revenue, $0 startup. "Your talent sets your price — not someone halfway around the world willing to go lower."

**Mobile-first design:**
- Sticky bottom CTA bar (always visible, safe-area-inset-bottom for iPhone)
- Horizontal swipe cards with scroll-snap for the cycle section
- 2x2 compact grids for perks
- Static stat bar instead of scrolling ticker
- Cancel button on mobile search
- Fonts: Syne (headings), Outfit (body)
- Colors: Black (#0d0d0d), Hot pink (#ff2d7b), Mint (#2dffc2), Gold (#ffd666)

---

### 2. Browse Page Updates (2 changes)

#### A. Removed Filter Bar
Deleted the entire trust-banner section between the search bar and stats bar:
- ~~🔴 Live Only button~~
- ~~Sort: Most Viewers dropdown~~
- ~~🗺️ Filter button + state filter expand~~
- ~~Verified Performers Only badge~~
- ~~✕ Clear button~~

Browse page now flows: Hero → Trending → Search Bar → Stats Bar → State Grid

Removed state variables: `setLiveOnly`, `setSortBy`, `showFilters`, `setShowFilters`, `stateFilter`, `setStateFilter`. Kept `liveOnly` and `sortBy` as static defaults (false / 'viewers') so the sort logic still works.

#### B. Mobile Keyboard Fix for Search Autocomplete
**Problem:** On mobile, the phone's keyboard popup covers the search autocomplete results, making them untappable.

**Solution:** When the search input receives focus on mobile (<640px), the search container becomes a **fullscreen fixed overlay** that sits above everything. The input pins to the top with a "Cancel" button, and results scroll in the remaining space below — completely above the keyboard.

- Added `searchFocused` state + `searchInputRef` ref
- `onFocus` triggers fullscreen mode
- Cancel button blurs input, clears search, closes overlay
- All search result clicks also close the overlay
- Desktop unchanged — still a normal dropdown
- Uses `env(safe-area-inset-top)` for iPhone notch

---

## Files Modified

| File | Change |
|------|--------|
| `src/pages/Browse.jsx` | Removed filter bar, added mobile fullscreen search |
| `src/index.css` | Updated search CSS with mobile overlay styles |

## Files Created

| File | Description |
|------|-------------|
| `sts-performer-landing-v6.html` | Final performer recruitment landing page |

---

## Deployment Instructions

### Browse Page Updates
1. Replace `src/pages/Browse.jsx` with the updated version
2. Replace `src/index.css` with the updated version
3. Run `npm run build`
4. Deploy to GitHub Pages

### Landing Page
`sts-performer-landing-v6.html` is a standalone HTML file — can be hosted anywhere independently (no build needed). Consider a subdomain or separate path like `/join` or `/performers`.

---

## Current State

- **38 source files** (unchanged count — 2 modified, 0 new app files)
- **Build:** needs rebuild after deploying Browse.jsx + index.css changes
- **Live (current):** https://wolfe8105.github.io/livestream-tips/
- **Tech stack:** React+Vite, HashRouter, service layer, AppContext
- **Landing page:** standalone HTML, not yet deployed

---

## Terminology Note

The main page users see when they open the app is called the **Browse page** (`Browse.jsx`). There is no `Home.jsx`. When referencing this page in future sessions, call it "the Browse page."

---

## To-Do List

### COMPLETED
- ✅ Promotional materials — Performer-facing landing page (v6 final)
- ✅ Browse page — Remove filter bar
- ✅ Browse page — Fix mobile keyboard covering search autocomplete

### PENDING
1. **Deploy S21 changes** — Replace Browse.jsx + index.css, rebuild, push
2. **Verification system design** — Build the 5-tier flexible verification flow
3. **Geographic launch plan execution** — Atlanta first, ambassador recruitment
4. **Infrastructure buildout** — Hetzner + AWS split from S19
5. **Landing page deployment** — Host sts-performer-landing-v6.html at a public URL

---

## Session History

| Session | Focus | Key Deliverables |
|---------|-------|-----------------|
| S1 | Technical Diagnostic | Wowza cost analysis, AMS recommendation |
| S2 | Revenue Model | Token economy, AMS service rewrites |
| S3 | Build Guide | 16-step build guide (2,500+ lines) |
| S4-S6 | WordPress/HTML demos | Club maps, performer pages, demo pages |
| S7 | React Conversion | 22 pages, React+Vite, HashRouter, GitHub Pages |
| S8 | Admin + Anti-Fraud | Admin dashboard, anti-fraud, SecurityKeys |
| S9 | BotShield | Bot detection, chat protection |
| S10 | Premium Channels | Premium features, monetization |
| S11 | Defense Gaps | 2FA, AML, AgeGate, TaxReporting, DMCA, PayoutVerification |
| S12 | Backend Build | 22-file Node.js backend + updated frontend services |
| S13 | Wallet Verification | payouts.js (micro-deposits + signature signing) |
| S14 | GitHub Cleanup | Repos restructured, backend rebuilt, both repos verified |
| S15 | Navy Theme Redesign | Background changed from black to navy |
| S16 | Wallet Management UI | Full add/verify/remove wallet page, payout request flow |
| S16b | Deploy + Bug Fix | Deployed to GitHub Pages, tested full wallet flow, fixed $NaN bug |
| S16c | Mobile Fixes + Cleanup | 3 mobile-first fixes, Earnings.jsx dead code removal |
| S17 | App Layout Redesign | Homepage cleanup, Clubs page, Dashboard overhaul, Profile Icons |
| S18 | Legal Compliance | Age gate, TOS, Privacy Policy, DMCA page, Cookie consent, trafficking reports |
| S19 | Freemium Access Tiers | 3-tier access (Guest/Free/Paid), GatePrompt, bandwidth calculator, Hetzner+AWS |
| S20 | Deep Research | B2C pivot, geographic analysis, adoption projections, dual-experience loop, scaling roadmap |
| **S21** | **Landing Page + Browse Cleanup** | **Performer recruitment page (6 iterations), competitive research, removed Browse filter bar, mobile keyboard search fix** |
