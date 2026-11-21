#!/usr/bin/env node
// Render checks for CR-TFV-30510 (+ Addendum A): the /crew-ready opt-in example
// must show the mobile number field and the SMS consent checkbox together on the
// same form, plus the Addendum A consent sentence verbatim.
// Spec: docs/cr-tfv-30510-spec.md. AgentX can rerun at PR review.
// Usage: node scripts/check-crew-ready-optin.mjs   (exit 0 = all pass)
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let failures = 0;
const pass = (m) => console.log(`PASS  ${m}`);
const fail = (m) => { failures++; console.log(`FAIL  ${m}`); };

const path = 'crew-ready/index.html';
if (!existsSync(join(root, path))) {
  fail(`${path} missing`);
  process.exit(1);
}
const t = readFileSync(join(root, path), 'utf8');
pass(`${path} exists`);

// --- The consent form (Step 1 consent box) -------------------------------
const boxStart = t.indexOf('<div class="consent-box">');
const boxEnd = boxStart === -1 ? -1 : t.indexOf('</div>', boxStart);
if (boxStart === -1 || boxEnd === -1) {
  fail('consent box not found');
  process.exit(1);
}
const box = t.slice(boxStart, boxEnd);
pass('Step 1 consent box present');

// Mobile number field inside the same box, before the checkbox.
const telIdx = box.search(/<input[^>]*type="tel"/);
if (telIdx !== -1) pass('mobile number field (input type="tel") inside the consent box');
else fail('mobile number field (input type="tel") MISSING from the consent box');

if (box.includes('Phone (US)')) pass('phone field carries the portal label "Phone (US)"');
else fail('phone field label "Phone (US)" missing');

if (box.includes('value="+1"') && box.includes('placeholder="4805550100"') && box.includes('autocomplete="tel"'))
  pass('phone field mirrors the portal field (+1 preset, portal placeholder, autocomplete="tel")');
else fail('phone field does not mirror the portal field (+1 / placeholder / autocomplete)');

const cbIdx = box.search(/<input[^>]*type="checkbox"/);
if (cbIdx !== -1) pass('SMS consent checkbox inside the same consent box');
else fail('SMS consent checkbox MISSING from the consent box');

if (telIdx !== -1 && cbIdx !== -1 && telIdx < cbIdx)
  pass('mobile number field appears before the consent checkbox on the same form');
else fail('mobile number field and checkbox are not ordered field-then-checkbox on the same form');

const CHECKBOX_COPY = 'Text me about shifts, schedule changes, and availability check-ins (SMS consent)';
if (box.includes(CHECKBOX_COPY)) pass('checkbox wording is the exact portal wording');
else fail('checkbox wording differs from the portal wording');

// --- Addendum A verbatim consent sentence --------------------------------
const SENTENCE = 'By opting in, you agree to receive text messages (SMS) from ACAV LLC about crew availability, shift confirmations, schedule changes, and crew-request alerts. Message frequency varies. Message and data rates may apply. Reply STOP to opt out at any time. Reply HELP for help.';
const sentenceCount = t.split(SENTENCE).length - 1;
if (sentenceCount === 1) pass('Addendum A consent sentence present verbatim, exactly once');
else fail(`Addendum A consent sentence found ${sentenceCount} times (expected exactly 1 verbatim)`);

if (sentenceCount === 1 && t.indexOf(SENTENCE) > boxEnd)
  pass('consent sentence sits on the page with the Step 1 form (after the consent box)');
else if (sentenceCount === 1) fail('consent sentence is not positioned with the Step 1 form');

// --- Approved program copy unchanged --------------------------------------
for (const s of [
  'READY FULL',
  'READY HALF',
  '+1 855-554-0444',
  'Message frequency varies based on your availability status and matching work.',
  'Message and data rates may apply, depending on your mobile carrier and plan.',
  'reply STOP to end messages. Reply HELP for help.',
  'Consent is not a condition of working with ACAV',
]) {
  if (t.includes(s)) pass(`program copy unchanged — "${s.slice(0, 52)}…"`);
  else fail(`program copy MISSING or changed — "${s.slice(0, 52)}…"`);
}

console.log(failures === 0 ? '\nALL CR-TFV-30510 CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
