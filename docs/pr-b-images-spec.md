# PR-B — Images (spec §3 + §1.2/§1.4): the B1/B2 split

Refinement spec: `docs/` — acav-site-refinement-spec-2026-11-06.md §3, §1.2, §1.4.
Baseline: Step 0 report, 2026-11-06 (duplicate map + per-file inventory).

## Why PR-B split into B1 and B2

The delivery route used for every PR on this repo (GitHub connector
snapshot push) carries **UTF-8 text files only** — it cannot add binary
files and the snapshot route itself cannot delete. PR-B as specced needs
both binaries (WebP variants, resized srcset variants, a generated
1200×630 social crop) and deletions (the duplicate payloads). Marco ruled
the split on 2026-11-09:

- **PR-B1 (this PR)** — everything deliverable as text edits plus the
  connector's `delete_file` tool: §3.1 dedupe and §3.4 loading discipline.
- **PR-B2 (later, needs a binary-capable push route)** — §3.2 WebP
  variants with JPEG fallback, §3.3 responsive `srcset`/`sizes`, and the
  §3.5 1200×630 og:image crop.

## B1 — canonical-file map (§3.1)

Six duplicate payload groups shipped under 16 filenames (Step 0, hashes
verified again at build time). Each group now has ONE canonical file;
every reference (page `<img>`, preload, `og:image`, `twitter:image`,
schema `image`, footer mark) points at it:

| Payload | Bytes | Canonical | Deleted copies |
|---|---|---|---|
| Arena crowd shot (also og/schema image) | 249,512 | `img-01.jpg` | img-03, img-27, img-39, img-40, img-41 |
| LED wall load-in | 533,104 | `img-04.jpg` | img-28 |
| DiGiCo console | 434,678 | `img-06.jpg` | img-30 |
| Confetti crowd (lightbox default) | 424,467 | `img-07.jpg` | img-38 |
| Lighting console | 265,414 | `img-05.jpg` | img-29 |
| ACAV logo lockup | 5,148 | `img-02.webp` | img-37.webp |

Canonical choices: the filename the majority of references already used;
for the arena group, `img-01.jpg` because the homepage preload already
pointed there — the hero `<img>` moved to it, so **preload == hero src**
and the browser downloads the hero payload **once** instead of twice.

Also deleted: `hero-full-throttle.jpg` (148,654 B) — referenced by no
page (Step 0); its only repo mention was a negative check in
`scripts/check-seo.mjs`, which is now an absence assertion.

**Totals: 11 files deleted, 3,059,025 B out of the repo**
(2,910,371 B duplicate payload + 148,654 B unreferenced).

## B1 — loading discipline (§3.4)

- Hero: eager + preload + `fetchpriority="high"` (unchanged), now on the
  canonical file.
- Every below-the-fold content image on all 4 pages now carries
  `loading="lazy"` plus explicit `width`/`height` at the file's real
  pixel dimensions (homepage gallery images previously had neither).
  Gallery CSS (`width/height: 100%` + `object-fit: cover` inside
  aspect-ratio buttons) and the lightbox (`max-*` + `contain`) override
  attribute sizing, so the attributes act purely as the pre-load aspect
  hint — no layout change, CLS stays at the Step 0 baseline of 0.

## Before / after — repo image inventory

| | Files | Total bytes |
|---|---|---|
| Before B1 | 42 | 11,679,669 |
| After B1 | 31 | 8,620,644 |
| Delta | −11 | **−3,059,025 (−26.2%)** |

## Homepage first-load delta (Step 0 method)

Step 0 measured the homepage downloading the 249,512 B arena payload
**twice** above the fold (preload `img-01.jpg` + hero `img-03.jpg`).
B1 removes exactly one of those downloads: **−249,512 B** on homepage
first load. No other first-load bytes change in B1.

## What B1 does NOT do (B2 targets, honestly stated)

- The §1.4 page-weight budgets — homepage first load ≤ 1.2 MB,
  /av-labor/ ≤ 900 KB — are **not met by B1**. First-party homepage
  transfer was ≈1.6 MB at Step 0; B1 brings it to ≈1.35 MB. The
  remaining cut requires the WebP/responsive variants (B2).
- The §3 acceptance target "total image weight on `/` reduced ≥ 50%"
  is likewise a **B2** target: B1 reduces repo image weight 26.2% and
  homepage first-load image bytes by one hero payload (249,512 B of
  ≈1.48 MB). The ≥50% cut lands with B2's variants.
- §3.5's 1200×630 social sizing is B2; B1 only consolidates og:image /
  twitter:image onto the canonical arena file on all 4 pages.
- No copy, no schema fields beyond image URLs, no `_headers`, no fonts
  were touched.
