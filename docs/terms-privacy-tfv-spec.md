# Terms / Privacy / Crew Ready opt-in proof — TFV unblock spec

Tasking: AgentX in #adam-and-x 2026-11-11, relaying Christian (reported as a
relay). Build authorized by Marco in Xtian HQ 2026-11-11 ~09:42 MST.
Purpose: Twilio toll-free verification (TFV) for the Crew Ready number
+1 855-554-0444 is saved as a draft and blocked on three public URLs.

## Deliverables (one PR)

1. `/terms` — Terms of Use §§1–10, ACAV LLC, effective November 11, 2026.
   Copy is Christian-approved and published VERBATIM; only formatting
   follows site conventions.
2. `/privacy` — Privacy Policy §§1–9, same provenance, verbatim.
3. Footer links to /terms and /privacy on the homepage and the three
   service pages, so the URLs are stable and public:
   https://phoenixavstaffing.com/terms and
   https://phoenixavstaffing.com/privacy
4. `/crew-ready` — public opt-in proof page showing the Crew Ready opt-in
   as a freelancer sees it: the Portal profile SMS consent checkbox with
   its exact copy ("Text me about shifts, schedule changes, and
   availability check-ins (SMS consent)" — src/pages.js in the portal
   repo), the enable-by-keyword step (READY FULL / READY HALF to
   +1 855-554-0444), and the program basics (frequency varies, message
   and data rates may apply, STOP / HELP).

## FLAG — opt-in proof domain

AgentX specified the proof page at crew.phoenixavstaffing.com/crew-ready
(the Crew Portal domain/repo). This PR is in the website repo, so the
page ships here as https://phoenixavstaffing.com/crew-ready. The domain
difference is flagged in the PR proof and the Discord post — not silently
substituted. If Christian wants the crew-subdomain URL exactly, the same
page can be added to the portal repo as a follow-up PR.

## Non-goals / gates

- No other site content changes. Sitemap gains /terms/ and /privacy/
  only (generator-run).
- Ships no live sending; CREW_READY_ENABLED stays false in the portal.
- Merges are Christian's. This PR stops at open; AgentX verifies.
- The three URLs go live only on merge + Cloudflare Pages deploy.

## Verification

- `node scripts/check-seo.mjs` — the existing site harness, must pass.
- `node scripts/check-legal-pages.mjs` — new harness in this PR: checks
  the three new pages exist, each carries its full approved copy
  (section headings + key verbatim strings), exactly one <h1> and a
  self-referencing canonical per page, footer links present on all four
  existing pages, and the opt-in page shows the exact consent copy, the
  keyword step, and STOP/HELP.

## Twilio Worker secret NAMES (names only — Christian sets values)

Determined from the portal code (src/sms-twilio.js, src/crew-ready.js,
wrangler.toml comments): TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN,
TWILIO_MESSAGING_FROM. CREW_READY_ENABLED is a wrangler [vars] config
var (currently "false"), not a secret.
