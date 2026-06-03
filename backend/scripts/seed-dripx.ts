#!/usr/bin/env ts-node
/**
 * seed-dripx.ts — Seeds DripX product taxonomy and 23 product stubs into Strapi.
 *
 * Hierarchy seeded:
 *   DripX TURN        → ST Series (10), TS-P Series (4), TS-S Series (2)
 *   DripX MACH        → MV Series (4)
 *   DripX TURN-Turnmill → TM Series (3)
 *   Total: 3 domains · 5 families · 23 products
 *
 * Usage:
 *   npx ts-node --skip-project scripts/seed-dripx.ts
 *
 * Required in .env (Strapi root):
 *   STRAPI_ADMIN_EMAIL=admin@example.com
 *   STRAPI_ADMIN_PASSWORD=yourpassword
 *   STRAPI_URL=http://localhost:1337   (optional — defaults to localhost:1337)
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const BASE_URL = (process.env.STRAPI_URL ?? 'http://localhost:1337').replace(/\/$/, '');
const CM = `${BASE_URL}/content-manager/collection-types`;

// ─── Seed data ──────────────────────────────────────────────────────────────

const DOMAINS = [
  { name: 'DripX TURN',          slug: 'dripx-turn',           brand: 'dripx', sortOrder: 1 },
  { name: 'DripX MACH',          slug: 'dripx-mach',           brand: 'dripx', sortOrder: 2 },
  { name: 'DripX TURN-Turnmill', slug: 'dripx-turn-turnmill',  brand: 'dripx', sortOrder: 3 },
];

const FAMILIES = [
  { name: 'ST Series',   slug: 'st-series',  domainSlug: 'dripx-turn',          brand: 'dripx', sortOrder: 1 },
  { name: 'TS-P Series', slug: 'tsp-series', domainSlug: 'dripx-turn',          brand: 'dripx', sortOrder: 2 },
  { name: 'TS-S Series', slug: 'tss-series', domainSlug: 'dripx-turn',          brand: 'dripx', sortOrder: 3 },
  { name: 'MV Series',   slug: 'mv-series',  domainSlug: 'dripx-mach',          brand: 'dripx', sortOrder: 1 },
  { name: 'TM Series',   slug: 'tm-series',  domainSlug: 'dripx-turn-turnmill', brand: 'dripx', sortOrder: 1 },
];

type MachineType = 'turning-centre' | 'vmc' | 'turn-mill';

interface ProductSeed {
  name: string;
  modelCode: string;
  slug: string;
  familySlug: string;
  domainSlug: string;
  brand: 'dripx';
  machineType: MachineType;
  shortDescription: string;
  sortOrder: number;
}

function makeProducts(
  codes: string[],
  familySlug: string,
  domainSlug: string,
  machineType: MachineType,
): ProductSeed[] {
  const typeLabel: Record<MachineType, string> = {
    'turning-centre': 'CNC Turning Centre',
    'vmc':            'Vertical Machining Centre',
    'turn-mill':      'Turn-Mill Centre',
  };
  return codes.map((code, i) => ({
    name:  `DripX ${code}`,
    modelCode: code,
    slug:  code.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    familySlug,
    domainSlug,
    brand: 'dripx',
    machineType,
    shortDescription: `The DripX ${code} is a high-precision ${typeLabel[machineType]} engineered for demanding production environments. Full specifications available on request.`,
    sortOrder: i + 1,
  }));
}

const PRODUCTS: ProductSeed[] = [
  // DripX TURN — ST Series (10 turning centres)
  ...makeProducts(['ST-200','ST-250','ST-300','ST-350','ST-400','ST-450','ST-500','ST-500M','ST-600','ST-700'], 'st-series',  'dripx-turn',          'turning-centre'),
  // DripX TURN — TS-P Series (4 turning centres)
  ...makeProducts(['TS-P200','TS-P250','TS-P300','TS-P350'],                                                   'tsp-series', 'dripx-turn',          'turning-centre'),
  // DripX TURN — TS-S Series (2 turning centres)
  ...makeProducts(['TS-S200','TS-S250'],                                                                       'tss-series', 'dripx-turn',          'turning-centre'),
  // DripX MACH — MV Series (4 VMC)
  ...makeProducts(['MV-550','MV-650','MV-850','MV-1050'],                                                     'mv-series',  'dripx-mach',          'vmc'),
  // DripX TURN-Turnmill — TM Series (3 turn-mill)
  ...makeProducts(['TM-200','TM-250','TM-300'],                                                               'tm-series',  'dripx-turn-turnmill', 'turn-mill'),
];

// ─── HTTP helpers ───────────────────────────────────────────────────────────

type Entry = { id: number; documentId?: string; [key: string]: unknown };

function h(token: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

async function adminLogin(): Promise<string> {
  const email    = process.env.STRAPI_ADMIN_EMAIL;
  const password = process.env.STRAPI_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error('Set STRAPI_ADMIN_EMAIL and STRAPI_ADMIN_PASSWORD in .env');
  }
  const res  = await fetch(`${BASE_URL}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json() as { data?: { token?: string } };
  if (!res.ok || !body?.data?.token) {
    throw new Error(`Admin login failed (${res.status}): ${JSON.stringify(body)}`);
  }
  console.log('✅ Authenticated as admin');
  return body.data.token;
}

/** Returns all results matching the given slug filter. */
async function findBySlug(token: string, uid: string, slug: string): Promise<Entry[]> {
  const url = `${CM}/${uid}?filters[slug][$eq]=${encodeURIComponent(slug)}&pageSize=5`;
  const res  = await fetch(url, { headers: h(token) });
  const body = await res.json() as { results?: Entry[] };
  return body?.results ?? [];
}

/** Creates an entry via the Content Manager API and returns it. */
async function createEntry(token: string, uid: string, data: Record<string, unknown>): Promise<Entry> {
  const res  = await fetch(`${CM}/${uid}`, {
    method: 'POST',
    headers: h(token),
    body: JSON.stringify(data),
  });
  const body = await res.json() as Entry & { error?: unknown };
  if (!res.ok) throw new Error(`Create ${uid} failed (${res.status}): ${JSON.stringify(body)}`);
  return body;
}

/** Publishes an entry by documentId (Strapi 5) or numeric id. */
async function publishEntry(token: string, uid: string, entry: Entry): Promise<void> {
  const ref = entry.documentId ?? String(entry.id);
  const res = await fetch(`${CM}/${uid}/${ref}/actions/publish`, {
    method: 'POST',
    headers: h(token),
  });
  if (!res.ok) {
    const err = await res.json();
    console.warn(`  ⚠️  Publish warning (${ref}): ${JSON.stringify(err)}`);
  }
}

async function createAndPublish(token: string, uid: string, data: Record<string, unknown>): Promise<Entry> {
  const entry = await createEntry(token, uid, data);
  await publishEntry(token, uid, entry);
  return entry;
}

// ─── Seed functions ─────────────────────────────────────────────────────────

async function seedDomains(token: string): Promise<Map<string, number>> {
  console.log('\n📦 Seeding product domains...');
  const ids = new Map<string, number>();

  for (const d of DOMAINS) {
    const existing = await findBySlug(token, 'api::product-domain.product-domain', d.slug);
    if (existing.length > 0) {
      console.log(`  ⏭  Exists: ${d.name}`);
      ids.set(d.slug, existing[0].id);
      continue;
    }
    const created = await createAndPublish(token, 'api::product-domain.product-domain', d);
    console.log(`  ✅ Created: ${d.name}  (id ${created.id})`);
    ids.set(d.slug, created.id);
  }
  return ids;
}

async function seedFamilies(token: string, domainIds: Map<string, number>): Promise<Map<string, number>> {
  console.log('\n📦 Seeding product families...');
  const ids = new Map<string, number>();

  for (const f of FAMILIES) {
    const domainId = domainIds.get(f.domainSlug);
    if (!domainId) { console.warn(`  ⚠️  Domain missing for ${f.name} — skip`); continue; }

    const existing = await findBySlug(token, 'api::product-family.product-family', f.slug);
    if (existing.length > 0) {
      console.log(`  ⏭  Exists: ${f.name}`);
      ids.set(f.slug, existing[0].id);
      continue;
    }
    const { domainSlug: _, ...rest } = f;
    // Strapi 5 CM API expects relations as { connect: [{ id }] }
    const created = await createAndPublish(token, 'api::product-family.product-family', {
      ...rest,
      domain: { connect: [{ id: domainId }] },
    });
    console.log(`  ✅ Created: ${f.name}  (id ${created.id})`);
    ids.set(f.slug, created.id);
  }
  return ids;
}

async function seedProducts(
  token: string,
  domainIds: Map<string, number>,
  familyIds: Map<string, number>,
): Promise<void> {
  console.log('\n📦 Seeding products...');
  let created = 0;
  let skipped = 0;
  let errors  = 0;

  for (const p of PRODUCTS) {
    const domainId = domainIds.get(p.domainSlug);
    const familyId = familyIds.get(p.familySlug);
    if (!domainId || !familyId) {
      console.warn(`  ⚠️  Missing domain/family for ${p.name} — skip`);
      errors++;
      continue;
    }
    const existing = await findBySlug(token, 'api::product.product', p.slug);
    if (existing.length > 0) { skipped++; continue; }

    const { domainSlug: _d, familySlug: _f, ...rest } = p;
    try {
      await createAndPublish(token, 'api::product.product', {
        ...rest,
        status: 'active',
        domain: { connect: [{ id: domainId }] },
        family: { connect: [{ id: familyId }] },
      });
      console.log(`  ✅ ${p.name}`);
      created++;
    } catch (err) {
      console.error(`  ❌ Failed: ${p.name} — ${(err as Error).message}`);
      errors++;
    }
  }

  console.log(`\n  📊 Products summary: ${created} created · ${skipped} already existed · ${errors} errors`);
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('══════════════════════════════════════════');
  console.log('  DripX Seed Script  —  Strapi 5');
  console.log('══════════════════════════════════════════');
  console.log(`  Target: ${BASE_URL}`);
  console.log(`  Products to seed: ${PRODUCTS.length}`);
  console.log('');

  const token    = await adminLogin();
  const domainIds = await seedDomains(token);
  const familyIds = await seedFamilies(token, domainIds);
  await seedProducts(token, domainIds, familyIds);

  console.log('\n══════════════════════════════════════════');
  console.log('  ✅ DripX seed complete!');
  console.log('══════════════════════════════════════════');
  console.log('\n🔍 Verify:');
  console.log(`  Domains : ${BASE_URL}/api/product-domains?filters[brand][$eq]=dripx`);
  console.log(`  Families: ${BASE_URL}/api/product-families?filters[brand][$eq]=dripx`);
  console.log(`  Products: ${BASE_URL}/api/products?filters[brand][$eq]=dripx&pagination[pageSize]=25`);
}

main().catch(err => {
  console.error('\n❌ Seed failed:', err.message);
  process.exit(1);
});
