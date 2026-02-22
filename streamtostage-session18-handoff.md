# StreamToStage — Session 18 Handoff
## Legal Compliance Build
**Date:** February 20, 2026

---

## What Was Done

### New Pages (5 new files)
1. **AgeGate.jsx** (component) — Age verification splash screen shown before any site access. Stores 30-day acceptance in localStorage. Links to TOS/Privacy from the gate. Includes TODO comments for third-party age verification provider integration.
2. **Terms.jsx** — Full Terms of Service (17 sections). Covers: age eligibility, account rules, user conduct, token economy, performer terms, content ownership, DMCA reference, prohibited content, reporting/safety with NCMEC hotline, limitation of liability, indemnification, dispute resolution, termination, severability. Placeholders for: payment processor name, refund policy, arbitration clause, governing state.
3. **Privacy.jsx** — Full Privacy Policy (13 sections). Covers: data collected (provided, automatic, third-party), how used, how shared, retention periods, user rights (all users + CCPA + GDPR), data security, cookies, children's privacy, international transfers, third-party links. Placeholders for: business address, DPO contact, analytics tools, international transfer mechanisms.
4. **DMCAPolicy.jsx** — Public DMCA takedown procedure page. Covers: designated agent info, how to file a takedown, counter-notification process, repeat infringer policy (3-strike), live stream considerations, misrepresentation warning. Placeholder for: DMCA agent name, address, phone. Includes notice to register with U.S. Copyright Office.
5. **CookieConsent.jsx** (component) — Cookie consent banner. Accept/Decline buttons. Stores preference in localStorage. Links to Privacy Policy.

### Updated Files (6 modified)
6. **App.jsx** — Added age gate wrapper (shows before login), imported all new pages, added `/terms`, `/privacy`, `/dmca` routes, legal pages accessible without login or age gate, CookieConsent rendered globally
7. **Layout.jsx** — Footer updated: single 2257 link → 4-link legal footer (Terms · Privacy · DMCA · 2257 Compliance)
8. **Login.jsx** — Added TOS/Privacy agreement text on signup flow, footer updated to match Layout's 4-link format
9. **Room.jsx** — Added "Suspected trafficking or exploitation" to report reasons, urgent reports (underage/trafficking) show NCMEC CyberTipline + Trafficking Hotline + 911 info, legal footer updated to 4-link format
10. **database.js** — Added `getAgeGateStatus()` and `getCookieConsent()` methods

### App Flow (New)
```
Visitor arrives → Age Gate → Accept (18+) → Login/Signup → Main App
                          → Decline → "Access Denied" screen
                          → Legal pages (Terms/Privacy/DMCA/2257) → accessible at any stage
```

---

## Current State

- **37 source files** — 5 new (AgeGate, CookieConsent, Terms, Privacy, DMCAPolicy)
- **Build:** `index-b5eEFcJr.js` (547.00 KB)
- **Live:** https://wolfe8105.github.io/livestream-tips/

---

## Placeholders Requiring Action

All placeholders are marked with `[PLACEHOLDER]` or `[To Be Determined]` in the source code.

| Item | File(s) | What's Needed |
|------|---------|---------------|
| Business address | Terms, Privacy, DMCAPolicy, Compliance | Form LLC → get registered address |
| Governing state | Terms.jsx | Attorney decision on jurisdiction |
| Custodian of Records | Compliance.jsx | Real person + physical address |
| DMCA Agent | DMCAPolicy.jsx | Designate agent + register with Copyright Office |
| Data Protection Contact | Privacy.jsx | Designate DPO or privacy contact |
| Payment processor name | Terms.jsx | CCBill account (or chosen processor) |
| Refund policy | Terms.jsx | Attorney to draft specific policy |
| Arbitration clause | Terms.jsx | Attorney to draft dispute resolution |
| Analytics tools | Privacy.jsx | Decide on analytics (GA, Plausible, none) |
| International transfer | Privacy.jsx | Attorney to specify GDPR mechanism if EU users |
| Third-party age verification | AgeGate.jsx | Choose provider (Yoti, Jumio, AgeChecker.net) |

---

## Legal Compliance Scorecard (Updated)

| # | Requirement | Status |
|---|-------------|--------|
| 1 | Age gate on site entry | ✅ BUILT (self-declaration; upgrade to 3rd-party needed) |
| 2 | Terms of Service page | ✅ BUILT (needs attorney review) |
| 3 | Privacy Policy page | ✅ BUILT (needs attorney review) |
| 4 | DMCA takedown page | ✅ BUILT (needs agent registration) |
| 5 | Cookie consent banner | ✅ BUILT |
| 6 | Trafficking report in streams | ✅ BUILT (with NCMEC + hotline info) |
| 7 | 2257 Compliance page | ✅ EXISTED (S7) |
| 8 | Performer identity verification | ✅ EXISTED (S7) |
| 9 | Admin age flagging | ✅ EXISTED (S8) |
| 10 | AML/KYC monitoring | ✅ EXISTED (S11) |
| 11 | Tax reporting system | ✅ EXISTED (S11) |
| 12 | Legal footer on all pages | ✅ BUILT (Terms · Privacy · DMCA · 2257) |
| 13 | TOS agreement on signup | ✅ BUILT |
| 14 | Form LLC | ❌ ACTION ITEM — pick state, file articles |
| 15 | Get EIN | ❌ ACTION ITEM — after LLC |
| 16 | Hire attorney | ❌ ACTION ITEM — adult entertainment specialist |
| 17 | Designate Custodian of Records | ❌ ACTION ITEM — real person + address |
| 18 | Register DMCA agent | ❌ ACTION ITEM — copyright.gov |
| 19 | Money transmitter evaluation | ❌ ACTION ITEM — attorney must evaluate |
| 20 | Third-party age verification | ❌ ACTION ITEM — choose provider for state compliance |
| 21 | Geo-blocking for non-compliant states | ❌ ACTION ITEM — implement or verify per-state |
| 22 | Apply for CCBill / payment processor | ❌ ACTION ITEM — requires several items above |
| 23 | Physical 2257 record storage | ❌ ACTION ITEM — filing system at real address |

**Score: 13/23 built — 10 require business/legal action**

### Action Items (with decisions needed)

**1. Form LLC** — Pick a state: Delaware (cheap, private), Nevada (no state income tax), Wyoming (low fees, popular for adult biz), or your home state for simplicity. Cost: $50–$300. Can do this week.

**2. Get EIN** — No decision needed. Free on IRS.gov, 10 minutes. Just need the LLC filed first.

**3. Hire attorney** — Budget $2,000–$5,000 for initial consultation. Need adult entertainment specialist to answer money transmitter question, review TOS/Privacy, and bless the overall structure. This is the gatekeeper for most other items.

**4. Designate Custodian of Records** — Decide: you personally, or a registered agent? Federal inspectors can show up unannounced at the listed address during business hours. Options: home address, rented office, or registered agent with document storage. Update placeholder in `Compliance.jsx`.

**5. Register DMCA Agent** — Pick who (you, your attorney, or a service). Registration is $6 on copyright.gov. Update placeholder in `DMCAPolicy.jsx`.

**6. Money transmitter evaluation** — Attorney's call. The underlying decision: do you hold user funds (tokens) and pay out performers directly? If yes → likely a money transmitter (FinCEN + state licenses). If you route everything through CCBill and never touch money → might avoid it. Your token model ($0.10 in, $0.055 out) is the question.

**7. Third-party age verification provider** — Pick a provider: AgeChecker.net (most popular with adult sites, ~$0.10–$0.50/check), Yoti (facial age estimation, no ID needed), Jumio (government ID scan), VerifyMy (privacy-preserving). Integrate into `AgeGate.jsx` to replace self-declaration.

**8. Geo-blocking strategy** — Decide: verify or block? You can geo-block the 25 states with strict laws (like Pornhub does) instead of implementing per-state verification. Or verify everywhere with a third-party provider. Ties directly to #7. Implement in `AgeGate.jsx` or a new middleware.

**9. Apply for payment processor** — Pick: CCBill (industry standard for adult), Segpay, Epoch, or crypto-only (USDT/USDC via TronLink — doesn't eliminate money transmitter question). You already designed for CCBill. Apply after LLC + 2257 compliance + age verification are in place.

**10. Physical 2257 record storage** — Decide where: home office, rented office, or registered agent with document storage. Need a fireproof filing cabinet at the Custodian address. Same address as #4. Printed/stored performer ID records must be available for unannounced federal inspection.

### Unlock Order
1. **Pick LLC state → file → get EIN** (can do this week, under $300)
2. **Hire attorney** → answers money transmitter question, reviews legal docs
3. **Pick Custodian address** → update Compliance.jsx → set up physical storage
4. **Register DMCA agent** → $6, 10 minutes once you have a name
5. **Pick age verification provider** → integrate into AgeGate.jsx
6. **Apply for CCBill** → needs LLC + compliance in place

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
| **S18** | **Legal Compliance** | **Age gate, TOS, Privacy Policy, DMCA page, Cookie consent, trafficking reports, legal footers** |
