/**
 * Product migration script
 * Reads joomla-audit.json and imports products + media + PDFs into Strapi.
 *
 * Usage:
 *   STRAPI_URL=http://localhost:1337 STRAPI_ADMIN_TOKEN=<token> npx ts-node scripts/migrate-products.ts [--dry-run]
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';

// ─── Config ────────────────────────────────────────────────────────────────────

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_ADMIN_TOKEN = process.env.STRAPI_ADMIN_TOKEN || '';
const DRY_RUN = process.argv.includes('--dry-run');

const AUDIT_FILE = path.join(__dirname, 'output', 'joomla-audit.json');
const ERROR_LOG = path.join(__dirname, 'output', 'migration-errors.log');

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
  products: ProductEntry[];
}

interface StrapiEntity {
  id: number;
  attributes: Record<string, unknown>;
}

// ─── URL → taxonomy mapping ────────────────────────────────────────────────────

const URL_DOMAIN_MAP: Record<string, string> = {
  'enterprise-networking': 'enterprise-networking',
  'enterprise-surveillance': 'enterprise-surveillance',
  'professional-displays': 'professional-displays',
  'industrial-networking': 'industrial-networking',
  'networking-pa-system': 'networking-pa-system',
  'video-conference': 'video-conference',
  'servers-storage': 'servers-storage',
  'enterprise-software': 'enterprise-software',
  // Joomla URL segment aliases (live site uses different slugs in some cases)
  'networking': 'enterprise-networking',
  'surveillance': 'enterprise-surveillance',
  'displays': 'professional-displays',
  'industrial': 'industrial-networking',
  'pa-system': 'networking-pa-system',
  'video-conferencing': 'video-conference',
  'servers': 'servers-storage',
  'software': 'enterprise-software',
  // Live Joomla site uses "servers-and-storage" in URLs
  'servers-and-storage': 'servers-storage',
};

// Map live Joomla family URL slugs → our Strapi family slugs
const URL_FAMILY_MAP: Record<string, string> = {
  // Enterprise Surveillance — live uses "cameras-accessories"
  'cameras-accessories': 'camera-accessories',
  // Enterprise Software — live uses full names
  'software-defined-wan': 'software-defined-wan',
  'ai-based-video-analytics': 'ai-based-video-analytics',
  'cloud-video-conference-system': 'cloud-video-conference-system',
  'cloud-public-addressing-system': 'cloud-public-addressing-system',
  // Servers — live uses "network-attached-storage" (same), "local-processing-units" (same)
  // Video Conference — live uses "all-in-one-ptz-cameras" (same)
};

// Map live Joomla category URL slugs → our Strapi category slugs
const URL_CATEGORY_MAP: Record<string, string> = {
  // Industrial switches — live uses these exact slugs
  'l2-managed-industrial-switches': 'l2-managed-industrial-switches',
  'l3-managed-industrial-switches': 'l3-managed-industrial-switches',
  'industrial-power-supply': 'industrial-power-supply',
  // Industrial cameras
  'corrosion-proof-cameras': 'corrosion-proof-cameras',
  'industrial-cameras-accessories': 'industrial-cameras-accessories',
};

function extractTaxonomyFromUrl(url: string): {
  domainSlug: string;
  familySlug: string;
  categorySlug: string;
} {
  // Parse URL path segments
  const urlPath = url.replace(/^https?:\/\/[^/]+/, '');
  const segments = urlPath
    .replace('/index.php/products/', '')
    .replace('/products/', '')
    .split('/')
    .filter(Boolean);

  const domainSegment = segments[0] ?? '';
  const familySegment = segments[1] ?? '';
  const categorySegment = segments[2] ?? '';

  const domainSlug = URL_DOMAIN_MAP[domainSegment] ?? domainSegment;
  const familySlug = URL_FAMILY_MAP[familySegment] ?? familySegment;
  const categorySlug = URL_CATEGORY_MAP[categorySegment] ?? categorySegment;

  return {
    domainSlug,
    familySlug,
    categorySlug,
  };
}

function isPdfManual(filename: string): boolean {
  const lower = filename.toLowerCase();
  return (
    lower.includes('manual') ||
    lower.includes('guide') ||
    lower.includes('installation') ||
    lower.includes('user')
  );
}

// ─── HTTP helpers ──────────────────────────────────────────────────────────────

function fetchBuffer(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(
      url,
      { headers: { 'User-Agent': 'PlexonicsMigrationBot/1.0' } },
      (res) => {
        if (res.statusCode && [301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
          resolve(fetchBuffer(res.headers.location));
          return;
        }
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          return;
        }
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      }
    );
    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error(`Timeout fetching ${url}`));
    });
  });
}

async function strapiRequest<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  return new Promise((resolve, reject) => {
    const url = new URL(`${STRAPI_URL}/api${path}`);
    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;

    const data = body ? JSON.stringify(body) : undefined;
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${STRAPI_ADMIN_TOKEN}`,
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };

    const req = lib.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => (responseData += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(parsed)}`));
          } else {
            resolve(parsed as T);
          }
        } catch {
          reject(new Error(`Failed to parse response: ${responseData}`));
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function uploadFileToStrapi(
  fileBuffer: Buffer,
  filename: string,
  mimeType: string
): Promise<number> {
  return new Promise((resolve, reject) => {
    const boundary = `----FormBoundary${Date.now()}`;
    const url = new URL(`${STRAPI_URL}/api/upload`);
    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;

    const header = Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="files"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`
    );
    const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
    const body = Buffer.concat([header, fileBuffer, footer]);

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length,
        Authorization: `Bearer ${STRAPI_ADMIN_TOKEN}`,
      },
    };

    const req = lib.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`Upload failed HTTP ${res.statusCode}: ${data}`));
          } else {
            const fileId = Array.isArray(parsed) ? parsed[0]?.id : parsed?.id;
            if (!fileId) reject(new Error(`No file ID in upload response: ${data}`));
            else resolve(fileId);
          }
        } catch {
          reject(new Error(`Failed to parse upload response: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function findBySlug(endpoint: string, slug: string): Promise<number | null> {
  const res = await strapiRequest<{ data: Array<{ id: number }> }>(
    'GET',
    `/${endpoint}?filters[slug][$eq]=${encodeURIComponent(slug)}&pagination[pageSize]=1`
  );
  return res.data[0]?.id ?? null;
}

async function findProductByModelCode(modelCode: string): Promise<number | null> {
  if (!modelCode) return null;
  const res = await strapiRequest<{ data: Array<{ id: number }> }>(
    'GET',
    `/products?filters[modelCode][$eq]=${encodeURIComponent(modelCode)}&pagination[pageSize]=1`
  );
  return res.data[0]?.id ?? null;
}

// ─── Logger ────────────────────────────────────────────────────────────────────

function logError(message: string) {
  const line = `[${new Date().toISOString()}] ${message}\n`;
  fs.appendFileSync(ERROR_LOG, line);
  console.error(`  ✗ ${message}`);
}

// ─── Migration ─────────────────────────────────────────────────────────────────

async function migrateProduct(product: ProductEntry, index: number, total: number): Promise<void> {
  console.log(`\n[${index + 1}/${total}] ${product.name || product.url}`);

  if (!product.name) {
    logError(`Skipping product with no name: ${product.url}`);
    return;
  }

  // Check if already migrated (by modelCode)
  if (product.modelCode) {
    const existing = await findProductByModelCode(product.modelCode);
    if (existing) {
      console.log(`  ✓ Already exists (modelCode: ${product.modelCode})`);
      return;
    }
  }

  const { domainSlug, familySlug, categorySlug } = extractTaxonomyFromUrl(product.url);

  // Look up taxonomy IDs
  const domainId = domainSlug ? await findBySlug('product-domains', domainSlug) : null;
  const familyId = familySlug ? await findBySlug('product-families', familySlug) : null;
  const categoryId = categorySlug ? await findBySlug('product-categories', categorySlug) : null;

  if (!domainId) {
    logError(`Domain not found for slug "${domainSlug}" (URL: ${product.url})`);
    return;
  }
  if (!familyId) {
    logError(`Family not found for slug "${familySlug}" (URL: ${product.url})`);
    return;
  }

  console.log(`  Domain: ${domainSlug} (${domainId}), Family: ${familySlug} (${familyId})`);

  // Upload main image
  let mainImageId: number | null = null;
  if (product.imageLinks.length > 0) {
    const imageUrl = product.imageLinks[0];
    if (DRY_RUN) {
      console.log(`  [DRY RUN] Would upload image: ${imageUrl}`);
    } else {
      try {
        const imageBuffer = await fetchBuffer(imageUrl);
        const filename = imageUrl.split('/').pop() ?? 'product-image.jpg';
        const mimeType = filename.endsWith('.png') ? 'image/png' : 'image/jpeg';
        mainImageId = await uploadFileToStrapi(imageBuffer, filename, mimeType);
        console.log(`  ✓ Uploaded image: ${filename} (id: ${mainImageId})`);
      } catch (err) {
        logError(`Failed to upload image ${imageUrl}: ${err}`);
      }
    }
  }

  // Upload PDFs and create document entries
  const datasheetIds: number[] = [];
  const manualIds: number[] = [];

  for (const pdfUrl of product.pdfLinks) {
    const filename = pdfUrl.split('/').pop() ?? 'document.pdf';
    const isManual = isPdfManual(filename);
    const docType = isManual ? 'manual' : 'datasheet';

    if (DRY_RUN) {
      console.log(`  [DRY RUN] Would upload PDF (${docType}): ${filename}`);
      continue;
    }

    try {
      const pdfBuffer = await fetchBuffer(pdfUrl);
      const fileId = await uploadFileToStrapi(pdfBuffer, filename, 'application/pdf');

      // Create document entry
      const docRes = await strapiRequest<{ data: { id: number } }>('POST', '/documents', {
        data: {
          title: filename.replace('.pdf', '').replace(/-/g, ' '),
          type: docType,
          file: fileId,
          language: 'EN',
        },
      });

      const docId = docRes.data.id;
      if (isManual) manualIds.push(docId);
      else datasheetIds.push(docId);

      console.log(`  ✓ Uploaded ${docType}: ${filename} (doc id: ${docId})`);
    } catch (err) {
      logError(`Failed to upload PDF ${pdfUrl}: ${err}`);
    }
  }

  // Create product entry
  const productData = {
    name: product.name,
    modelCode: product.modelCode || undefined,
    shortDescription: product.rawText.slice(0, 200) || undefined,
    status: 'active',
    domain: domainId,
    family: familyId,
    ...(categoryId ? { category: categoryId } : {}),
    ...(mainImageId ? { mainImage: mainImageId } : {}),
    ...(datasheetIds.length > 0 ? { datasheets: datasheetIds } : {}),
    ...(manualIds.length > 0 ? { manuals: manualIds } : {}),
  };

  if (DRY_RUN) {
    console.log(`  [DRY RUN] Would create product:`, JSON.stringify(productData, null, 2));
    return;
  }

  try {
    const res = await strapiRequest<{ data: { id: number } }>('POST', '/products', {
      data: productData,
    });
    console.log(`  ✓ Created product: ${product.name} (id: ${res.data.id})`);
  } catch (err) {
    logError(`Failed to create product "${product.name}": ${err}`);
  }
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 Plexonics Product Migration Script');
  console.log(`   Strapi URL: ${STRAPI_URL}`);
  console.log(`   Mode: ${DRY_RUN ? '🔍 DRY RUN (no changes will be made)' : '⚡ LIVE'}`);

  if (!STRAPI_ADMIN_TOKEN) {
    console.error('❌ STRAPI_ADMIN_TOKEN is not set. Exiting.');
    process.exit(1);
  }

  if (!fs.existsSync(AUDIT_FILE)) {
    console.error(`❌ Audit file not found: ${AUDIT_FILE}`);
    console.error('   Run audit-joomla.ts first.');
    process.exit(1);
  }

  // Ensure output dir exists
  const outputDir = path.dirname(ERROR_LOG);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Clear error log
  if (!DRY_RUN) {
    fs.writeFileSync(ERROR_LOG, '');
  }

  const audit: AuditOutput = JSON.parse(fs.readFileSync(AUDIT_FILE, 'utf8'));
  const products = audit.products;

  console.log(`\n📋 Found ${products.length} products to migrate\n`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < products.length; i++) {
    try {
      await migrateProduct(products[i], i, products.length);
      successCount++;
    } catch (err) {
      errorCount++;
      logError(`Unexpected error for product ${products[i].url}: ${err}`);
    }

    // Rate limiting between products
    if (i < products.length - 1 && !DRY_RUN) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  console.log('\n📊 Migration Summary:');
  console.log(`   Total: ${products.length}`);
  console.log(`   Success: ${successCount}`);
  console.log(`   Errors: ${errorCount}`);

  if (!DRY_RUN && errorCount > 0) {
    console.log(`   Error log: ${ERROR_LOG}`);
  }

  if (DRY_RUN) {
    console.log('\n✅ Dry run complete. No changes were made.');
    console.log('   Run without --dry-run to execute the migration.');
  } else {
    console.log('\n✅ Migration complete!');
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
