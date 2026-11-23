#!/usr/bin/env node
// CR-TFV round 2 harness: /crew-ready verifiability fix.
// Checks the two Twilio round-2 items (business email confirmable,
// opt-in form block unmistakable) and that PR #28's consent step is
// unchanged. Run from repo root: node scripts/check-crew-ready-verifiability.mjs
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../crew-ready/index.html", import.meta.url), "utf8");
let pass = 0, fail = 0;
function check(name, ok) {
  if (ok) { pass++; console.log("PASS", name); }
  else { fail++; console.log("FAIL", name); }
}

const boxStart = html.indexOf('<div class="consent-box">');
const brandIdx = html.indexOf('class="form-brand"', boxStart);
const phoneIdx = html.indexOf('<input type="tel"', boxStart);
const checkboxIdx = html.indexOf('<input type="checkbox"', boxStart);
const sentence = "By opting in, you agree to receive text messages (SMS) from ACAV LLC about crew availability, shift confirmations, schedule changes, and crew-request alerts. Message frequency varies. Message and data rates may apply. Reply STOP to opt out at any time. Reply HELP for help.";
const EMAIL = "info@phoenixavstaffing.com";

// Item 2: brand header inside the same block, above the form
check("consent box present", boxStart >= 0);
check("form-brand is inside the consent box", brandIdx > boxStart && brandIdx < phoneIdx);
check("brand header shows ACAV wordmark text", /class="form-brand"><span class="mark">ACAV<\/span>/.test(html));
check("brand header names ACAV LLC", html.slice(brandIdx, phoneIdx).includes("ACAV LLC — Crew Portal Profile"));
check("brand header precedes phone field and checkbox", brandIdx < phoneIdx && phoneIdx < checkboxIdx);

// Item 1: email visible and served unobfuscated (email_off wrapped)
check("email appears in brand header", html.slice(brandIdx, phoneIdx).includes(EMAIL));
const footer = html.slice(html.indexOf("<footer>"));
check("footer contact line carries the email", footer.includes("Contact:") && footer.includes(EMAIL));
const offOpen = (html.match(/<!--email_off-->/g) || []).length;
const offClose = (html.match(/<!--\/email_off-->/g) || []).length;
check("email_off markers balanced (>=3 pairs)", offOpen >= 3 && offOpen === offClose);
check("footer email wrapped in email_off", footer.includes(`<!--email_off--><a href="mailto:${EMAIL}">${EMAIL}</a><!--/email_off-->`));
check("program-basics email wrapped in email_off", html.includes(`<!--email_off-->${EMAIL}<!--/email_off-->`));

// PR #28 consent step unchanged
check("phone field keeps portal attributes", html.includes('<input type="tel" value="+1" placeholder="4805550100" autocomplete="tel" disabled>'));
check("checkbox wording unchanged", html.includes("Text me about shifts, schedule changes, and availability check-ins (SMS consent)"));
check("Addendum A sentence verbatim exactly once", html.split(sentence).length - 1 === 1);
check("Addendum A sentence sits after the consent box", html.indexOf(sentence) > boxStart && html.indexOf(sentence) > checkboxIdx);
check("program copy anchors intact", html.includes("READY FULL") && html.includes("READY HALF") && html.includes("+1 855-554-0444"));

console.log(`\ncheck-crew-ready-verifiability: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
