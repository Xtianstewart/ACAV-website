#!/usr/bin/env node
// SEO render checks for phoenixavstaffing.com — the exact checks AgentX can
// rerun at PR review (docs/seo-buildout-spec.md, Job 1 item 5).
// Usage: node scripts/check-seo.mjs   (exit 0 = all pass, 1 = any failure)
// Checks the files in the working tree (static site, no build step):
//   index.html  canonical exactly once and correct; exactly one <h1>;
//               JSON-LD parses; ProfessionalService + Service types present;
//               no review/rating markup.
//   _headers    X-Robots-Tag: noindex block for each of the four PDFs.
//   robots.txt  does not block the PDFs; keeps the Sitemap reference.
//   sitemap.xml fresh per the generator; every URL canonical apex, no PDFs,
//               no crew subdomain.
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let failures = 0;
const pass = (msg) => console.log(`PASS  ${msg}`);
const fail = (msg) => { failures++; console.log(`FAIL  ${msg}`); };
const read = (p) => readFileSync(join(root, p), 'utf8');

// --- index.html -------------------------------------------------------------
const html = read('index.html');

const canonicals = [...html.matchAll(/<link\s+rel="canonical"\s+href="([^"]+)"/g)].map((m) => m[1]);
if (canonicals.length === 1 && canonicals[0] === 'https://phoenixavstaffing.com/') {
  pass('canonical: exactly one, https://phoenixavstaffing.com/');
} else {
  fail(`canonical: found ${JSON.stringify(canonicals)}`);
}

const h1s = [...html.matchAll(/<h1[\s>]/g)].length;
if (h1s === 1) pass('exactly one <h1> on the homepage');
else fail(`<h1> count is ${h1s}, expected 1`);

const ldBlocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1]);
let types = new Set();
let ldOk = ldBlocks.length > 0;
for (const b of ldBlocks) {
  try {
    const walk = (o) => {
      if (Array.isArray(o)) return o.forEach(walk);
      if (o && typeof o === 'object') {
        if (o['@type']) (Array.isArray(o['@type']) ? o['@type'] : [o['@type']]).forEach((t) => types.add(t));
        Object.values(o).forEach(walk);
      }
    };
    walk(JSON.parse(b));
  } catch { ldOk = false; }
}
if (ldOk) pass(`JSON-LD parses (${ldBlocks.length} block${ldBlocks.length === 1 ? '' : 's'})`);
else fail('JSON-LD missing or unparseable');
if (types.has('ProfessionalService') && types.has('Service')) {
  pass('schema types include ProfessionalService + Service');
} else {
  fail(`schema types found: ${[...types].join(', ') || 'none'}`);
}
if (!/AggregateRating/.test(html) && !types.has('Review')) {
  pass('no review/rating markup');
} else {
  fail('review/rating markup present (site displays no reviews)');
}

// --- Homepage retarget (Job 2 PR 1, applied 2026-10-29) ----------------------
if (html.includes('<title>Phoenix AV Labor &amp; Event Staffing Crews | ACAV LLC</title>')) {
  pass('retarget: title is "Phoenix AV Labor & Event Staffing Crews | ACAV LLC"');
} else {
  fail('retarget: homepage title does not match the Job 2 PR 1 target');
}
if (html.includes('<meta name="description" content="Phoenix AV labor and event staffing crews: stagehands, technicians and production support for corporate events, concerts and conventions, valleywide."')) {
  pass('retarget: meta description matches the Job 2 PR 1 target');
} else {
  fail('retarget: meta description does not match the Job 2 PR 1 target');
}
if (html.includes('>Phoenix AV labor and event staffing.<span class="hero-ready">Show-ready.</span>')) {
  pass('retarget: H1 opens "Phoenix AV labor and event staffing." + "Show-ready."');
} else {
  fail('retarget: H1 does not match the Job 2 PR 1 target');
}

// --- _headers ---------------------------------------------------------------
const headers = read('_headers');
const pdfs = [
  'ACAV-Client-Labor-Service-Agreement.pdf',
  'ACAV-Independent-Contractor-Agreement.pdf',
  'ACAV-Sole-Proprietor-Waiver.pdf',
  'W9-blank.pdf',
];
for (const pdf of pdfs) {
  const block = new RegExp(`^/${pdf.replace(/\./g, '\\.')}\\s*\\n\\s*X-Robots-Tag:\\s*noindex`, 'm');
  if (block.test(headers)) pass(`_headers: X-Robots-Tag noindex on /${pdf}`);
  else fail(`_headers: missing noindex block for /${pdf}`);
}

// --- robots.txt ---------------------------------------------------------------
const robots = read('robots.txt');
const blocked = pdfs.filter((pdf) => new RegExp(`Disallow:\\s*/${pdf.replace(/\./g, '\\.')}`).test(robots));
if (blocked.length === 0) pass('robots.txt does not block the PDFs (noindex stays visible to Google)');
else fail(`robots.txt blocks: ${blocked.join(', ')}`);
if (/^Sitemap:\s*https:\/\/phoenixavstaffing\.com\/sitemap\.xml/m.test(robots)) {
  pass('robots.txt keeps the Sitemap reference');
} else {
  fail('robots.txt Sitemap reference missing');
}

// --- sitemap.xml --------------------------------------------------------------
try {
  execFileSync(process.execPath, [join(root, 'scripts/generate-sitemap.mjs'), '--check'], { stdio: 'pipe' });
  pass('sitemap.xml is fresh (matches the generator output)');
} catch {
  fail('sitemap.xml is stale — run: node scripts/generate-sitemap.mjs');
}
const sitemap = read('sitemap.xml');
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (locs.length > 0) pass(`sitemap lists ${locs.length} URL${locs.length === 1 ? '' : 's'}`);
else fail('sitemap lists no URLs');
for (const loc of locs) {
  if (!loc.startsWith('https://phoenixavstaffing.com/')) fail(`sitemap URL is not canonical apex: ${loc}`);
  if (loc.toLowerCase().endsWith('.pdf')) fail(`sitemap URL is a PDF: ${loc}`);
  if (loc.includes('crew.')) fail(`sitemap URL is the crew subdomain: ${loc}`);
}
if (locs.every((l) => l.startsWith('https://phoenixavstaffing.com/') && !l.toLowerCase().endsWith('.pdf') && !l.includes('crew.'))) {
  pass('every sitemap URL is a canonical apex page (no PDFs, no crew subdomain)');
}

console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
