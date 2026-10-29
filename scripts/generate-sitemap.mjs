#!/usr/bin/env node
// Generates sitemap.xml from sitemap-pages.json (the site's page list).
// Usage:
//   node scripts/generate-sitemap.mjs           rewrite sitemap.xml
//   node scripts/generate-sitemap.mjs --check   exit 1 if sitemap.xml is stale
// Rules (docs/seo-buildout-spec.md, Job 1 item 3): the sitemap lists ONLY
// canonical 200-status pages on the apex domain — never PDFs, never the
// crew subdomain, never redirected URLs. Output is deterministic (no dates),
// so it only changes when the page list changes.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const listPath = join(root, 'sitemap-pages.json');
const outPath = join(root, 'sitemap.xml');

const { baseUrl, pages } = JSON.parse(readFileSync(listPath, 'utf8'));

if (baseUrl !== 'https://phoenixavstaffing.com') {
  console.error(`generate-sitemap: unexpected baseUrl "${baseUrl}" (apex only, no subdomains)`);
  process.exit(1);
}
if (!Array.isArray(pages) || pages.length === 0) {
  console.error('generate-sitemap: sitemap-pages.json has no pages');
  process.exit(1);
}
for (const p of pages) {
  if (!p.path || !p.path.startsWith('/') || p.path.includes('..')) {
    console.error(`generate-sitemap: bad path "${p.path}"`);
    process.exit(1);
  }
  if (p.path.toLowerCase().endsWith('.pdf')) {
    console.error(`generate-sitemap: PDFs never belong in the sitemap ("${p.path}")`);
    process.exit(1);
  }
}

const body = pages
  .map((p) => {
    const lines = [`    <loc>${baseUrl}${p.path}</loc>`];
    if (p.changefreq) lines.push(`    <changefreq>${p.changefreq}</changefreq>`);
    if (p.priority) lines.push(`    <priority>${p.priority}</priority>`);
    return `  <url>\n${lines.join('\n')}\n  </url>`;
  })
  .join('\n');

const xml =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  `${body}\n</urlset>\n`;

if (process.argv.includes('--check')) {
  const current = readFileSync(outPath, 'utf8');
  if (current !== xml) {
    console.error('generate-sitemap: sitemap.xml is STALE — run: node scripts/generate-sitemap.mjs');
    process.exit(1);
  }
  console.log('generate-sitemap: sitemap.xml is up to date');
} else {
  writeFileSync(outPath, xml);
  console.log(`generate-sitemap: wrote sitemap.xml (${pages.length} page${pages.length === 1 ? '' : 's'})`);
}
