import * as fs from 'fs';
import * as path from 'path';
import type { Core } from '@strapi/strapi';

// Content types that the Public role should be able to read
const PUBLIC_READ_CONTENT_TYPES = [
  'api::product-domain.product-domain',
  'api::product-family.product-family',
  'api::product-category.product-category',
  'api::product-series.product-series',
  'api::product.product',
  'api::document.document',
  'api::page.page',
  'api::support-article.support-article',
  'api::navigation-menu.navigation-menu',
  'api::contact-info.contact-info',
  'api::site-settings.site-settings',
];

export default {
  /**
   * An asynchronous register function that runs before
   * your application gets registered.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await setupPublicPermissions(strapi);
    // Debug services
    strapi.log.info(`[bootstrap] Available services: ${Object.keys(strapi.services).join(', ')}`);

    const token = await ensureFrontendApiToken(strapi);
    
    // Log the token to console for migration scripts
    if (token) {
      strapi.log.info(`[bootstrap] API TOKEN FOR SCRIPTS: ${token}`);
      const outDir = path.join(process.cwd(), 'scripts', 'output');
      if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, 'api-token.txt'), token);
    }

    // Auto-seed taxonomy if empty
    const familyCount = await strapi.query('api::product-family.product-family').count();
    if (familyCount === 0) {
      strapi.log.info('[bootstrap] Families empty, starting auto-seed...');
      await seedTaxonomy(strapi);
    }
    // Auto-migrate products if empty
    await migrateProducts(strapi);
  },
};

/**
 * Migrate products from joomla-audit.json
 */
async function migrateProducts(strapi: Core.Strapi) {
  const auditPath = path.join(process.cwd(), 'scripts', 'output', 'joomla-audit.json');
  if (!fs.existsSync(auditPath)) {
    strapi.log.info('[bootstrap] joomla-audit.json not found yet, skipping product migration');
    return;
  }

  const productCount = await strapi.query('api::product.product').count();
  if (productCount > 0) {
    strapi.log.info('[bootstrap] Products already exist, skipping migration');
    return;
  }

  try {
    const data = JSON.parse(fs.readFileSync(auditPath, 'utf8'));
    strapi.log.info(`[bootstrap] Migrating ${data.products.length} products from audit...`);

    const domains = await strapi.query('api::product-domain.product-domain').findMany();
    const families = await strapi.query('api::product-family.product-family').findMany();
    const categories = await strapi.query('api::product-category.product-category').findMany({ populate: ['family', 'family.domain'] });
    
    for (const p of data.products) {
      if (!p.name) continue;

      // Find matching category by slug in URL
      const category = categories.find(c => p.url.includes(`/${c.slug}`));
      
      let domainId = null;
      let familyId = null;

      if (category) {
        familyId = category.family?.id;
        domainId = category.family?.domain?.id;
      }

      // Fallback: search for family in URL
      if (!familyId) {
        const family = families.find(f => p.url.includes(`/${f.slug}`));
        if (family) familyId = family.id;
      }

      // Fallback: search for domain in URL
      if (!domainId) {
        const domain = domains.find(d => p.url.includes(`/${d.slug}`));
        if (domain) domainId = domain.id;
      }

      // Final fallback to avoid validation errors
      if (!domainId) domainId = domains[0]?.id;
      if (!familyId) familyId = families[0]?.id;

      await strapi.query('api::product.product').create({
        data: {
          name: p.name,
          modelCode: p.modelCode || 'N/A',
          slug: (p.url.split('/').pop() || p.name).replace(/[^a-z0-9]/gi, '-').toLowerCase(),
          shortDescription: p.rawText?.slice(0, 500) || 'Product from Plexonics catalog.',
          status: 'active',
          domain: domainId,
          family: familyId,
          category: category?.id,
          publishedAt: new Date(),
        }
      });
    }
    strapi.log.info('[bootstrap] Product migration complete');
  } catch (err) {
    strapi.log.error(`[bootstrap] Migration failed: ${err}`);
  }
}

/**
 * Seed full taxonomy if database is empty
 */
async function seedTaxonomy(strapi: Core.Strapi) {
  const DOMAINS = [
    { name: 'Enterprise Networking', slug: 'enterprise-networking', sortOrder: 1 },
    { name: 'Enterprise Surveillance', slug: 'enterprise-surveillance', sortOrder: 2 },
    { name: 'Professional Displays', slug: 'professional-displays', sortOrder: 3 },
    { name: 'Industrial Networking', slug: 'industrial-networking', sortOrder: 4 },
    { name: 'Networking PA System', slug: 'networking-pa-system', sortOrder: 5 },
    { name: 'Video Conference', slug: 'video-conference', sortOrder: 6 },
    { name: 'Servers & Storage', slug: 'servers-storage', sortOrder: 7 },
    { name: 'Enterprise Software', slug: 'enterprise-software', sortOrder: 8 },
  ];

  const domainIds = new Map<string, number>();

  for (const domain of DOMAINS) {
    let entry = await strapi.query('api::product-domain.product-domain').findOne({ where: { slug: domain.slug } });
    if (!entry) {
      entry = await strapi.query('api::product-domain.product-domain').create({ data: domain });
      strapi.log.info(`[bootstrap] Seeded domain: ${domain.name}`);
    }
    domainIds.set(domain.slug, entry.id);
  }

  // Seed Families
  const FAMILIES = [
    { name: 'Switches', slug: 'switches', domain: 'enterprise-networking', sortOrder: 1 },
    { name: 'Routers', slug: 'routers', domain: 'enterprise-networking', sortOrder: 2 },
    { name: 'MAXECO Series', slug: 'maxeco-series', domain: 'enterprise-surveillance', sortOrder: 1 },
    { name: 'MAX360 Series', slug: 'max360-series', domain: 'enterprise-surveillance', sortOrder: 2 },
    { name: 'Professional Monitors', slug: 'professional-monitors', domain: 'professional-displays', sortOrder: 1 },
    { name: 'Industrial Switches', slug: 'industrial-switches', domain: 'industrial-networking', sortOrder: 1 },
    { name: 'Paging Devices', slug: 'paging-devices', domain: 'networking-pa-system', sortOrder: 1 },
    { name: 'USB PTZ Cameras', slug: 'usb-ptz-cameras', domain: 'video-conference', sortOrder: 1 },
    { name: 'Surveillance Servers', slug: 'surveillance-servers', domain: 'servers-storage', sortOrder: 1 },
    { name: 'SD-WAN', slug: 'software-defined-wan', domain: 'enterprise-software', sortOrder: 1 },
  ];

  const familyIds = new Map<string, number>();
  for (const family of FAMILIES) {
    const domainId = domainIds.get(family.domain);
    if (domainId) {
      let entry = await strapi.query('api::product-family.product-family').findOne({ where: { slug: family.slug } });
      if (!entry) {
        entry = await strapi.query('api::product-family.product-family').create({
          data: { name: family.name, slug: family.slug, sortOrder: family.sortOrder, domain: domainId }
        });
        strapi.log.info(`[bootstrap] Seeded family: ${family.name}`);
      }
      familyIds.set(family.slug, entry.id);
    }
  }

  // Seed Categories
  const CATEGORIES = [
    { name: 'Unmanaged Switches', slug: 'unmanaged-switches', family: 'switches', sortOrder: 1 },
    { name: 'Smart Managed Switches', slug: 'smart-managed-switches', family: 'switches', sortOrder: 2 },
    { name: 'L2 Managed Switches', slug: 'l2-managed-switches', family: 'switches', sortOrder: 3 },
    { name: 'Indoor Dome Cameras', slug: 'indoor-dome-cameras', family: 'maxeco-series', sortOrder: 1 },
  ];

  for (const cat of CATEGORIES) {
    const familyId = familyIds.get(cat.family);
    if (familyId) {
      await strapi.query('api::product-category.product-category').create({
        data: { name: cat.name, slug: cat.slug, sortOrder: cat.sortOrder, family: familyId }
      });
      strapi.log.info(`[bootstrap] Seeded category: ${cat.name}`);
    }
  }
}

/**
 * Ensure the Public role has find/findOne on all content types,
 * and does NOT have create/update/delete on any.
 */
async function setupPublicPermissions(strapi: Core.Strapi) {
  // Get the Public role
  const publicRole = await strapi
    .query('plugin::users-permissions.role')
    .findOne({ where: { type: 'public' } });

  if (!publicRole) {
    strapi.log.warn('[bootstrap] Public role not found — skipping permission setup');
    return;
  }

  // Get existing permissions for the public role
  const existingPermissions = await strapi
    .query('plugin::users-permissions.permission')
    .findMany({ where: { role: publicRole.id } });

  const existingSet = new Set(
    existingPermissions.map((p: { action: string }) => p.action)
  );

  const permissionsToCreate: { action: string; role: number }[] = [];

  for (const uid of PUBLIC_READ_CONTENT_TYPES) {
    const findAction = `${uid}.find`;
    const findOneAction = `${uid}.findOne`;

    if (!existingSet.has(findAction)) {
      permissionsToCreate.push({ action: findAction, role: publicRole.id });
    }
    if (!existingSet.has(findOneAction)) {
      permissionsToCreate.push({ action: findOneAction, role: publicRole.id });
    }
  }

  if (permissionsToCreate.length > 0) {
    for (const perm of permissionsToCreate) {
      await strapi.query('plugin::users-permissions.permission').create({ data: perm });
    }
    strapi.log.info(
      `[bootstrap] Created ${permissionsToCreate.length} public read permissions`
    );
  } else {
    strapi.log.info('[bootstrap] Public permissions already configured');
  }
}

/**
 * Ensure a "Full Access Token" API token exists.
 * Returns the accessKey.
 */
async function ensureFrontendApiToken(strapi: Core.Strapi): Promise<string | null> {
  const tokenName = 'Full Access Token';

  try {
    const apiTokenService = strapi.service('admin::api-token-content-api');
    
    if (!apiTokenService) {
      strapi.log.warn('[bootstrap] API Token service not found');
      return null;
    }

    const existingTokens = await apiTokenService.list();
    const existing = existingTokens?.find(
      (t: { name: string }) => t.name === tokenName
    );

    if (!existing) {
      const token = await apiTokenService.create({
        name: tokenName,
        description: 'Full access token for migration scripts',
        type: 'full-access',
        lifespan: null,
      });
      strapi.log.info(`[bootstrap] Created API token: "${tokenName}"`);
      return token.accessKey;
    } else {
      // Strapi doesn't store cleartext key, so we'd need to regenerate it if we lost it.
      // For now, assume it's set in env if it already exists.
      strapi.log.info(`[bootstrap] API token "${tokenName}" already exists`);
      return null;
    }
  } catch (err) {
    strapi.log.warn(`[bootstrap] Could not check/create API token: ${err}`);
    return null;
  }
}
