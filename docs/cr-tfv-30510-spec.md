# CR-TFV-30510 — Crew Ready opt-in example: mobile number field with the SMS consent checkbox

Item: CR-TFV-30510 (+ Addendum A), tasked by AgentX (Christian via AgentX) 2026-11-19.
Built by Muse Wonder on Marco's go, 2026-11-19. One PR on Xtianstewart/ACAV-website.
Merge is Christian's.

## Context

Twilio rejected the Crew Ready toll-free verification (round 2) for +1 855-554-0444.
Remaining code 30510 — opt-in example incomplete (Twilio Support ticket #30416626, Julie):
the opt-in process must collect the end user's phone number as part of the consent step,
and the public proof page https://phoenixavstaffing.com/crew-ready has to show that.
The other round-2 code, 30482 (submission email field), is Christian's Twilio-console
side and is NOT part of this PR.

## Case determination (portal inspection first)

CASE 1 APPLIES — the portal already collects the number, so this PR changes only the
public /crew-ready page. No portal form change, no save-path change.

Evidence (ACAV-crew-portal, main):
- `src/pages.js` — the profile form carries a required "Phone (US)" field
  (`<input id="p-phone" required value="+1" placeholder="4805550100" autocomplete="tel">`)
  on the SAME form as the SMS consent checkbox (`id="p-sms"`, wording "Text me about
  shifts, schedule changes, and availability check-ins (SMS consent)").
- `src/profile.js` — the profile save normalizes the phone to E.164 (+1XXXXXXXXXX)
  and stores it on the freelancer profile together with `sms_consent`.

## Change (crew-ready/index.html only, plus this spec and the check harness)

Step 1 of /crew-ready now mirrors the portal profile form's consent step:

1. A mobile phone number field — labeled "Phone (US)", a tel input prefilled "+1"
   with the portal's placeholder — shown in the same consent box as the checkbox.
2. The SMS consent checkbox with its exact portal wording, unchanged:
   "Text me about shifts, schedule changes, and availability check-ins (SMS consent)".
3. This consent sentence, added verbatim on the page directly under the form
   (Addendum A — the TFV registration's additional-information text already quotes
   the page as stating it):

   "By opting in, you agree to receive text messages (SMS) from ACAV LLC about crew availability, shift confirmations, schedule changes, and crew-request alerts. Message frequency varies. Message and data rates may apply. Reply STOP to opt out at any time. Reply HELP for help."

The Step 1 heading and the sentence after the form are reworded only to describe the
number field + checkbox together. CSS adds a tel-input rule scoped to the consent box
(the old generic input rule would have shrunk the tel field to checkbox size).

## NOT changed

All other approved program copy stays as-is: keywords (READY FULL / READY HALF),
message types, STOP/HELP language, frequency language, the +1 855-554-0444 number,
Step 2, Program basics, footer, /terms, /privacy. The example fields stay disabled,
exactly as the checkbox was before — the page is a proof example, not a working form.

## ACCEPT

- Live /crew-ready visibly shows a branded, legible consent step with the mobile
  number field and the SMS consent checkbox together on the same form.
- The Addendum A consent sentence appears on the page verbatim.
- Case reported: Case 1 (portal already collects the number; it saves to the profile).

## Proof / verification

- `node scripts/check-crew-ready-optin.mjs` — the 30510 harness (this PR).
- `node scripts/check-legal-pages.mjs` — the PR #27 harness, must stay green.
- `node scripts/check-seo.mjs` — the site SEO harness, must stay green.
