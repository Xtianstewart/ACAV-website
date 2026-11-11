# Font weight fix — IBM Plex Mono 600 → 500 (Refinement spec §1.3, Option B)

**Status:** Built 2026-11-10 on Marco's tap. Decision: Christian's pick of
Option B, relayed by AgentX 2026-11-09 23:44 MST (a relay, recorded as such).
**Repo:** Xtianstewart/ACAV-website · **Base:** main a326a2ab (post-PR #25)

## The defect (Step 0 font audit, 2026-11-06)

All 4 pages share one Google Fonts request: Barlow Condensed 400/500/600/700 ·
IBM Plex Mono **400/500** · Metal Mania 400 (7 files, 148,239 B per page).
Three CSS rules per page nevertheless request IBM Plex Mono at weight **600**,
which is never loaded — those labels fall back to the 500 file (plus browser
synthesis). §1.3's prescribed trim had nothing to trim; the audit surfaced this
missing weight instead, and because loading it would visibly change type, the
choice was Christian's:

- **Option A** — load the real 600 (+1 font file ≈ +15 KB per page); labels
  render bolder, as the CSS originally asked.
- **Option B** — change the CSS to 500. Zero visual change (labels already
  render at 500 today — the approved look), zero added page weight.

Christian picked **B**. Option A remains available later as the same small PR.

## Exact scope (verified rule-by-rule against current main)

Per page, exactly 3 declarations change, 600 → 500:

1. `.stat-label` — `font: 600 13px/1.2 "IBM Plex Mono", monospace`
2. `.scope-copy h3` (base layer) — `font: 600 12px/1.3 "IBM Plex Mono", monospace`
3. `.scope-copy h3` (override layer) — `font-family: var(--font-label)` with
   `font-weight: 600` — the rule that actually wins the cascade for those
   headings, so it must change too.

× 4 pages (index, av-labor, av-staffing, event-staffing-phoenix) = **12
declarations**. Diff is exactly 3 lines per page.

## Explicitly untouched

- The Google Fonts request (Mono stays 400/500; no new file is loaded).
- Every Barlow Condensed 600 rule (600 IS loaded for Barlow — nav links,
  marquee, tier levels, headings).
- `.event-row .mark`'s Barlow Condensed `font-weight: 300` rule — also an
  unloaded weight (renders as 400 today), but the A/B question put to
  Christian covered Mono only. Noted here as a possible one-line follow-up,
  not silently folded into this PR.

## Acceptance

- Harness (`node scripts/check-seo.mjs`): all prior checks still pass, plus 3
  new `font-500:` checks — no mono rule at 600 anywhere; the 3 target rules
  read 500 on all 4 pages; the Fonts request is byte-identical.
- Zero visual change by construction: rendered weight before and after = 500.
- Gates: AgentX verifies (Gate 2), Christian merges, Adam runs Gate 3 live
  (fetch the 4 live pages, confirm the 3 rules read 500 and the Fonts URL is
  unchanged).
