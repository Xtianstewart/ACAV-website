# SEO Build-Out Spec — ACAV Website (phoenixavstaffing.com)

Status: FINALIZED. Origin: Xtian's brief to Adam (2026-10-29) plus Xtian's ruling answers the same day. This document is the spec of record for the SEO build-out; where any chat summary differs, this file wins.

Workflow (per brief): branch → PR → AgentX reviews → Xtian merges → Cloudflare Pages deploys. Merges are Xtian's.

Hard rule for everything: all content in the raw static HTML. Nothing important injected by JavaScript.

## Job 1 — Technical foundation (one PR)

1. **Canonical — CLOSED AS VERIFIED, no build.** Homepage canonical is already present and correct: self-referencing `https://phoenixavstaffing.com/` (https apex, trailing slash). Verified independently by Adam (repo source) and Xtian (live HTML) on 2026-10-29. Baseline redirects (http-apex and https-www → https apex, one hop) are left alone.
2. **PDF noindex via `_headers`.** Append one block per file to the EXISTING `_headers` file setting `X-Robots-Tag: noindex`:
   - `/ACAV-Client-Labor-Service-Agreement.pdf`
   - `/ACAV-Independent-Contractor-Agreement.pdf`
   - `/ACAV-Sole-Proprietor-Waiver.pdf`
   - `/W9-blank.pdf` (fourth block added by Xtian's ruling — same class: stays downloadable, leaves the index)
   Do NOT block these in robots.txt — Google cannot see a noindex on a blocked URL. robots.txt stays untouched. The files remain publicly downloadable.
3. **Generated sitemap.** Replace the hand-maintained `sitemap.xml` (currently exactly one URL) with one generated from the site's page list (`sitemap-pages.json`) by `scripts/generate-sitemap.mjs`. Approved mechanism (Xtian's ruling): generator script + a GitHub Action that rebuilds the sitemap when the page list changes — the logic lives in the repo where PR review can see it, not in dashboard settings. The sitemap must list ONLY canonical 200-status pages: never the PDFs, never the crew subdomain, never redirected URLs. Homepage is the only page until Job 2 lands.
4. **Homepage schema — CLOSED AS VERIFIED, no build.** Live schema is ProfessionalService + Service + OfferCatalog matching the visible content, with no review/rating markup (none is displayed on the page). Verified by both sides 2026-10-29.
5. **Render checks in the repo.** `scripts/check-seo.mjs` is committed with this PR so AgentX can rerun the exact checks at review: canonical correctness, one H1, schema types + no review markup, the four `_headers` noindex blocks, robots.txt not blocking the PDFs, and sitemap freshness + canonical-only URLs.

Known caveat (for the reviewer): the sitemap Action commits back to `main` on push. If branch protection blocks the Actions bot push, the freshness check in `scripts/check-seo.mjs` is the backstop — run it in any PR that adds or removes a page and include the regenerated sitemap in that PR.

## Job 2 — P0 pages (separate PRs, only after Job 1)

Same design system as the current site — same header, footer, CSS, black-and-white theme. This is NOT a redesign; the homepage keeps its look.

1. **Homepage retarget (copy only, no layout change):** keep the ACAV brand name and core phrases in the title and H1. Retarget toward "AV labor and event staffing, Phoenix." Before/after and the change date recorded in the PR. The before-snapshot is Xtian's (already captured in his Phase 0 baseline: title, meta, H1, canonical, schema state) and is passed with the Job 2 go.
2. **NEW `/av-labor/`** — primary intent: AV labor, AV labor companies, subcontract and overflow crew. Audience: production companies and AV vendors who need crew. CTA: request crew.
3. **NEW `/av-staffing/`** — primary intent: AV staffing services, event AV crew. Audience: planners, corporate buyers, venues. Must NOT read like /av-labor/ — different audience, different examples, different CTA (quote request), or Google treats them as duplicates.
4. **NEW `/event-staffing-phoenix/`** — primary intent: event staffing Phoenix, local intent. Audience: local planners and venues. Needs real local proof — Phoenix venues and jobs, supplied by Christian; never text that could be swapped onto any city.

### Pre-merge gate — every page, no exceptions

- Unique title + meta description; exactly one H1 containing the page's primary keyword
- 500+ words of original copy with real ACAV specifics: three labor tiers (Tier 1 basic support $350/day, Tier 2 skilled techs $650, Tier 3 lead operators $1,000 — full-day, estimate-marked as on the current site), 500+ shows crewed, valleywide Arizona coverage, the booking process and turnaround
- Internal links in and out, descriptive anchor text; cross-link the three new pages to each other and the homepage; never the same primary keyword on two pages
- Quote form + click-to-call (480-330-0543) on every page
- Self-referencing canonical; page included in the generated sitemap; valid schema
- Labor-only clarity where relevant: ACAV provides crew and labor, not equipment

### Form + analytics (rides with the Job 2 form work)

- Add a "How did you hear about us?" field to the quote form. Note: the Apps Script relay must pass the new field through or it will not reach the inbox — verify with an end-to-end test submission and note the test in the PR.
- Wire three Umami events, page URL attached to each: `quote_form_submit`, `click_to_call`, `quote_button_click`. Test each one end-to-end and note the test in the PR.

### Proof details

If copy needs proof details Adam does not have (specific venues, past jobs, the turnaround number), flag it in the PR rather than inventing specifics — Christian supplies them with the Job 2 go.

## Out of scope

- The www→apex redirect rule is a Cloudflare dashboard change on Christian's side. Do not touch DNS or Cloudflare settings.
- No redesign, no layout changes to the homepage.

## Verification log

2026-10-29, Adam, against repo `Xtianstewart/ACAV-website` main (7d4a364):

- `index.html`: canonical `https://phoenixavstaffing.com/` present exactly once; exactly one `<h1>`; JSON-LD present with ProfessionalService and Service types; no AggregateRating / Review markup. Umami script present (umami.anidem.net, website ID matches). One inquiry form (Apps Script), fields: name, company, email, phone, event_date, message. Click-to-call `tel:+14803300543` present.
- `_headers`: exists (security headers from PR #4); no X-Robots-Tag yet.
- `sitemap.xml`: exactly one URL (the homepage). `robots.txt`: allow-all + sitemap reference; PDFs not blocked.
- Repo root PDFs: the three agreements + W9-blank.pdf, filenames as listed in Job 1 item 2.
- No build step exists in the repo (pure static) — hence the generator + Action mechanism in item 3.

## Job 1 completion log (2026-10-29)

- PR #13 merged 2026-10-29 (merge commit 015a2c0) and deployed.
- Phase 1 live verification PASSED (AgentX, curl) and independently confirmed (Adam, curl): all four PDFs return `x-robots-tag: noindex` and remain downloadable (HTTP 200); the generated sitemap is live and valid.
- The sitemap workflow file (`.github/workflows/sitemap.yml`) is added by Christian via the web UI (neither connector holds the GitHub workflows permission — 403 on both sides). Until it lands, the freshness check in `scripts/check-seo.mjs` is the enforcement at PR review.
- Remaining Phase 1 item on Christian's side: the www→apex redirect rule (Cloudflare dashboard).

## Job 2 record (added 2026-10-29, from the consolidated brief)

### Approved public claim

"Crew confirmed within 24 hours, guaranteed." — use on the service pages and the local page.

### Venue roster

Venues ACAV has crewed (Christian holds verified proof for every one). Rule: do not shorten, substitute, or add names; for tighter page subsets, pick from this list only.

Phoenix Convention Center · Sheraton Phoenix Downtown · The Phoenician · Fairmont Scottsdale Princess · JW Marriott Camelback Inn · JW Marriott Desert Ridge · Arizona Biltmore · Arizona Grand Resort · Caesars Republic Scottsdale · Sanctuary Camelback Mountain · Four Seasons Resort Scottsdale · Omni Scottsdale Resort & Spa at Montelucia · Omni Tempe · Mountain Shadows Resort · The Scott Resort & Spa · Hotel Valley Ho · W Scottsdale · Andaz Scottsdale · The Global Ambassador · The Camby · Ritz-Carlton · State Farm Stadium · Talking Stick Resort · Wild Horse Pass · Gila River Resorts & Casinos · Hyatt Regency Phoenix · Kimpton Palomar Phoenix · Kimpton Miralina · Tempe Mission Palms · Renaissance Phoenix Glendale · Hilton Phoenix Tapatio Cliffs · Phoenix Marriott Resort Tempe at The Buttes · Scottsdale Marriott at McDowell Mountains · Hilton Scottsdale · DoubleTree Resorts & Suites · Embassy Suites · Sonesta Suites · Hotel Adeline · The Remi · Cambria · SpringHill Suites · Aloft · Courtyard by Marriott · AC Hotel · Westin · The McCormick · SLS — and more; coverage is valleywide across the Phoenix metro.

### Homepage retarget — before-snapshot and record

Before-snapshot, captured live 2026-10-29 (Xtian's Phase 0 baseline; Adam's verification agrees):

- Title: "AV Labor & Event Staffing Crews in Phoenix, AZ | ACAV LLC"
- Meta: "Hire Phoenix AV labor and event staffing crews: stagehands, technicians and production support for corporate events, concerts and conventions valleywide."
- H1 (static text): "Arizona AV labor." + "Show-ready." + rotator
- Canonical: https://phoenixavstaffing.com/ (self-referencing)
- Schema: ProfessionalService + Service + OfferCatalog, no review markup
- Search Console baseline, last 3 months: 6 clicks / 38 impressions, all clicks to the homepage, mobile position 5.6 / desktop 17.4

Retarget applied 2026-10-29 (Job 2 PR 1, copy only — no layout change; og:/twitter: mirror title and meta as before; rotator and "Show-ready." untouched):

- Title: "Phoenix AV Labor & Event Staffing Crews | ACAV LLC"
- Meta: "Phoenix AV labor and event staffing crews: stagehands, technicians and production support for corporate events, concerts and conventions, valleywide."
- H1 (static text): "Phoenix AV labor and event staffing." + "Show-ready." + rotator

### PR 3 — /av-staffing/ (built 2026-10-29)

- Audience: event planners, corporate buyers, venues. Intent: AV staffing services, event staffing, event AV crew.
- Title: "AV Staffing Services in Phoenix, AZ | ACAV LLC" — H1: "AV staffing services for events that run on cue." — CTA: request a quote (hero, tiers, form).
- Framing per Christian's brief: service depth (roles, full event arc, changes absorbed, lead on site), event types, how booking works, insured/professional crew framing.
- Differentiation from /av-labor/ is enforced in checks: this page never says "Request crew" or "call sheet" (that is /av-labor/'s language) and its primary keyword (AV staffing services) is its own.
- Cross-links: /av-staffing/ points to /av-labor/ (production companies) and /event-staffing-phoenix/; the homepage crew section links both service pages; /av-labor/ already links forward here.

### PR 4 — /event-staffing-phoenix/ (built 2026-10-30)

- Audience: event planners, corporate buyers, venues — Phoenix-local intent. First city page; last P0 page of Job 2.
- Title: "Event Staffing in Phoenix, AZ | ACAV LLC" — H1: "Event staffing in Phoenix, handled locally." (primary keyword: event staffing in Phoenix) — CTA: request a quote (hero, form).
- Local proof bar: 500+ words total (page ships ~1,490 in <main>) plus 300+ words of Phoenix-specific copy in the marked #phoenix-proof section (~380 words: Phoenix Convention Center / Third Street, Sheraton Phoenix Downtown, Hyatt Regency Phoenix, Kimpton Palomar Phoenix at CityScape, Arizona Biltmore, Sky Harbor, season and summer-heat operations) that could not be swapped onto another city. Local-proof venues are ONLY the five named in Christian's brief; check-seo.mjs fails the page if any other roster venue appears.
- Approved claims only: 500+ shows crewed; "Crew confirmed within 24 hours, guaranteed."; insured/professional framing as on /av-staffing/. Tiers $350/$650/$1,000, estimate-marked, mirrored from /av-staffing/.
- Schema: ProfessionalService + Service (@graph), no review markup. Form wired as PRs #15/#16 (Apps Script relay, hear_about_us, Turnstile, the three Umami events carrying this page's URL); click-to-call 480-330-0543.
- Cross-links: page links to /, /av-labor/, /av-staffing/; the homepage Crew section's door line now links all three service pages; /av-labor/ and /av-staffing/ already linked forward here.
- Differentiation enforced in checks: unique title/meta/H1 across all four pages; /av-labor/ language ("Request crew", "call sheet") kept out.
- Turnstile is hostname-authorized for phoenixavstaffing.com only, so no preview form test was attempted; the end-to-end form test runs on the live page after merge, as with PRs #15/#16.
