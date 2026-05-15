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
    await ensureFrontendApiToken(strapi);
  },
};

/**
 * Ensure the Public role has find/findOne on all content types,
 * and does NOT have create/update/delete on any.
 */
async function setupPublicPermissions(strapi: Core.Strapi) {
  const pluginStore = strapi.store({
    environment: '',
    type: 'plugin',
    name: 'users-permissions',
  });

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
    // Derive the controller name from the uid (e.g. api::product.product → product)
    const parts = uid.split('.');
    const controllerName = parts[parts.length - 1];

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
 * Ensure a "Frontend Read Token" API token exists with read-only access.
 */
async function ensureFrontendApiToken(strapi: Core.Strapi) {
  const tokenName = 'Frontend Read Token';

  try {
    const existingTokens = await strapi.service('admin::api-token').list();
    const exists = existingTokens?.some(
      (t: { name: string }) => t.name === tokenName
    );

    if (!exists) {
      await strapi.service('admin::api-token').create({
        name: tokenName,
        description: 'Read-only token for the Next.js frontend',
        type: 'read-only',
        lifespan: null, // never expires
      });
      strapi.log.info(`[bootstrap] Created API token: "${tokenName}"`);
    } else {
      strapi.log.info(`[bootstrap] API token "${tokenName}" already exists`);
    }
  } catch (err) {
    strapi.log.warn(`[bootstrap] Could not create API token: ${err}`);
  }
}
