# AI SEARCH READINESS — phoenixavstaffing.com ready for ChatGPT business profiles and AI search

Item: AI search readiness. One PR (this one). Marco's order of work
(2026-11-08): this PR goes first; PR-A (cache headers in `_headers`) is
queued after it and is NOT part of this PR.

Ask of record (Christian, 2026-11-08): OpenAI is close to launching
"Claim your business in ChatGPT" — a verified business profile inside
ChatGPT. Have phoenixavstaffing.com ready for it and for AI search
generally. Christian's merge gates the PR.

## Facts of record (Christian, 2026-11-08 — the only source; use verbatim)

- Business: ACAV LLC
- Address: 4237 N 11th St, Phoenix, AZ 85014
- Phone: 480-330-0543
- Email: info@phoenixavstaffing.com
- Services: AV labor staffing — stagehands, loaders, breakout techs, LED, lead operators
- Area served: Phoenix metro / valleywide
- Facts must match the Google Business Profile word for word.
- No hours, prices, ratings, or any other fact may be added.

The site's three labor tiers (homepage, exact names): "Tier 1 Basic
Support Labor", "Tier 2 Skilled AV Technicians", "Tier 3 Lead Operators".

## Scope (four items)

1. **robots.txt** — OAI-SearchBot and GPTBot explicitly allowed, not
   blocked. Everything existing (the `*` allow and the Sitemap line)
   stays. If a site blocks OAI-SearchBot it is left out of ChatGPT
   search answers entirely.
2. **Structured data** — one consistent business block on all four pages
   (index.html, av-labor/, av-staffing/, event-staffing-phoenix/)
   carrying the facts of record: full PostalAddress (street, city,
   region, ZIP, country), phone, email, Phoenix-metro area served.
   Existing schema patterns stay (homepage LocalBusiness block, the
   Service pages' provider block, the event page's @graph node).
3. **llms.txt** — new file at the site root: plain-facts summary of
   ACAV (what we do, the three labor tiers by their exact names,
   service area, contact), so AI assistants can cite the business
   accurately.
4. **Service-page sanity check (audit only)** — the four pages' crawlable
   text must state the basics plainly: who (ACAV LLC), what work (AV
   labor / staffing), where (Phoenix). Fix only a clear, plain gap; if
   all pass, change nothing.

## Audit (before any change, main 1eb3998)

- robots.txt was `User-agent: * / Allow: /` plus the Sitemap line — the
  OAI crawlers were allowed only by the wildcard, never named.
- Homepage carried TWO divergent business blocks: the head block
  (LocalBusiness + ProfessionalService, no street address or ZIP,
  statewide areaServed of every Arizona county and city) and a second
  ProfessionalService block near the end of the head (phone in a
  different format, no street address, plus openingHours and priceRange
  — facts not in the record above).
- /av-labor/ and /av-staffing/ carried the business only as a Service
  `provider` stub: name, URL, phone — no email, no address.
- /event-staffing-phoenix/ carried a ProfessionalService @graph node:
  name, URL, phone — no email, no address.
- Item 4 audit: all four pages already state who/what/where plainly in
  crawlable text (title, meta description, H1, and an opening line of
  the form "ACAV LLC is a Phoenix … company"). No gap; no change.

## Change (this PR)

- robots.txt: explicit `User-agent: OAI-SearchBot` and
  `User-agent: GPTBot` blocks, each `Allow: /`, ahead of the existing
  wildcard block; Sitemap line unchanged.
- index.html: the head business block gains streetAddress + postalCode;
  its description and areaServed now state the Phoenix-metro facts of
  record; the duplicate second business block is removed, so the
  homepage has exactly one business block. The OfferCatalog tier
  entries are untouched.
- av-labor/index.html, av-staffing/index.html: the provider block gains
  email, the full PostalAddress, the Phoenix-metro areaServed, and the
  shared phone format (+1-480-330-0543, as on the homepage).
- event-staffing-phoenix/index.html: the @graph business node gains
  email, the full PostalAddress, the Phoenix-metro areaServed, and the
  shared phone format.
- llms.txt: new, per item 3.
- scripts/check-seo.mjs: new AI-search block (15 checks) pinning the
  robots allows, the llms.txt facts, and the business-block facts on
  all four pages.

## Acceptance

- `node scripts/check-seo.mjs` — full harness passes, including the 15
  new AI-search checks.
- The PR opens and stops. Christian merges; nothing deploys from the
  branch alone.

## Out of scope

- PR-A (cache headers in `_headers`), fonts, images — later PRs.
- Cloudflare, DNS, and crawler settings outside robots.txt. Block AI
  bots / Bot Fight Mode are never enabled on this site (Christian's
  standing call).
