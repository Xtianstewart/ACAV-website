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
if (html.includes('Phoenix AV labor and event staffing for the call, the show and the strike.')
  && !html.includes('Arizona AV labor and event staffing for the call')) {
  pass('retarget: hero paragraph opens "Phoenix AV labor and event staffing for the call…"');
} else {
  fail('retarget: hero paragraph opener does not match the Job 2 PR 1 ruling (Arizona → Phoenix)');
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

// --- Measurement + inbound link on the homepage (Job 2 PR 2) ------------------
if (html.includes('name="hear_about_us"')) pass('homepage form: "How did you hear about us?" field present');
else fail('homepage form: hear_about_us field missing');
for (const ev of ['quote_form_submit', 'click_to_call', 'quote_button_click']) {
  if (html.includes(`'${ev}'`)) pass(`homepage: Umami event wired: ${ev}`);
  else fail(`homepage: Umami event missing: ${ev}`);
}
if (html.includes('href="/av-labor/"')) pass('homepage links to /av-labor/ (descriptive anchor in the Crew section)');
else fail('homepage: no link to /av-labor/');

// --- /av-labor/ page (Job 2 PR 2) ----------------------------------------------
import { existsSync } from 'node:fs';
const AV_URL = 'https://phoenixavstaffing.com/av-labor/';
if (!existsSync(join(root, 'av-labor/index.html'))) {
  fail('av-labor/index.html missing');
} else {
  const av = read('av-labor/index.html');
  const avCanonicals = [...av.matchAll(/<link\s+rel="canonical"\s+href="([^"]+)"/g)].map((m) => m[1]);
  if (avCanonicals.length === 1 && avCanonicals[0] === AV_URL) pass('av-labor: canonical self-referencing https://phoenixavstaffing.com/av-labor/');
  else fail(`av-labor: canonical found ${JSON.stringify(avCanonicals)}`);
  const avH1s = [...av.matchAll(/<h1[\s>]/g)].length;
  const avH1Text = (av.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || '';
  if (avH1s === 1 && avH1Text.includes('AV labor')) pass('av-labor: exactly one <h1>, contains the primary keyword "AV labor"');
  else fail(`av-labor: <h1> count ${avH1s}, text "${avH1Text.replace(/<[^>]+>/g, '').slice(0, 60)}"`);
  const avTitle = (av.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
  const homeTitle = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
  if (avTitle.includes('AV Labor') && avTitle !== homeTitle) pass(`av-labor: unique title — "${avTitle.replace(/&amp;/g, '&')}"`);
  else fail(`av-labor: title problem — "${avTitle}"`);
  const avMeta = (av.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
  const homeMeta = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
  if (avMeta.length > 40 && avMeta !== homeMeta) pass('av-labor: unique meta description');
  else fail('av-labor: meta description missing or duplicates the homepage');
  for (const price of ['$350', '$650', '$1000']) {
    if (av.includes(price) && av.includes('Estimate')) pass(`av-labor: tier price ${price} present, estimate-marked`);
    else fail(`av-labor: tier price ${price} / estimate marking missing`);
  }
  if (av.includes('500+')) pass('av-labor: 500+ shows crewed present');
  else fail('av-labor: "500+" shows claim missing');
  if (av.includes('Crew confirmed within 24 hours, guaranteed')) pass('av-labor: approved 24-hour claim present');
  else fail('av-labor: approved claim missing ("Crew confirmed within 24 hours, guaranteed")');
  if (av.includes('name="hear_about_us"')) pass('av-labor form: "How did you hear about us?" field present');
  else fail('av-labor form: hear_about_us field missing');
  if (av.includes('script.google.com/macros/s/')) pass('av-labor form: posts to the Apps Script relay');
  else fail('av-labor form: Apps Script action missing');
  if (av.includes('href="tel:+14803300543"')) pass('av-labor: click-to-call 480-330-0543 present');
  else fail('av-labor: click-to-call link missing');
  for (const ev of ['quote_form_submit', 'click_to_call', 'quote_button_click']) {
    if (av.includes(`'${ev}'`)) pass(`av-labor: Umami event wired: ${ev}`);
    else fail(`av-labor: Umami event missing: ${ev}`);
  }
  const roster = ['Phoenix Convention Center', 'Sheraton Phoenix Downtown', 'The Phoenician', 'Fairmont Scottsdale Princess', 'JW Marriott Camelback Inn', 'JW Marriott Desert Ridge', 'Arizona Biltmore', 'Arizona Grand Resort', 'Caesars Republic Scottsdale', 'Sanctuary Camelback Mountain', 'Four Seasons Resort Scottsdale', 'Omni Scottsdale Resort & Spa at Montelucia', 'Omni Tempe', 'Mountain Shadows Resort', 'The Scott Resort & Spa', 'Hotel Valley Ho', 'W Scottsdale', 'Andaz Scottsdale', 'The Global Ambassador', 'The Camby', 'Ritz-Carlton', 'State Farm Stadium', 'Talking Stick Resort', 'Wild Horse Pass', 'Gila River Resorts & Casinos', 'Hyatt Regency Phoenix', 'Kimpton Palomar Phoenix', 'Kimpton Miralina', 'Tempe Mission Palms', 'Renaissance Phoenix Glendale', 'Hilton Phoenix Tapatio Cliffs', 'Phoenix Marriott Resort Tempe at The Buttes', 'Scottsdale Marriott at McDowell Mountains', 'Hilton Scottsdale', 'DoubleTree Resorts & Suites', 'Embassy Suites', 'Sonesta Suites', 'Hotel Adeline', 'The Remi', 'Cambria', 'SpringHill Suites', 'Aloft', 'Courtyard by Marriott', 'AC Hotel', 'Westin', 'The McCormick', 'SLS'];
  const onPage = roster.filter((v) => av.includes(v));
  if (onPage.length >= 6) pass(`av-labor: venue roster subset from the approved list (${onPage.length} venues)`);
  else fail(`av-labor: only ${onPage.length} approved roster venues on the page (need 6+)`);
  for (const link of ['href="/av-staffing/"', 'href="/event-staffing-phoenix/"', 'href="/"']) {
    if (av.includes(link)) pass(`av-labor: internal link present: ${link}`);
    else fail(`av-labor: internal link missing: ${link}`);
  }
  let avTypes = new Set();
  let avLdOk = true;
  for (const b of [...av.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1])) {
    try {
      const walk = (o) => {
        if (Array.isArray(o)) return o.forEach(walk);
        if (o && typeof o === 'object') {
          if (o['@type']) (Array.isArray(o['@type']) ? o['@type'] : [o['@type']]).forEach((t) => avTypes.add(t));
          Object.values(o).forEach(walk);
        }
      };
      walk(JSON.parse(b));
    } catch { avLdOk = false; }
  }
  if (avLdOk && avTypes.has('Service') && !/AggregateRating/.test(av)) pass('av-labor: valid schema (Service), no review markup');
  else fail(`av-labor: schema problem (types: ${[...avTypes].join(', ') || 'none'})`);
  const mainText = (av.match(/<main>([\s\S]*?)<\/main>/) || [])[1] || '';
  const words = mainText.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  if (words >= 500) pass(`av-labor: ${words} words of page copy (gate: 500+)`);
  else fail(`av-labor: only ${words} words of page copy (gate: 500+)`);
  if (locs.includes(AV_URL)) pass('sitemap lists /av-labor/');
  else fail('sitemap does not list /av-labor/');
}


// --- /av-staffing/ page (Job 2 PR 3) -------------------------------------------
if (html.includes('href="/av-staffing/"')) pass('homepage links to /av-staffing/ (Crew section, two-door line)');
else fail('homepage: no link to /av-staffing/');
const ST_URL = 'https://phoenixavstaffing.com/av-staffing/';
if (!existsSync(join(root, 'av-staffing/index.html'))) {
  fail('av-staffing/index.html missing');
} else {
  const st = read('av-staffing/index.html');
  const avAgain = read('av-labor/index.html');
  const homeTitle2 = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
  const homeMeta2 = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
  const stRoster = ['Phoenix Convention Center', 'Sheraton Phoenix Downtown', 'The Phoenician', 'Fairmont Scottsdale Princess', 'JW Marriott Camelback Inn', 'JW Marriott Desert Ridge', 'Arizona Biltmore', 'Arizona Grand Resort', 'Caesars Republic Scottsdale', 'Sanctuary Camelback Mountain', 'Four Seasons Resort Scottsdale', 'Omni Scottsdale Resort & Spa at Montelucia', 'Omni Tempe', 'Mountain Shadows Resort', 'The Scott Resort & Spa', 'Hotel Valley Ho', 'W Scottsdale', 'Andaz Scottsdale', 'The Global Ambassador', 'The Camby', 'Ritz-Carlton', 'State Farm Stadium', 'Talking Stick Resort', 'Wild Horse Pass', 'Gila River Resorts & Casinos', 'Hyatt Regency Phoenix', 'Kimpton Palomar Phoenix', 'Kimpton Miralina', 'Tempe Mission Palms', 'Renaissance Phoenix Glendale', 'Hilton Phoenix Tapatio Cliffs', 'Phoenix Marriott Resort Tempe at The Buttes', 'Scottsdale Marriott at McDowell Mountains', 'Hilton Scottsdale', 'DoubleTree Resorts & Suites', 'Embassy Suites', 'Sonesta Suites', 'Hotel Adeline', 'The Remi', 'Cambria', 'SpringHill Suites', 'Aloft', 'Courtyard by Marriott', 'AC Hotel', 'Westin', 'The McCormick', 'SLS'];
  const stCanonicals = [...st.matchAll(/<link\s+rel="canonical"\s+href="([^"]+)"/g)].map((m) => m[1]);
  if (stCanonicals.length === 1 && stCanonicals[0] === ST_URL) pass('av-staffing: canonical self-referencing https://phoenixavstaffing.com/av-staffing/');
  else fail(`av-staffing: canonical found ${JSON.stringify(stCanonicals)}`);
  const stH1s = [...st.matchAll(/<h1[\s>]/g)].length;
  const stH1Text = (st.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || '';
  const avH1Text2 = (avAgain.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || '';
  if (stH1s === 1 && stH1Text.includes('AV staffing') && stH1Text !== avH1Text2) pass('av-staffing: exactly one <h1>, contains the primary keyword "AV staffing", distinct from /av-labor/');
  else fail(`av-staffing: <h1> count ${stH1s}, text "${stH1Text.replace(/<[^>]+>/g, '').slice(0, 60)}"`);
  const stTitle = (st.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
  const avTitle2 = (avAgain.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
  if (stTitle === 'AV Staffing Services in Phoenix, AZ | ACAV LLC' && stTitle !== homeTitle2 && stTitle !== avTitle2) pass(`av-staffing: unique title — "${stTitle}"`);
  else fail(`av-staffing: title problem — "${stTitle}"`);
  const stMeta = (st.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
  const avMeta2 = (avAgain.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
  if (stMeta.includes('AV staffing services') && !/subcontract/i.test(stMeta) && stMeta !== homeMeta2 && stMeta !== avMeta2) pass('av-staffing: unique meta, planner framing, no subcontract language');
  else fail('av-staffing: meta description problem');
  for (const price of ['$350', '$650', '$1000']) {
    if (st.includes(price) && st.includes('Estimate')) pass(`av-staffing: tier price ${price} present, estimate-marked`);
    else fail(`av-staffing: tier price ${price} / estimate marking missing`);
  }
  if (st.includes('500+')) pass('av-staffing: 500+ shows crewed present');
  else fail('av-staffing: "500+" shows claim missing');
  if (st.includes('Crew confirmed within 24 hours, guaranteed')) pass('av-staffing: approved 24-hour claim present');
  else fail('av-staffing: approved claim missing');
  if (/insured/i.test(st)) pass('av-staffing: insured framing present');
  else fail('av-staffing: insured framing missing');
  if (st.includes('Request a quote') && !st.includes('Request crew') && !st.toLowerCase().includes('call sheet')) pass('av-staffing: request-a-quote CTA; /av-labor/ language ("Request crew", "call sheet") kept out');
  else fail('av-staffing: CTA / differentiation problem');
  if (st.includes('name="hear_about_us"')) pass('av-staffing form: "How did you hear about us?" field present');
  else fail('av-staffing form: hear_about_us field missing');
  if (st.includes('script.google.com/macros/s/')) pass('av-staffing form: posts to the Apps Script relay');
  else fail('av-staffing form: Apps Script action missing');
  if (st.includes('href="tel:+14803300543"')) pass('av-staffing: click-to-call 480-330-0543 present');
  else fail('av-staffing: click-to-call link missing');
  for (const ev of ['quote_form_submit', 'click_to_call', 'quote_button_click']) {
    if (st.includes(`'${ev}'`)) pass(`av-staffing: Umami event wired: ${ev}`);
    else fail(`av-staffing: Umami event missing: ${ev}`);
  }
  if (st.includes("url: 'https://phoenixavstaffing.com/av-staffing/'")) pass('av-staffing: Umami events carry the page URL');
  else fail('av-staffing: Umami event URL is not the page URL');
  const onPageSt = stRoster.filter((v) => st.includes(v));
  if (onPageSt.length >= 6) pass(`av-staffing: venue roster subset from the approved list (${onPageSt.length} venues)`);
  else fail(`av-staffing: only ${onPageSt.length} approved roster venues on the page (need 6+)`);
  for (const link of ['href="/av-labor/"', 'href="/event-staffing-phoenix/"', 'href="/"']) {
    if (st.includes(link)) pass(`av-staffing: internal link present: ${link}`);
    else fail(`av-staffing: internal link missing: ${link}`);
  }
  let stTypes = new Set();
  let stLdOk = true;
  for (const b of [...st.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => m[1])) {
    try {
      const walk = (o) => {
        if (Array.isArray(o)) return o.forEach(walk);
        if (o && typeof o === 'object') {
          if (o['@type']) (Array.isArray(o['@type']) ? o['@type'] : [o['@type']]).forEach((t) => stTypes.add(t));
          Object.values(o).forEach(walk);
        }
      };
      walk(JSON.parse(b));
    } catch { stLdOk = false; }
  }
  if (stLdOk && stTypes.has('Service') && !/AggregateRating/.test(st)) pass('av-staffing: valid schema (Service), no review markup');
  else fail(`av-staffing: schema problem (types: ${[...stTypes].join(', ') || 'none'})`);
  const stMainText = (st.match(/<main>([\s\S]*?)<\/main>/) || [])[1] || '';
  const stWords = stMainText.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  if (stWords >= 500) pass(`av-staffing: ${stWords} words of page copy (gate: 500+)`);
  else fail(`av-staffing: only ${stWords} words of page copy (gate: 500+)`);
  if (locs.includes(ST_URL)) pass('sitemap lists /av-staffing/');
  else fail('sitemap does not list /av-staffing/');
}

console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
