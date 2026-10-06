# ANNASIS website — next-version notes

**Status:** Draft only. Not deployed to production `www.annasis.com`.  
**Local work copy:** `/workspace/annasis-next-version` (copied from `/workspace/annasis-website` current-deployed mirror; that mirror was not overwritten).  
**OneDrive:** `AnnaSIS/Website/next-version/`  
**Preview:** GitHub Pages `https://aaronsiebert-ux.github.io/annasis-website/` (draft push; not IIS/Blazor prod).


## Logo caption → micro Who-we-serve (2026-10-05)

- Replaced static header caption **SCHOOL OPERATING SYSTEM** under the logo with compact vertical quick links (all five): **Schools · Events · Store · Camps · Churches**.
- Link targets match footer / mobile “Who we serve”: Schools → `index.html`, Events → `events.html`, Store → `ecommerce.html` (label **Store**), Camps → `camps.html`, Churches → `churches.html`.
- Logo image (and brand name) still link home. Main school nav unchanged. Footer Who we serve unchanged.
- Markup: `.brand` is now a flex container (not a single `<a>`) so nested links are valid; logo uses `.brand-home`; caption is `<nav class="brand-tagline" aria-label="Who we serve">` with `·` separators (`.brand-serve-sep`).
- CSS: muted navy caption size (10px / 9px / 8px breakpoints), orange hover, `flex-wrap` so five links wrap to two lines under the logo on narrow widths instead of dropping Camps/Churches or colliding with the hamburger. Does not look like a second full header.
- Updated all 12 standard-header HTML pages; `pricing.html` has no shared header and was left without this block (CSS cache bumped only).
- CSS cache: `app.46zixdbv0d.css?v=20261005a`. Preview via GitHub Pages only — not IIS/`www.annasis.com`.

## Named competitor-alternative SEO keywords (2026-10-01)

- Added light, page-specific competitor-alternative phrases to `meta name="keywords"` without changing titles or H1s:
  - `camps.html` — CampBrain alternative, UltraCamp alternative, CampMinder alternative.
  - `churches.html` — Planning Center alternative, Breeze alternative, Tithely alternative (for events, giving, check-in, and church-program workflows).
  - `events.html` — Planning Center Registrations alternative; retained existing Eventbrite alternative and Configio alternative.
  - `ecommerce.html` — reviewed existing Shopify for schools alternative and Configio alternative; no thin-gap addition was natural.
- Kept meta descriptions unchanged; existing copy was already natural and avoided keyword stuffing.
- Bumped the shared stylesheet cache on these four pages to `?v=20261001h`.
- Preview via GitHub Pages only — not IIS/`www.annasis.com`.

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

## Events + Store multi-market broaden + school deep links (2026-10-01)

- **School-page deep links** (main nav unchanged; footer Who we serve unchanged):
  - `education.html` — Event registration module → `events.html` (“See Events →”); School store module → `ecommerce.html` (“See Store →”).
  - `index.html` — foundation lead links Events/Store; home Events card CTAs to Events and Store.
  - `fit.html` — Events and Store pain answers link to the segment landers.
- **`events.html` rewritten** for multi-market readers (schools, camps, church programs, convention/event managers) — not school-only. Sections: hero, what you get (registration/ticketing, check-in & scheduling, exhibitors where honest, fundraising with sponsor invites + round-up), who runs events, overlap, fit signals, next step. Kept `Images/event-management-hero.jpg`, contact primary / partner secondary, header/footer/cookie pattern.
- **`ecommerce.html` rewritten** to matching quality — institutional store for schools, camps, churches, event programs. Hero uses existing `Images/hero-ecommerce.jpg`. Round-up + sponsor adjacency retained; Event add-ons cross-link to Events.
- Meta titles/descriptions updated for multi-market discovery SEO.
- CSS cache on touched pages: `?v=20261001c`.
- Preview via GitHub Pages only — not IIS/`www.annasis.com`.

## Events custom workflows + complex scenarios (2026-10-01)

- Strengthened `events.html` hero and metadata to lead with **configurable event registration** for complex programs, conferences, and calendars.
- Added a dedicated **Custom workflows** section covering multi-session programs, paid/free ticket types, forms and waivers, check-in details, and exhibitor/add-on paths; approval language is tied to the configurable forms/clearances workflows already described elsewhere on the site.
- Did not claim waitlists or other unconfirmed event-specific depth; exact fit remains a sales conversation.
- CSS cache on `events.html`: `?v=20261001d`.
- Preview via GitHub Pages only — not IIS/`www.annasis.com`.

## Education intro gap fix (2026-10-01)

- Merged the two stacked `.section` blocks under “Success broken down.” so the foundation-module paragraphs sit in the same section as the H2 (removes the double section padding that created a large vertical gap).
- Kept `.education-lead-spaced` for paragraph spacing inside that section.
- CSS cache on `education.html` was bumped with that fix (`?v=20261001d`); superseded by the mobile-nav cache bump below.

## Mobile hamburger nav parity + Who we serve (2026-10-01)

- Audited every marketing HTML page: `desktop-nav` main items already matched `#mobileNav` (Twelve modules, What makes us different, Stories, Are we a fit?, About) plus Contact CTA / LinkedIn in `mobile-nav-actions`. `pricing.html` intentionally has no standard header/footer/nav.
- Desktop main nav remains school-focused (no Events/Camps/Churches in main nav).
- Added a clean mobile-only subsection `.mobile-nav-serve` on all standard pages (not pricing): **Who we serve** → Schools, Events, Store, Camps, Churches, plus **How we partner** — mirrors footer discoverability inside the hamburger without changing desktop-nav.
- CSS: label + stacked ≥44px taps; sits between main links and Contact CTA. Cache bust `app.46zixdbv0d.css?v=20261001e` sitewide.
- Preview via GitHub Pages only — not IIS/`www.annasis.com`.

## Remove cookie-consent gate; restore automatic Apollo tracking (2026-10-01)

- Removed `js/cookie-consent.js` and its sitewide inclusion; no cookie Accept/Decline modal, modal HTML, or consent-gated modal CSS remains.
- Restored the automatic Apollo tracker on every marketing HTML page via `js/apollo-tracker.xg91sm7mp7.js`; it loads without an acknowledgment gate and reinitializes on Blazor enhanced navigation.
- Did not add a delayed home-only modal or any replacement consent UI.
- Bumped the shared stylesheet cache on all marketing HTML pages to `app.46zixdbv0d.css?v=20261001f`.
- Preview via GitHub Pages only — not IIS/`www.annasis.com`.

## SEO optimization — customer discovery (2026-10-01)

- **Canonical / OG host choice:** absolute intended-production URLs `https://www.annasis.com/{path}` (clean paths: `/`, `/education`, `/events`, `/ecommerce`, `/camps`, `/churches`, `/partner`, etc.). GitHub Pages remains preview only; crawlers of the draft should not treat Pages as the canonical host. Live today often uses apex `https://annasis.com` — align www vs apex + 301s on prod deploy.
- **Fixed:** relative canonicals/og:url/og:image/twitter:image → absolute www; `sitemap.xml` absolute locs + priorities including camps/churches/partner; `robots.txt` Sitemap → `https://www.annasis.com/sitemap.xml`.
- **JSON-LD:** Organization + WebSite on `index.html`; lightweight WebPage on key landers.
- **Discovery:** footer Who we serve + mobile nav already linked segments; home Events/Store CTA row also links Camps/Churches. Home segment strip remains removed.
- **Other:** unique H1 on `pricing.html`; trimmed education description; slightly shorter events title; CSS `?v=20261001g`.
- **Audit checklist for Aaron:** `SEO_AUDIT_2026-10-01.md` (what fixed vs Search Console / prod-only steps).
- Preview push to `aaronsiebert-ux/annasis-website` only — **not** IIS / `www.annasis.com`.

## Fundraising progress use cases — Twelve modules (2026-10-04)

- On `education.html` module 9 (Donations & fundraising), kept sponsor invites and store round-up and added short school use cases: a scale of dollars raised vs goal, class/team/campaign rankings (school drive, not a pressure pitch), and percent to goal on a campaign, student, team, or event page.
- Did not change camps, churches, events, or store landers. Preview via GitHub Pages only — not IIS/`www.annasis.com`.


## School operating system messaging — retire “school in a box” (2026-10-05)

- Aaron approved Bobby’s messaging lines (primary framing: **school operating system**). Removed all visible “school in a box” / “school-in-a-box” HTML copy; image file `Images/school-in-a-box.jpg` kept (filename only).
- `about.html`: lead now reads “The solution was to create a school operating system — one platform from admissions to events, the school store, and athletics.” (replaces the long module list; Parents/Students/Faculty customer sentence kept). H3 “School in a box” → “One operating system”; card opens “Run the school on one platform.”; image alt → “One operating system — everything you need on one platform”.
- `different.html`: compare cell → “School operating system — twelve foundation modules”; hero lead adds “— run the school on one platform”; “When you are ready” card H3 → “Sit beside what you have — or replace it when you are ready” (body and “Jog before you run” unchanged).
- `index.html`: “The system” section H2 → “Twelve modules. One family record.”
- No CSS change, so no `?v=` cache bump. Preview via GitHub Pages only — not IIS/`www.annasis.com`.

## School SEO — add LMS for discovery (2026-10-05)

- Aaron: include Learning Management System (LMS) in school-page SEO where it was missing (previously LMS only appeared in Different body comparison: “SIS or LMS that later adds finance”).
- Framing: SOS-first; keep SIS for market search; LMS as **alternative / not-just-another** category SEO — not claiming ANNASIS is “an LMS product” as the headline (glossary: do not lead with LMS parity).
- Updated school pages only: `index.html`, `education.html`, `different.html`, `fit.html`, `about.html`, `stories.html` (meta description; titles on home/education/different; keywords; OG/twitter; JSON-LD description/name where they duplicated the same strings).
- Did not touch camps/churches/events/store segment landers. No CSS/`?v=` bump. Preview via GitHub Pages only — not IIS/`www.annasis.com`.

## School Integrations / OneRoster page (2026-10-05)

- New `integrations.html` — OneRoster-first migration story for private schools (preview + next-version trees only; **not** production www).
- Honest framing: ANNASIS ingests OneRoster direct or via Clever/ClassLink; aggregators optional/paid; no partnership badges.
- Vendor captions from Apollo + public research (FACTS native API; Alma school-enabled; Veracross API Plus; Sycamore confirm; Blackbaud EM 1.1; Rediker TeacherPlus path; Gradelink via Clever only; Jupiter Clever/SFTP; ClassReach proprietary CSV).
- Logos: Clever PNG + ClassLink SVG/PNG under `Images/integrations/`; other vendors use text cards (official brand assets not cleanly obtainable).
- Wired: footer Integrations link on school pages; CTA on education.html; link on fit.html; sitemap entry `https://www.annasis.com/integrations`.
- CSS: `.integration-logo-grid` responsive; cache `?v=20261005b`.

## Integrations page revision — "works with your stack" (2026-10-05, later)

- Aaron feedback: original page was too migration-oriented and OneRoster-heavy. Rewritten as **complementary / coexist**: ANNASIS runs alongside the existing SIS, LMS, rostering hubs, and QuickBooks; "pick your favorite LMS"; grow into fuller suite when the office is ready.
- Product-truth correction: Capability Catalog lists OneRoster / public API as **ROADMAP** (and the OneRoster requirements doc says ANNASIS does not yet import OneRoster). The old "ANNASIS can ingest OneRoster" claim was removed; OneRoster now appears only in a light "For the data-minded" note as roadmap + onboarding-scoped handoff.
- Bands: Connected today (QuickBooks, Google Workspace, Microsoft 365 — LIVE per catalog INT-01..04) → Pick your favorite LMS (Google Classroom, Canvas, Schoology, Microsoft Teams) → Sign-on/rostering (Clever, ClassLink, Planbook w/ ClassLink caveat; Seesaw/Nearpod/Edpuzzle/Kahoot compact tiles) → Already have an SIS? (FACTS/RenWeb, Alma, Veracross, Sycamore, Blackbaud EM, Rediker, Gradelink, Jupiter, ClassReach — compact logo tiles, secondary).
- Logos for every vendor shown, under `Images/integrations/` (vendor sites or Wikimedia Commons; see commit/report). Removed unused `classlink.png`. Directory-style "works with" marks with non-endorsement footnote; no partnership claims.
- education.html + fit.html teasers reframed from "Coming from another SIS / OneRoster" to "works with your school stack".
- CSS: integrations block rewritten (larger white logo wells, 4-up LMS grid, compact tile grid); cache `?v=20261005c` on all pages.

## Fit quiz + Anna chat assistant + lead capture (2026-10-05)

- **New, self-contained (portable to IIS/Blazor):** `js/annasis-engage.js` + `css/annasis-engage.css` (all classes `.ae-*`), `Images/anna-bot-avatar.png` (Anna avatar copied from the existing Pipedrive LeadBooster playbook — botName "Anna", mainColor `#1855AA`, greeting "Welcome to our website!").
- Included on all 14 pages: `<link rel="stylesheet" href="css/annasis-engage.css?v=20261005e" />` in head and `<script src="js/annasis-engage.js?v=20261005e" defer></script>` after `js/annasis.p3i6rixraw.js`. Re-inits on Blazor `enhancedload`.
- `fit.html`: hero button "Take the 2-minute fit quiz" + new `#fit-quiz` section (six questions, progress bar, tailored result, Talk with Sales lead form). Existing pain checklist unchanged. `index.html` Are we a fit?: added ghost "Take the fit quiz" button.
- `contact.html` (no markup change): when arriving from the quiz/chat, JS shows a copy-ready summary above the Pipedrive web form (cross-origin iframe cannot be prefilled).
- **Config at top of the JS** (or `window.ANNASIS_ENGAGE_CONFIG` override): `chatEnabled` (default true), `leadboosterMode` (default false; true = hide our chat and show LeadBooster Anna; values `companyId 13851722`, `playbookUuid fe7940be-…` already in `js/annasis.js`), `anna.*`, `nudgeDelayMs` (20000, once per session), `urls.*` (relative `.html` for preview — set `/fit`, `/contact`, … for Blazor), `lead.endpoint` (empty = fallback to contact.html; set to a Zapier/Make/server webhook to create Pipedrive Person + Organization + Lead + Note — never put a Pipedrive token in client JS).
- While our chat is on, the LeadBooster bubble is hidden with CSS (`.ae-hide-leadbooster #LeadboosterContainer`), so the two never show together. `js/annasis.js` was not modified.
- Preview via GitHub Pages only — not IIS/`www.annasis.com`.
