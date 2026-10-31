# P2 DROPBOX — audience-split File Request links (website half: CLIENT)

Item: P2 DROPBOX, portal closeout. One item, two PRs (this PR is the website
half; the crew half lands in ACAV-crew-portal, branch `portal/dropbox-split`).

Decision of record (Christian, 2026-10-30 23:09 MST): clients stay on the
Dropbox route. No client build in the portal — the client flow lives here,
on the website. Per that decision the two halves live in different places:

- CREW link (portal PR, freelancer portal documents hub):
  https://www.dropbox.com/request/vj7oa495v65678ea6juj
- CLIENT link (this PR, the website's client documents section):
  https://www.dropbox.com/request/zacdkzym1pe91e9689fm
- Label, byte-exact on both surfaces:
  "Prefer to handle it offline? Download your agreements as PDFs, sign them, and upload your signed copies here."

## Audit (before any change, main 237ad99d)

- The client documents section EXISTS on the homepage: the "For clients"
  section (`id="client-documents-title"`) with the Client Labor Service
  Agreement PDF download and a `document-upload` block.
- The client link was ALREADY present in that block exactly once
  ("Upload completed documents" button). It is NOT duplicated by this PR.
- The verbatim offline label was absent; the upload block's intro line read
  "Signed and ready? Upload your completed agreement here."
- The crew link appeared nowhere on the site (zero hits across all four
  pages) — correct, and now pinned by check so it stays that way.

## Change (this PR)

- index.html: the upload block's intro line is replaced by the byte-exact
  label, so the mandated label directly precedes the (unchanged) client
  upload button. One line changed; the link, the section, and everything
  else are untouched.
- scripts/check-seo.mjs: a P2 DROPBOX block appended in the harness's
  existing style (pass/fail lines, same exit contract), proving the ACCEPT
  lines below on every run.
- This spec.

## ACCEPT lines

1. Client link live in the website's client documents section.
2. The verbatim label rendered on the same surface, byte-exact.
3. Audience split: the crew link appears on NO page of this site; neither
   link nor the label leaks onto /av-labor/, /av-staffing/, or
   /event-staffing-phoenix/.
4. The full existing harness stays green (check-seo counts in the PR body
   are full-harness counts).

Proof: `node scripts/check-seo.mjs` — the new P2 block asserts 1–3 against
the working-tree files; all pre-existing blocks assert 4.

## Scope

Files in this PR: index.html (one line), scripts/check-seo.mjs (one added
block), docs/dropbox-split-spec.md (this file). No new pages, so no sitemap
change. No legal text touched (the agreement PDFs are unchanged binaries).
Nothing else.
