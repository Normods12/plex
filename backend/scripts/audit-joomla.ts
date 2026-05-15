/**
 * Joomla audit scraper
 * Crawls https://www.plexonics.com, discovers all product URLs, and extracts
 * product names, model codes, PDF links, and image links.
 *
 * Usage:
 *   npx ts-node scripts/audit-joomla.ts
 *
 * Output:
 *   backend/scripts/output/joomla-audit.json
 *   backend/scripts/output/pdf-links.csv
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ProductEntry {
  url: string;
  name: string;
  modelCode: string;
  pdfLinks: string[];
  imageLinks: string[];
  rawText: string;
}

interface AuditOutput {
  crawledAt: string;
  totalProducts: number;
  products: ProductEntry[];
}

// ─── Config ────────────────────────────────────────────────────────────────────

const BASE_URL = 'https://www.plexonics.com';
const RATE_LIMIT_MS = 1000; // 1 request per second
const OUTPUT_DIR = path.join(__dirname, 'output');
const AUDIT_FILE = path.join(OUTPUT_DIR, 'joomla-audit.json');
const CSV_FILE = path.join(OUTPUT_DIR, 'pdf-links.csv');

// ─── HTTP helper ───────────────────────────────────────────────────────────────

function fetchUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const options = {
      headers: {
        'User-Agent': 'PlexonicsAuditBot/1.0 (site migration; contact info@plexonics.com)',
        Accept: 'text/html,application/xhtml+xml',
      },
    };

    const req = lib.get(url, options, (res) => {
      // Follow redirects
      if (res.statusCode && [301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        const redirectUrl = res.headers.location.startsWith('http')
          ? res.headers.location
          : `${BASE_URL}${res.headers.location}`;
        resolve(fetchUrl(redirectUrl));
        return;
      }

      if (res.statusCode && res.statusCode >= 400) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }

      let data = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data));
    });

    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error(`Timeout fetching ${url}`));
    });
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Simple HTML parser (no external deps) ────────────────────────────────────

function extractLinks(html: string, baseUrl: string): string[] {
  const links: string[] = [];
  const hrefRegex = /href=["']([^"']+)["']/gi;
  let match;
  while ((match = hrefRegex.exec(html)) !== null) {
    const href = match[1];
    if (href.startsWith('http')) {
      links.push(href);
    } else if (href.startsWith('/')) {
      links.push(`${BASE_URL}${href}`);
    }
  }
  return links;
}

function extractPdfLinks(html: string): string[] {
  const links: string[] = [];
  const pdfRegex = /href=["']([^"']*\.pdf[^"']*)["']/gi;
  let match;
  while ((match = pdfRegex.exec(html)) !== null) {
    const href = match[1];
    if (href.startsWith('http')) {
      links.push(href);
    } else if (href.startsWith('/')) {
      links.push(`${BASE_URL}${href}`);
    }
  }
  return [...new Set(links)];
}

function extractImageLinks(html: string): string[] {
  const links: string[] = [];
  const imgRegex = /src=["']([^"']*\.(jpg|jpeg|png|gif|webp)[^"']*)["']/gi;
  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    const src = match[1];
    if (src.startsWith('http')) {
      links.push(src);
    } else if (src.startsWith('/')) {
      links.push(`${BASE_URL}${src}`);
    }
  }
  return [...new Set(links)].filter(
    (url) => !url.includes('/templates/') && !url.includes('/media/system/')
  );
}

function extractText(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTitle(html: string): string {
  const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (titleMatch) return titleMatch[1].trim();
  const pageTitleMatch = html.match(/<title>([^<]+)<\/title>/i);
  if (pageTitleMatch) return pageTitleMatch[1].replace(' - Plexonics', '').trim();
  return '';
}

function extractModelCode(text: string, name: string): string {
  // Look for patterns like PX-SW-2448G, MAXECO-2MP-B, etc.
  const modelPatterns = [
    /\b([A-Z]{2,}-[A-Z0-9-]{3,})\b/,
    /Model[:\s]+([A-Z0-9-]{4,})/i,
    /Part No[.:\s]+([A-Z0-9-]{4,})/i,
  ];

  for (const pattern of modelPatterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }

  return '';
}

// ─── Crawler ───────────────────────────────────────────────────────────────────

async function discoverProductUrls(): Promise<string[]> {
  console.log('🔍 Discovering product URLs from sitemap and homepage...');
  const productUrls = new Set<string>();

  // Try sitemap first
  try {
    const sitemap = await fetchUrl(`${BASE_URL}/sitemap.xml`);
    const urlMatches = sitemap.matchAll(/<loc>([^<]+)<\/loc>/g);
    for (const match of urlMatches) {
      const url = match[1];
      if (url.includes('/index.php/products/') || url.includes('/products/')) {
        productUrls.add(url);
      }
    }
    console.log(`  Found ${productUrls.size} product URLs in sitemap`);
  } catch {
    console.log('  Sitemap not available, crawling from homepage...');
  }

  // Crawl homepage and product pages
  try {
    const homepage = await fetchUrl(BASE_URL);
    const links = extractLinks(homepage, BASE_URL);
    for (const link of links) {
      if (
        link.includes(BASE_URL) &&
        (link.includes('/index.php/products/') || link.includes('/products/'))
      ) {
        productUrls.add(link);
      }
    }
  } catch (err) {
    console.warn('  Could not fetch homepage:', err);
  }

  return Array.from(productUrls);
}

async function scrapeProductPage(url: string): Promise<ProductEntry> {
  const html = await fetchUrl(url);
  const rawText = extractText(html);
  const name = extractTitle(html);
  const modelCode = extractModelCode(rawText, name);
  const pdfLinks = extractPdfLinks(html);
  const imageLinks = extractImageLinks(html);

  return { url, name, modelCode, pdfLinks, imageLinks, rawText: rawText.slice(0, 2000) };
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🕷  Plexonics Joomla Audit Scraper');
  console.log(`   Target: ${BASE_URL}`);
  console.log(`   Rate limit: ${RATE_LIMIT_MS}ms between requests\n`);

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Discover product URLs
  const productUrls = await discoverProductUrls();
  console.log(`\n📋 Found ${productUrls.length} product URLs to scrape\n`);

  if (productUrls.length === 0) {
    console.log('No product URLs found. The site may require JavaScript rendering.');
    console.log('Consider using Puppeteer for JS-heavy pages.');

    // Write empty output
    const output: AuditOutput = {
      crawledAt: new Date().toISOString(),
      totalProducts: 0,
      products: [],
    };
    fs.writeFileSync(AUDIT_FILE, JSON.stringify(output, null, 2));
    console.log(`\nEmpty audit written to ${AUDIT_FILE}`);
    return;
  }

  const products: ProductEntry[] = [];
  const errors: Array<{ url: string; error: string }> = [];

  for (let i = 0; i < productUrls.length; i++) {
    const url = productUrls[i];
    console.log(`[${i + 1}/${productUrls.length}] Scraping: ${url}`);

    try {
      const product = await scrapeProductPage(url);
      products.push(product);
      console.log(`  ✓ ${product.name || '(no title)'} — ${product.pdfLinks.length} PDFs, ${product.imageLinks.length} images`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.warn(`  ✗ Error: ${errorMsg}`);
      errors.push({ url, error: errorMsg });
    }

    // Rate limiting
    if (i < productUrls.length - 1) {
      await sleep(RATE_LIMIT_MS);
    }
  }

  // Write JSON output
  const output: AuditOutput = {
    crawledAt: new Date().toISOString(),
    totalProducts: products.length,
    products,
  };
  fs.writeFileSync(AUDIT_FILE, JSON.stringify(output, null, 2));
  console.log(`\n✅ Audit JSON written to ${AUDIT_FILE}`);

  // Write CSV output
  const csvLines = ['productUrl,pdfUrl,filename'];
  for (const product of products) {
    for (const pdfUrl of product.pdfLinks) {
      const filename = pdfUrl.split('/').pop() ?? '';
      csvLines.push(`"${product.url}","${pdfUrl}","${filename}"`);
    }
  }
  fs.writeFileSync(CSV_FILE, csvLines.join('\n'));
  console.log(`✅ PDF links CSV written to ${CSV_FILE}`);

  // Summary
  console.log('\n📊 Summary:');
  console.log(`   Products scraped: ${products.length}`);
  console.log(`   Total PDF links: ${products.reduce((sum, p) => sum + p.pdfLinks.length, 0)}`);
  console.log(`   Total image links: ${products.reduce((sum, p) => sum + p.imageLinks.length, 0)}`);
  console.log(`   Errors: ${errors.length}`);

  if (errors.length > 0) {
    const errorFile = path.join(OUTPUT_DIR, 'scrape-errors.json');
    fs.writeFileSync(errorFile, JSON.stringify(errors, null, 2));
    console.log(`   Error details: ${errorFile}`);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
