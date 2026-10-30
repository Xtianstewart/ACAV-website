# MASTER HARNESS — Spec for Agent X Review
Prepared by Adam (Marco's Muse), 2026-10-30. Requested by Xtian 11:14 MST:
"Send the spec whenever you're ready and X will review it section by section —
harness gateway/gate, ledger dual-write, dashboard, and page inventory."
Rulings already applied from Xtian's 11:14 message: /av-staffing/ and
/event-staffing-phoenix/ are BUILD items (not homepage copies); lead capture
dual-write as planned; pricing NOT locked (starter reprice ~$2,499, card-price
clause on power, re-price parts at order time).

## 1. Harness Gateway (REVIEW SECTION)
- Workflow: HARNESS — Master Gateway, Tower n8n id `cAXx9C7hMF5fcFGC`, 9 nodes, PUBLISHED 2026-10-30.
- Endpoints: `POST /webhook/harness/event`, `GET /webhook/harness/ledger`, `GET /webhook/harness/dashboard`.
- Event types: lead, email, money, inventory, crm. Every event is validated
  (money requires numeric amount; inventory requires numeric qty), ledgered,
  and stamped with a next action. Ledger = workflow static data, capped 500
  rows (prototype); production schema in build/ledger-schema.sql.
- Verified live with fake events (2026-10-30 10:51): all 5 types ledgered
  (IDs 1–5, source `test-harness`), invalid money event rejected with reason,
  ledger endpoint counts exact, dashboard serves all rows.
- Source of truth for behavior: build/harness-core.js + build/n8n/harness-gateway.json.

## 2. The Gate (REVIEW SECTION)
- Workflow: HARNESS — The Gate, Tower n8n id `JdkUXQW6GMkMEtnP`, 3 nodes, PUBLISHED.
- Endpoint: `POST /webhook/harness/evaluate`. Input = REA/sandbox findings as
  booleans; output = score /100, hard fails, recommendation.
- Rubric: REA-probed 25, no undisclosed outbound 25, sandbox passed 20,
  deterministic behavior 15, known provenance 15. Pass ≥ 80 AND zero hard fails.
- Hard fails (deny regardless of score): requests credentials outside the
  vault, undisclosed telemetry, attempts to execute/publish/move money
  without human approval.
- The gate NEVER admits: `admitted` is always false in code; a human approves.
- Verified live: clean candidate 100 → "ALLOW — pending human approval";
  gate-bypasser → DENY despite a 100 rubric score. (First publish attempt
  didn't register the webhook; re-publish + restart fixed it — verified after.)

## 3. Ledger dual-write (REVIEW SECTION)
For ACAV (Client Zero): the inquiry form keeps posting to the existing
Google Apps Script relay as PRIMARY, exactly as today, and in parallel fires
the harness `lead` event. If the harness call fails, the form still succeeds
via the relay — no migration step can break inquiry flow. Rollback = repoint
to the original deployment, kept untouched/warm ≥ 30 days. Daily 72h watch
reconciles Umami submits vs relay receipts vs ledger count.
Full design: acav-migration-blueprint.md §4–§5.
Standing boundary: inquiry PII never touches Marco's Tower without Xtian's
explicit approval — the Tower gateway holds only fake test rows today.

## 4. Dashboard (REVIEW SECTION)
- `GET /webhook/harness/dashboard` renders the ledger as it stands: when,
  type, source, summary, status, next action — real rows only, empty state
  says so. Client installs reskin this page per client (their systems as
  nodes); prototype is the plain table rendering of the same payload.

## 5. Page inventory (REVIEW SECTION)
From REA + manual teardown, 2026-10-30 (full detail: acav-migration-blueprint.md):
- Existing: `/` (homepage, tiers $350/$650/$1,000), `/av-labor/` (live-verified
  distinct), 4 root PDFs, crew portal (external, not migrated), Dropbox
  file-request link (external).
- One inquiry form ×3 pages → one Apps Script endpoint; Turnstile on every
  form (hostname-authorized only); Umami single website ID, event
  `quote_form_submit`; strict CSP (form-action/connect-src) — extending it
  for the harness endpoint is a deliberate, reviewed change.
- BUILD items (Xtian ruling 2026-10-30): `/av-staffing/` (planner/corporate
  counterpart to /av-labor/) and `/event-staffing-phoenix/` (first local
  page; also briefed separately as SEO Job 2 PR 4).
- Open questions remaining in the blueprint: relay downstream detail,
  Turnstile staging approach, Client-Zero hosting location, canonical Umami
  host, www behaviour, PDF set currency.

## 6. Pricing status (for X's flagging, per Xtian)
Costed 2026-10-30 (package-boms.md, dated sources): Pkg 1 at $2,000 = $125.28
margin (6.3%) and current-gen GPU busts it → reprice ~$2,499. Pkg 2 (proposed
$5,000 mid) = $1,683.86 (33.7%). Pkg 3 at $10,000 = $437.33 (4.4%), hostage to
RTX 5090 street price → card-price clause. NOTHING in this spec treats the
old $2k/$10k figures as final; BOMs re-priced at order time.

## Review asks
Section-by-section comments from Agent X on §§1–5, flags on §6 assumptions,
and answers/referrals on the blueprint's remaining open questions. No build
starts from this spec until review lands and Marco + Xtian say go.
