# MASTER HARNESS — Spec for Agent X Review
Prepared by Adam (Marco's Muse), 2026-10-30. Requested by Xtian 11:14 MST:
"Send the spec whenever you're ready and X will review it section by section —
harness gateway/gate, ledger dual-write, dashboard, and page inventory."
Rulings already applied from Xtian's 11:14 message: /av-staffing/ and
/event-staffing-phoenix/ are their own pages (not homepage copies); lead capture
dual-write as planned; pricing NOT locked (starter reprice ~$2,499, card-price
clause on power, re-price parts at order time).

REVISED 2026-10-30 (PR #18 update) — answering Agent X's three blocking items:
§5 page inventory refreshed for merged PRs #16/#17/#19/#20; §3 dual-write
field set pinned against the PII boundary; §1/§4 GET-endpoint auth gating
specified. Spec text only — no build starts from these edits.

## 1. Harness Gateway (REVIEW SECTION)
- Workflow: HARNESS — Master Gateway, Tower n8n id `cAXx9C7hMF5fcFGC`, 9 nodes, PUBLISHED 2026-10-30.
- Endpoints: `POST /webhook/harness/event`, `GET /webhook/harness/ledger`, `GET /webhook/harness/dashboard`.
- **Auth gating (added 2026-10-30, answering Agent X's §1/§4 block).** The
  prototype's GET endpoints are acceptable today for exactly one reason: the
  ledger holds only fake test rows (IDs 1–5, source `test-harness`). Before
  any real event of any type is wired — and before the dual-write in §3 fires
  a single live `lead` event — the following are hard requirements, not
  options:
  - `GET /webhook/harness/ledger` and `GET /webhook/harness/dashboard` require
    a shared-secret header (`X-Harness-Key`); missing/wrong key returns 401
    with no payload. The dashboard is never a public URL.
  - The key lives in the Secure Vault / client config, never in the workflow
    export, the repo, or this spec; it rotates per client install.
  - `POST /webhook/harness/event` keeps its validation AND gains the same key
    requirement at the same gate — a public POST that writes ledger rows is
    the same exposure as a public GET that reads them.
  - Until the gate is in and verified live (401 without key, 200 with key),
    the gateway stays test-only. This gating change itself is a workflow edit
    on Tower and follows the standing rule: publish/execute only on Marco's
    word.
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

**Field set (pinned 2026-10-30, answering Agent X's §3 block).** The form's
fields are: Name · Company (optional) · Email · Phone (optional) · Event date
(optional) · "How did you hear about us?" (select) · "What do you need?"
(message) · Turnstile token.
- **Relay only (system of record, Xtian's Google side) — never fired to
  Marco's Tower:** Name, Company, Email, Phone, and the free-text message.
  This is inquiry PII plus a prospect's free text; the standing boundary
  (inquiry PII never touches Marco's Tower without Xtian's explicit approval)
  covers all five, with no exceptions for partial fields.
- **Harness `lead` event (Tower prototype / Marco's box) may carry only:**
  page route, timestamp, `hear_about_us` value, event date, a relay receipt
  reference (no content), Turnstile `verified: true/false`, and field-presence
  flags (which optional fields were filled — names only, never values).
  That is enough for the ledger to count, reconcile against Umami submits,
  and stamp `follow_up_lead` — and nothing in it identifies a person.
- **On a real client install** (the harness running on the client's own box,
  the actual product shape), the full field set may ledger on that box,
  because the data never leaves the client's hardware. The restricted set
  above applies specifically to ACAV-as-Client-Zero while the gateway sits
  on Marco's Tower. If Client-Zero hosting moves to ACAV's own box (blueprint
  Q5), the full set unlocks with Xtian's say-so recorded in the PR.

## 4. Dashboard (REVIEW SECTION)
- Access: gated per §1 (shared-secret header, 401 otherwise). The dashboard
  renders only after auth; there is no public or demo mode with real rows.
- `GET /webhook/harness/dashboard` renders the ledger as it stands: when,
  type, source, summary, status, next action — real rows only, empty state
  says so. Client installs reskin this page per client (their systems as
  nodes); prototype is the plain table rendering of the same payload.

## 5. Page inventory (REVIEW SECTION)
From REA + manual teardown, 2026-10-30, refreshed post-merge 2026-10-30
(full detail: acav-migration-blueprint.md):
- Existing and live: `/` (homepage, retargeted — title "Phoenix AV Labor &
  Event Staffing Crews", tiers $350/$650/$1,000), `/av-labor/` (PR #15),
  `/av-staffing/` (PR #16, merged 2026-10-30 11:52 — planner/corporate
  counterpart to /av-labor/, tiers renamed Essential / Production / Show
  Crew), `/event-staffing-phoenix/` (PR #20, merged 2026-10-30 13:25,
  live-verified 200 with its own title and self-canonical; 376 words of
  Phoenix-specific proof per Agent X's check, the 5 approved venues only).
  Both former BUILD items are now built, merged, and live — the P0 page set
  is closed (Xtian, 2026-10-30 13:27).
- Sitemap: `sitemap.xml` now serves 4 URLs and auto-regenerates via the
  PR #19 workflow (merged 2026-10-30 12:48). www→apex redirect created in
  Cloudflare, curl-verified on all four variants — Phase 1 closed.
- Also existing: 4 root PDFs, crew portal (external, not migrated), Dropbox
  file-request link (external).
- One inquiry form ×4 pages → one Apps Script endpoint; Turnstile on every
  form (hostname-authorized only); Umami single website ID, event
  `quote_form_submit`; strict CSP (form-action/connect-src) — extending it
  for the harness endpoint is a deliberate, reviewed change.
- Open questions remaining in the blueprint: relay downstream detail,
  Turnstile staging approach, Client-Zero hosting location, canonical Umami
  host, PDF set currency. (www behaviour is now answered — see above.)
- Next build after this spec clears: portal branded templates + instant
  signing. Indexing requests for the P0 URLs are Xtian's Search Console item.

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
