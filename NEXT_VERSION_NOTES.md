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

## Churches lander — one-stop reposition (2026-09-30)

- Aaron direction: lead as **one-stop shop for churches** (programs/events + **own giving** + **check-in** + store). Sit-beside / “not a Planning Center replacement” framing removed from hero and mid-page; one quiet afterthought only (“If you already have church software…”).
- Explicit church event names: life groups, camps, VBS, conferences, classes, sports, midweek.
- School + church overlap retained as supporting section.
- Do not claim worship planning or deep pastoral CRM.
- Notes: `CHURCHES_COMPETITIVE_NOTES.md` updated with People vs Worship ChMS summary + new direction.
- CSS cache on churches page: `?v=20260930v`. Preview via GitHub Pages only — not IIS/`www.annasis.com`.

## Cross-segment partner page (2026-09-30)

- Added shared secondary page `partner.html` — **Why partner with ANNASIS** / How we partner.
- Themes: partner trust, customer-first, features & roadmap transparency, automation vision, reduced operations complexity. Voice works for Churches, Camps, Store, Events, and Schools (school OS as one context among programs/communities). Soft CTA → `contact.html`.
- Segment body CTAs rewired off school Fit/Different:
  - `churches.html`: hero + mid-page + bottom ghost CTAs → `partner.html` (primary still Request a conversation → contact).
  - `camps.html`, `ecommerce.html`, `events.html`: added primary conversation + ghost How we partner.
- Main nav **What makes us different** / **Are we a fit?** unchanged (school-focused).
- Quiet footer link **How we partner** on segment landers + standard school pages (index, about, contact, different, fit, stories, education). Not in main nav.
- Sitemap: added `partner.html`, `camps.html`, `churches.html`. CSS cache `?v=20260930w` on touched pages.
- Preview: GitHub Pages only — not IIS/`www.annasis.com`.

## Churches lander — event management + Church Planning hero (2026-09-30)

- Aaron feedback: messaging must make **event management** explicit (conferences, large events, multi-session programs — not only life groups/camps/VBS).
- New hero visual: `Images/church-planning-hero.jpg` (Church Planning artwork; subtitle Planning, Check-in, Giving, Fundraising, Store & Events). Replaces `Images/hero-events.jpg` on `churches.html` hero + og/twitter. Nav logo (`Images/nav-logo.jpg`) unchanged.
- Copy: hero H1/lead, events pillar, ministry calendar, conferences card, fit signals, and bottom CTA name event management / conferences clearly. `partner.html` Churches & camps blurb adds a brief event-management/conferences mention.
- CSS cache on touched pages: `?v=20260930x`. Preview via GitHub Pages only — not IIS/`www.annasis.com`.

## Camps lander + cookie consent (2026-09-30)

- Expanded `camps.html` from “coming soon” stub to full segment lander mirroring `churches.html` quality/structure (hero, what you get, camp season, school+church+camp overlap, fit cues, CTAs).
- Research notes: `CAMPS_COMPETITIVE_NOTES.md` (CampBrain, UltraCamp, CampMinder themes + ANNASIS unique VPs + Aaron feature-gap validation table).
- Positioning: **one-stop camp management** — lead Registration, **Camp Store**, Attendance, Fundraising; Staff/Medical phrased as forms / health-info collection / program ops (no CampMinder EHR / Cabinizer claims). Quiet afterthought only if camp already has specialty software. Primary CTA `contact.html`; secondary `partner.html` (not Fit/Different).
- Hero: `Images/camp-management-hero.jpg` (attached Camp Management artwork) for hero + og/twitter. Nav logo unchanged.
- CSS cache `?v=20260930y` on marketing HTML.

### Cookie consent restore (sitewide)

- Restored pre-live pattern from `/workspace/cookie-consent.js` + consent-gated Apollo into next-version `js/`:
  - `js/cookie-consent.js` — home-only modal (5s), Accept/Decline → `localStorage` `annasis_cookie_consent`; Accept loads Apollo; popup styles inlined. Fallback path updated to `js/apollo-tracker.js` (was `assets/`).
  - `js/apollo-tracker.js` (+ hashed twin) — **no longer auto-loads on every visit**; exposes `annasisLoadApollo` and starts only after Accept (or prior accepted consent). Keeps Blazor `enhancedload` re-init when already loaded.
- Removed unconditional `<script src="js/apollo-tracker…">` from `<head>` on all public HTML pages.
- Added `<script src="js/cookie-consent.js?v=20260930y" defer></script>` before `</body>` on: `index.html`, `about.html`, `camps.html`, `churches.html`, `contact.html`, `different.html`, `ecommerce.html`, `education.html`, `events.html`, `fit.html`, `partner.html`, `pricing.html`, `stories.html`.
- Behavior matches packaged install notes: modal home-only; other pages include script so tracking runs after home Accept without showing the modal again.
- Preview via GitHub Pages only — not IIS/`www.annasis.com`.

## Fundraising capabilities — sponsor invites + round-up (2026-09-30)

- Aaron-confirmed capabilities woven into next-version marketing copy (no other fundraising features invented):
  1. **Sponsor invites** — families, staff, etc. invite sponsors for events, students, campers (and similar).
  2. **Round-up** — round-up on purchases drives additional giving (store/checkout).
- Pages updated:
  - `camps.html` — fundraising pillar names sponsor invites for campers + round-up; camp store card notes round-up at checkout.
  - `churches.html` — giving pillar names sponsor invites for events/participants + round-up; store card notes round-up.
  - `events.html` — new “Fundraising beside registration” section (sponsor invites for attendees + round-up when payments/store run).
  - `education.html` — donations module expands sponsor invites + round-up on school store; store module mentions round-up.
  - `index.html` — light parenthetical in foundation modules lead.
  - `ecommerce.html` — lead mentions round-up + sponsor invites adjacency; link to donations module.
  - `partner.html` — light Churches & camps blurb mention.
- CSS cache on touched pages: `?v=20260930z`. Competitive notes appended on camps/churches.
- Preview via GitHub Pages only — not IIS/`www.annasis.com`.
- `partner.html` — promoted **event management**, **conferences**, and ministry/program events into the hero, customer-first, roadmap, and Simpler operations messaging; CSS cache bumped to `?v=20260930aa`.

## Events page hero artwork (2026-10-01)

- Added Aaron’s Event Management artwork as `Images/event-management-hero.jpg`.
- `events.html` now uses the artwork in the hero, Open Graph, and Twitter image metadata; the nav logo remains `Images/nav-logo.jpg`.
- Kept existing sponsor-invite and round-up copy unchanged; hero copy remains limited to the event-registration claims already present.
- CSS cache on `events.html`: `?v=20261001a`.
- Preview via GitHub Pages only — not IIS/`www.annasis.com`.

## Partner page customer partnership hero (2026-10-01)

- Added Aaron’s Customer Partnership artwork as `Images/customer-partnership-hero.jpg`.
- `partner.html` now uses the artwork in the hero, Open Graph, and Twitter image metadata; the nav logo remains `Images/nav-logo.jpg`.
- Lightly aligned the hero kicker/H1 to “Customer partnership” and a trusted, future-oriented partner while retaining the existing events/conferences messaging.
- CSS cache on `partner.html`: `?v=20261001b`.
- Preview via GitHub Pages only — not IIS/`www.annasis.com`.
