# ANNASIS website — next-version notes

**Status:** Draft only. Not deployed to production `www.annasis.com`.  
**Local work copy:** `/workspace/annasis-next-version` (copied from `/workspace/annasis-website` current-deployed mirror; that mirror was not overwritten).  
**OneDrive:** `AnnaSIS/Website/next-version/`  
**Preview:** GitHub Pages `https://aaronsiebert-ux.github.io/annasis-website/` (draft push; not IIS/Blazor prod).


## Base SIS absorbs Health records + Communication; thumbnails matched (2026-10-07)

- Aaron feedback: thumbnail sizes must match the other cards; drop the Admissions thumbnail; order SIS → Gradebook → Health → Communication; fold Health records and Group communication into Base SIS. Lineup is now **Base SIS + seven modules** (Tuition & billing, School store, Event registration, Donations & fundraising, Athletics eligibility & workflows, Accounting (QuickBooks), Uniform exchange).
- Thumbnails: the Base SIS images now use the same `img.icon` class as every other card (112px desktop / 88px ≤760px; rendered boxes measured identical in headless Chrome). The source PNGs have different white margins, so normalized copies in `Images/pillar/base-sis/annasis-base-sis-{sis,grades,health,communication}-256.png` scale each visible tile to the Tuitions tile (226/256 px, same center). `.pillar-thumbs` = left-aligned vertical stack on desktop, 2×2 grid on mobile. Home Base SIS card shows the same four (48px `home-pillar-icon`, like the other home cards).
- `education.html`: Base SIS copy gains "Parent portal & communication" and "Health records & medical notes" bullets (existing site language); Health Records and Group Communication cards removed (no inbound links to `#health` / `#communication`); renumbered 1–8; h1/leads/metas say seven.
- `index.html`, `different.html`, `stories.html`, `integrations.html`: counts and lists updated; sit-beside lists no longer offer communication/admissions as separate modules (integrations hero lead + "sit beside" lead; different.html sit-beside list).
- `js/annasis-engage.js`: quiz `portal` card removed — "too many logins" now recommends Base SIS; Base SIS card/answer include communication + health; health/communication/what/Current SIS answers updated; support category label "Gradebook / SIS" → "Base SIS / Gradebook" (value unchanged).
- Cache: `app.46zixdbv0d.css?v=20261007c`, `annasis-engage.css?v=20261007c`, `annasis-engage.js?v=20261007c` on all 15 pages.
- Preview GitHub Pages only — not IIS / www.annasis.com.

## Base SIS thumbnails at original size (2026-10-07)

- Aaron feedback: show the Base SIS thumbnails at their original size, stacked vertically.
- `education.html` Base SIS card: `.pillar-thumbs` now stacks the three icons (Admissions, SIS, Gradebook) vertically at 112px each, the same size as `.pillar-row img.icon` on the other module cards. At ≤760px they sit in a wrapping row at 88px each (matches the mobile `.pillar-row img.icon` size).
- Home Base SIS card was already at the home card icon size (`.home-pillar-icon` 48px, same as the other home cards) — unchanged. Quiz result cards have no icons — unchanged.
- Cache: `app.46zixdbv0d.css?v=20261007b` on all 15 pages.
- Preview GitHub Pages only — not IIS / www.annasis.com.

## Base SIS lineup — twelve itemized modules → Base SIS + nine modules (2026-10-07)

- Aaron decision: bundle **Base SIS** = family record (incl. second campus / multi-campus), Admissions, re-enrollment, Attendance, class schedule, bell schedule, Gradebook, report cards, transcripts, Parent view (family portal), email, text announcements, medical notes, discipline log.
- `education.html`: new first card **1. Base SIS** (`#base-sis`, `.pillar-row--base`) with a thumbnail strip of the absorbed module icons (pillar-01 Admissions, 02 SIS, 03 Grades) and a grouped list using existing site language. Removed cards **Admissions**, **Student Information System (SIS)**, **Learning Management & Gradebook** (anchors `#admissions`, `#sis`, `#grades` had no inbound links). Renamed **Health & Medical Records → Health Records** (medical notes now in Base SIS) and **Communication → Group Communication** (group/team/list email + SMS; family portal + school-wide announcements now in Base SIS; Student locator sentence moved to Base SIS). Renumbered 1–10; kept `#tuitions`, `#health`, `#store`, `#communication`, `#events`, `#donations`, `#workflow`, `#accounting`, `#swap`. h1/lead/listing/meta/og/twitter/ld+json/keywords updated.
- `index.html`: h2 "Base SIS plus nine modules. One family record."; lead rewritten; home grid now Base SIS (3-thumb strip, links `education.html#base-sis`) · Tuition & billing · Events · Athletics eligibility (replaces Admissions + Gradebook cards); metas updated.
- `different.html` (category row + footing paragraph), `stories.html` (household paragraph): lineup lists updated.
- `js/annasis-engage.js`: quiz catalog `admissions`/`sis`/`gradebook` → `basesis`; full-OS result body + modules; `portal` card → "Parent portal & group communication"; chat: new `basesis` topic; admissions/gradebook/health/communication/what answers say which parts live in Base SIS.
- `app.46zixdbv0d.css`: `.pillar-row--base`, `.pillar-thumbs`, `.base-sis-list`, `.home-pillar-thumbs` (+ ≤760px rule).
- Cache: `app.46zixdbv0d.css?v=20261007a`, `annasis-engage.css?v=20261007b`, `annasis-engage.js?v=20261007b` on all 15 pages.
- Left as-is (flag for Aaron): generic "admissions, grades, and tuition" on Events/Store/Camps/Churches; support category "Gradebook / SIS"; sit-beside lists mentioning "communication" / "Parent communication"; fit.html generic module copy.
- Preview GitHub Pages only — not IIS / www.annasis.com.

## OneRoster supported today (2026-10-07)

- Aaron decision: **OneRoster is supported (done)** — treat as a current capability, not roadmap. Supersedes the 2026-10-05 "Capability Catalog lists OneRoster as ROADMAP" correction below.
- `integrations.html` "For the data-minded / How roster data travels" lead now reads: “OneRoster is the common standard many SIS packages use to share student, Faculty, and class rosters. ANNASIS supports OneRoster today — standards-based roster sharing so classes and enrollments flow cleanly to your LMS and sign-on tools, directly from the SIS or through Clever or ClassLink. We confirm the path with each school’s vendors during onboarding.”
- Anna chat (`js/annasis-engage.js`) Roster data answer updated to the same wording. Matches the Enterprise proposal template (Integrations & Ecosystem section) and its "We support OneRoster interfaces" bullet.
- Other "roadmap" mentions (partner.html, about.html, stories.html, chat implementation-support keywords) are about the general product roadmap, not OneRoster — unchanged.
- Cache: `annasis-engage.js` / `.css` `?v=20261007a`. Preview GitHub Pages only — not IIS / `www.annasis.com`.

## Anna support chip wording (2026-10-06)

- Customer-status **Yes** chip: changed from “Yes — my school or organization uses ANNASIS” to **“Yes — we use ANNASIS software”** (ANNASIS all caps). School/organization remains the required form field label — only the Yes chip (and related Support page path headings) were softened.
- Support page: path card “We use ANNASIS software”; form section “For ANNASIS customers”; Parents card points to “the support form below.”
- Cache: `annasis-engage.js` / `.css` `?v=20261006c`. Preview only.

## Support page + Ecosystem naming (2026-10-06)

- Added `support.html` (preview only): three paths for Parents / families, schools & organizations using ANNASIS, and people evaluating ANNASIS. School/org path includes a short support form (`[data-annasis-support-form]`) that posts through `ANNASIS_LEAD.submit` with `type: "support"` (same Pipedrive/webhook path as chat). No dedicated support inbox yet — copy says the team follows up by email. **TODO:** add `support@annasis.com` in `CONFIG.support.email` (and page copy) when Aaron confirms that inbox.
- School footers only: insert **Support** before Stories · About (Stories and About stay last). Not in top header. Segment footers (events / camps / churches / ecommerce) unchanged. `pricing.html` still has no standard footer.
- Anna chat (`js/annasis-engage.js`): `urls.support = 'support.html'`; Support FAQ / Get support / fallback can link `{ label: 'Support', href: U.support }`.
- Naming: visible **"Education Ecosystem"** → **"Ecosystem"** sitewide (kickers, in-page links, meta on `integrations.html`). Top nav stays **Integrations**; footer stays **Ecosystem**. No new naming invented.
- Cache: `annasis-engage.css` / `annasis-engage.js` `?v=20261006b`. Preview GitHub Pages only — not IIS / `www.annasis.com`. Do not deploy the Pipedrive lead Worker in this pass.

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

## Anna chat fixes + guided Pricing / Support + lead webhook (2026-10-06)

### Bug: "Take the fit quiz" link in Anna's chat did nothing — root cause + fix
- **Root cause:** the chat widget is appended to `<body>`, *outside* the site's `<div class="site-shell" data-enhance-nav="false">`, so Blazor's enhanced navigation (`_framework/blazor.web.*.js`) intercepted the chat's `fit.html#fit-quiz` link. The static preview doesn't answer with `blazor-enhanced-nav: allow` (IIS does), so Blazor "falls back" with `history.replaceState(url + "?")` + `location.replace(url)` — and with a `#hash` that is only a same-document fragment change, which re-triggers enhanced nav: an endless loop. The address bar showed `fit.html#fit-quiz` but the page never loaded and the chat stayed open. On IIS/Blazor the enhanced nav would succeed but swap `<body>`, so the chat re-opened from sessionStorage over the quiz. Also the fit.html hero button used `href="#fit-quiz"`, which with `<base href="./">` resolves to the home page.
- **Fix (js/annasis-engage.js):** `#ae-chat` carries `data-enhance-nav="false"` (same convention as the site shell); every quiz link/button inside the chat — new replies, restored history, typed "quiz" — is handled by one click handler: close the chat (saved as closed), then scroll on fit.html or do a full page load to `fit.html#fit-quiz`. Arriving at fit.html with `#fit-quiz` (or sent by Anna) keeps the chat closed, starts at question 1 (or shows this session's result with *Retake the quiz*), and focuses the first question — re-applied after the browser's own scroll-to-anchor (which otherwise moves focus to the page). Off fit.html Anna shows a clear **Start the quiz →** button. fit.html hero button now `href="fit.html#fit-quiz"`.
- On the Blazor site use `/fit#fit-quiz` (set `urls.quiz`). Page links inside `.site-shell` were not affected.

### Chat changes
- Quick replies: What is ANNASIS? · Does it work with my current SIS? · **Events** · **Camps** · School store · Pricing · Take the fit quiz · Book a demo · **Get support** (Events & camps split; Events answer no longer carries the camps sentence).
- **Pricing** (chip or typed): Anna asks what they use today (multi-select: the quiz tool list incl. FACTS / RenWeb, ClassReach, Sycamore, Gradelink, Alma, Veracross … + "Something else / not sure"), what they are (Private school / Event or conference organizer / Camp / Church / Store or program shop), and rough size (quiz size bands), then gives the existing pricing answer (no prices) and opens the sales form. Payload adds `currentTools`, `orgType`, `size`, `intent: "pricing"`.
- **Get support** (chip + keywords support, help, login, password, can't log in, broken, error, bug, refund, charge, billing issue, account, ticket, not working …): "Are you an ANNASIS customer?" (Yes — we use ANNASIS software / I'm a Parent or family member / Not yet / not sure) → category (Login / account access, Billing or payment, Registration or event, Store / order, Gradebook / SIS, Something else) → form: what's going on + name, email, school/org, optional phone → `ANNASIS_LEAD.submit` with `type: "support"`. Parents are told their school office is usually the fastest help for grades, balances, and schedules (reminded again for Billing / Gradebook). Single-word ties go to product answers ("ticket" alone → Events ticketing, "logins" → family portal); "open a ticket", "support ticket", "can't log in" go to support.
- **Support contact:** none published on www.annasis.com or in the site files (only sales@annasis.com). `support.email` / `support.url` in the config are empty with a TODO; Anna says "The ANNASIS team will follow up by email." Fill them in to have Anna mention them.

### Lead webhook payload (flat JSON, `ANNASIS_LEAD.submit`)
POSTed to `lead.endpoint` as `Content-Type: text/plain;charset=UTF-8` (a "simple" CORS request — no preflight); body is JSON. Default `fetchMode: 'cors'` reads the status (the Worker sends CORS headers, so a Pipedrive failure → contact-page fallback); `fetchMode: 'no-cors'` for hooks without CORS headers (opaque response = success). Network failure, timeout (10 s), or non-2xx → contact.html with a copy-ready summary. No endpoint → contact.html (current behaviour).

| Field | Type | Notes |
|---|---|---|
| `type` | string | `sales` or `support` |
| `source` | string | `fit-quiz` or `chat` |
| `name`, `firstName`, `lastName` | string | first/last split from name |
| `email`, `phone` | string | phone optional |
| `role` | string | sales form role; `Parent` for Parent support requests |
| `organization` | string | school / organization |
| `orgType` | string | e.g. `Private school`, `Camp` |
| `size` | string | e.g. `150–400 Students`, `Under 250 families or participants` |
| `currentTools` | string[] | labels, e.g. `["FACTS / RenWeb","QuickBooks"]` |
| `pains` | string[] | quiz "What hurts most" labels |
| `plan`, `timeline` | string | quiz answers (labels) |
| `recommendation` | string | quiz result title |
| `modules` | string[] | suggested modules |
| `topics` | string[] | chat topics visited |
| `supportCategory` | string | support only |
| `message` | string | support description |
| `leadTitle` | string | e.g. `Website fit quiz – <org>`, `Website pricing (Anna) – <org>`, `Website chat (Anna) – <org>`, `[Support] <category> – <org>` |
| `noteText` | string | pre-formatted, human-readable note with everything above + page/UTM |
| `pageUrl`, `landingPage`, `referrer` | string | |
| `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `gclid` | string | first page of the session |
| `submittedAt` | string | ISO 8601 (UTC) |
| extras | | `intent` (`pricing` / `support` / ''), `customerStatus` (support), `questions` (typed chat questions, last 5), `website` (honeypot — always '' from real visitors) |

All keys are always present (empty string / empty array when unknown).

- **Testing override:** `?ae_endpoint=<https url>` sets the endpoint for that tab (sessionStorage) **only on `aaronsiebert-ux.github.io`**; ignored everywhere else (incl. www.annasis.com); removed from the address bar; `?ae_endpoint=off` clears it.
- `tools/test-lead-webhook.sh <url>` posts one sample sales + one support payload (text/plain, `Origin` = preview; override with `ORIGIN=`).

### Pipedrive receiver: `tools/pipedrive-lead-worker/`
Cloudflare Worker (`worker.js`, `wrangler.toml`, `README.md` with non-developer deploy steps, `test.mjs` unit tests with mocked Pipedrive). Sales → find-or-create Organization (name) + Person (email; org, phone, job title) → Lead (`leadTitle`) + Note (`noteText`). Support → Org + Person → `[Support]` Note on person/org + Task activity `[Support] <category> – <org>` (no Lead). Validates honeypot, required fields, Origin allowlist (annasis.com, www.annasis.com, aaronsiebert-ux.github.io), CORS. Token = Worker secret `PIPEDRIVE_API_TOKEN` (never committed); optional `PIPEDRIVE_DOMAIN`. **Not deployed**; `lead.endpoint` is still empty.
- Cache-bust: `annasis-engage.(js|css)?v=20261006a` on all 14 pages.
