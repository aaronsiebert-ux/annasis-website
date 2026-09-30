# ANNASIS website — next-version notes

**Status:** Draft only. Not deployed to production `www.annasis.com`.  
**Local work copy:** `/workspace/annasis-next-version` (copied from `/workspace/annasis-website` current-deployed mirror; that mirror was not overwritten).  
**OneDrive:** `AnnaSIS/Website/next-version/`  
**Preview:** GitHub Pages `https://aaronsiebert-ux.github.io/annasis-website/` (draft push; not IIS/Blazor prod).

## What changed (Aaron-approved cross-segment links)

1. **Main nav unchanged** — school-only links remain (Twelve modules, What makes us different, Stories, Are we a fit?, About). Events / Camps / Churches were **not** added to main nav.
2. **Home-only quiet strip** — below the header on `index.html`: “Looking for something else?” with links to Events, Store, Camps, Churches.
3. **Sitewide footer “Who we serve”** — Schools (home), Events, Store, Camps, Churches. Added on all pages that use the standard Blazor footer pattern. (`pricing.html` has no standard header/footer and was left unchanged.)
4. **Segment back-links** — on `events.html`, `ecommerce.html`, `camps.html`, `churches.html`: “← ANNASIS for Schools” → `index.html`.
5. **Stub landers** — minimal `camps.html` and `churches.html` (“Coming soon”, school-led tone, link back to home) so footer/strip links do not 404 locally.
6. **CSS** — small additive rules in `app.46zixdbv0d.css` for `.segment-strip`, `.footer-serve`, `.segment-back`. Existing class names and Blazor `b-*` attrs left intact.

## Deploy / web admin

- Deploy to IIS/Blazor production only after **Aaron + web admin** approve.
- Prefer applying the same link blocks in the Blazor source (layout/footer components) rather than only editing static HTML exports, so the next publish regenerates cleanly.
- Do not treat `/workspace/annasis-website` or OneDrive `current-deployed` as the editable source for this change set.

## Files touched in this draft

- Updated: `index.html`, `about.html`, `contact.html`, `different.html`, `ecommerce.html`, `education.html`, `events.html`, `fit.html`, `stories.html`, `app.46zixdbv0d.css`
- Added: `camps.html`, `churches.html`, `NEXT_VERSION_NOTES.md`
- Unchanged: `pricing.html` (no standard footer), assets/Images/js/_framework (copied through)

## Responsive cross-segment UI (2026-09-30)

- Matched existing breakpoints (`1050` / `760` / `520`) used by mobile nav, `.wrap`, and footer.
- `.segment-strip` / `.footer-serve` use `.segment-links` flex nav: wrap on desktop with middot `::after` separators; stack full-width ≥44px tap targets on ≤760px; slightly larger taps on ≤520px. No horizontal overflow (`min-width: 0`, column stack).
- Markup: middot text nodes removed in favor of CSS separators so mobile can hide them.
- CSS cache bust: `app.46zixdbv0d.css?v=20260930r` on all HTML pages.
- Camps/churches stubs verified: standard header/footer + `.segment-back` + stacked footer-serve; no layout break on mobile rules.
- **Nomenclature (Aaron):** Who we serve / strip links = **Schools**, **Events**, **Store**, **Camps**, **Churches** (URLs unchanged: index, events, ecommerce, camps, churches). Stub back-links say “ANNASIS for Schools”.

## Churches lander draft (2026-09-30)

- Expanded `churches.html` from “coming soon” stub to full segment lander (hero, three pillars Events/Store/Fundraising, sit-beside ChMS honesty, school+church overlap, fit cues, CTAs).
- Research notes: `CHURCHES_COMPETITIVE_NOTES.md` (Planning Center, Breeze/Tithely, Tithely Events / Pushpay themes + ANNASIS differentiation from GTM ICP C3).
- Positioning: lead with event registration, store/e-commerce, fundraising; modular sit-beside ChMS — **not** a full Planning Center replacement for worship/media/pastoral CRM.
- Meta title/description updated for church discovery SEO; CSS query on churches page `?v=20260930u` (shared CSS unchanged).
- `camps.html` left as stub (out of scope).
- Preview target: push draft assets to `aaronsiebert-ux/annasis-website` GitHub Pages only — not production IIS/`www.annasis.com`.
