# CR-TFV Round 2 — /crew-ready verifiability fix

Source: Twilio TFV review round for +1 855-554-0444. Email from Twilio
(Isa Bell, Digital Sales) landed 2026-11-23, relayed by AgentX in
#adam-and-x (msg 1574454294105686017). Two items, both about
verifiability. Prior round: CR-TFV-30510 / PR #28 (merged, Gate 3
verified, TFV resubmitted 2026-11-20, ticket #30416626).

## Item 1 — Business email could not be confirmed

Reviewer: the submitted address info@phoenixavstaffing.com "could not
be confirmed as an official contact."

Findings:
- The address IS plain text in the page's Program basics list, but the
  live page serves it Cloudflare-email-obfuscated, so a reviewer (or
  any non-JS reader) cannot read it in the served HTML.
- The /crew-ready footer carried no email address at all.

Fix (this PR):
- A visible contact line in the page footer: "Contact:
  info@phoenixavstaffing.com" (mailto link, address as link text).
- The same address appears in the new form brand header (Item 2).
- Every copy of the address on the page is wrapped in Cloudflare's
  `<!--email_off-->...<!--/email_off-->` markers so Cloudflare serves
  it as plain, readable text instead of obfuscating it. This is the
  in-page alternative to a Cloudflare Configuration Rule (dashboard
  change, Christian's side, not needed if this works).

## Item 2 — Opt-in example screenshot cropped / "no opt-in form shown"

Reviewer: the submitted screenshot was cropped and hard to read, and
neither page "shows an opt-in form." The form elements are all present
in the HTML (verified live by AgentX): Phone (US) field, unchecked SMS
consent checkbox, Addendum A consent sentence verbatim, Privacy Policy
+ Terms links.

Fix (this PR):
- Inside the existing `.consent-box`, as its first element, a brand
  header: the ACAV wordmark (site brand font, real text) plus
  "ACAV LLC — Crew Portal Profile · info@phoenixavstaffing.com".
- One screenshot of the block now captures, together: business name/
  logo, business email, phone field, consent checkbox, and (directly
  under the box, unchanged) the consent sentence.

## NOT changed

- No program copy: keywords, message types, STOP/HELP, frequency
  wording all untouched.
- Phone field, consent checkbox wording, and the Addendum A consent
  sentence are byte-identical to PR #28's merged version; the sentence
  stays directly under the consent box.
- No portal change. No other page changes.

## ACCEPT

- Live /crew-ready shows the ACAV LLC brand header directly above the
  phone field inside the same consent block.
- Live /crew-ready shows a visible contact line carrying
  info@phoenixavstaffing.com, and the served HTML
  (`curl -s https://phoenixavstaffing.com/crew-ready | grep info@`)
  shows the plain address (not the obfuscated form).
- scripts/check-crew-ready-verifiability.mjs passes, and the PR #28
  harness (check-crew-ready-optin) still passes unchanged.
