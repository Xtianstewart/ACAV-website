#!/usr/bin/env node
// Render checks for the Terms / Privacy / Crew Ready opt-in proof pages
// (docs/terms-privacy-tfv-spec.md). AgentX can rerun at PR review.
// Usage: node scripts/check-legal-pages.mjs   (exit 0 = all pass)
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let failures = 0;
const pass = (m) => console.log(`PASS  ${m}`);
const fail = (m) => { failures++; console.log(`FAIL  ${m}`); };
const read = (p) => readFileSync(join(root, p), 'utf8');

function checkPage(path, url, h1Needle, strings) {
  if (!existsSync(join(root, path))) { fail(`${path} missing`); return; }
  const t = read(path);
  pass(`${path} exists`);
  const canon = [...t.matchAll(/<link\s+rel="canonical"\s+href="([^"]+)"/g)].map((m) => m[1]);
  if (canon.length === 1 && canon[0] === url) pass(`${path}: canonical exactly one, ${url}`);
  else fail(`${path}: canonical found ${JSON.stringify(canon)}`);
  const h1s = [...t.matchAll(/<h1[\s>]/g)].length;
  const h1Text = (t.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || '';
  if (h1s === 1 && h1Text.includes(h1Needle)) pass(`${path}: exactly one <h1> ("${h1Needle}")`);
  else fail(`${path}: <h1> count ${h1s}, text "${h1Text.slice(0, 60)}"`);
  for (const s of strings) {
    if (t.includes(s)) pass(`${path}: verbatim string present — "${s.slice(0, 52)}…"`);
    else fail(`${path}: MISSING verbatim string — "${s.slice(0, 52)}…"`);
  }
  if (t.includes('href="/terms"') && t.includes('href="/privacy"')) pass(`${path}: footer links to /terms and /privacy`);
  else fail(`${path}: footer links missing`);
}

checkPage('terms/index.html', 'https://phoenixavstaffing.com/terms', 'Terms of Use', [
  'Effective date: November 11, 2026',
  '1. Acceptance of these terms',
  '2. Who we are',
  '3. Services and separate agreements',
  '4. Text messaging (ACAV Crew Ready)',
  'ACAV operates a text messaging program called ACAV Crew Ready from +1 855-554-0444.',
  'checking the SMS consent box on their profile',
  'READY FULL or READY HALF',
  'reply STOP to end messages. Reply HELP for help.',
  'Consent is not a condition of working with ACAV',
  '5. Acceptable use',
  '6. Intellectual property',
  '7. No warranty; limitation of liability',
  '8. Governing law',
  'laws of the State of Arizona',
  '9. Changes',
  '10. Contact',
  'info@phoenixavstaffing.com · 480-330-0543',
]);

checkPage('privacy/index.html', 'https://phoenixavstaffing.com/privacy', 'Privacy Policy', [
  'Effective date: November 11, 2026',
  '1. What this policy covers',
  '2. Information we collect',
  'your text-messaging opt-in consent and its timestamp',
  '3. How we use it',
  'We do not share, sell, or rent mobile phone numbers or text-messaging opt-in and consent data',
  '4. When we share information',
  'our messaging provider Twilio',
  'We do not sell personal information.',
  '5. Your choices',
  'reply STOP to opt out of Crew Ready messages at any time; reply HELP for help.',
  '6. Data retention and security',
  '7. Children',
  'anyone under 18',
  '8. Changes',
  '9. Contact',
  'info@phoenixavstaffing.com · 480-330-0543',
]);

checkPage('crew-ready/index.html', 'https://phoenixavstaffing.com/crew-ready', 'Crew Ready', [
  'Text me about shifts, schedule changes, and availability check-ins (SMS consent)',
  'type="checkbox"',
  'READY FULL',
  'READY HALF',
  '+1 855-554-0444',
  'Message frequency varies based on your availability status and matching work.',
  'Message and data rates may apply',
  'reply STOP to end messages. Reply HELP for help.',
]);

for (const f of ['index.html', 'av-labor/index.html', 'av-staffing/index.html', 'event-staffing-phoenix/index.html']) {
  const t = read(f);
  const foot = t.slice(t.indexOf('<footer class="contact-footer">'), t.indexOf('</footer>'));
  if (foot.includes('href="/terms"') && foot.includes('href="/privacy"')) pass(`${f}: footer links to /terms and /privacy`);
  else fail(`${f}: footer links missing`);
}

console.log(failures === 0 ? '\nALL LEGAL-PAGE CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
