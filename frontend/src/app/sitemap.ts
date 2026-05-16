import type { MetadataRoute } from 'next';
import {
  getAllDomains,
  getAllFamilySlugs,
  getAllCategorySlugs,
  getAllProductSlugs,
} from '@/lib/strapi-queries';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.plexonics.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  // Static pages
  const staticPages = [
    { url: '/', priority: 1.0, changeFrequency: 'weekly' as const },
    { url: '/products', priority: 0.9, changeFrequency: 'weekly' as const },
    { url: '/about/about-us', priority: 0.7, changeFrequency: 'monthly' as const },
    { url: '/about/our-milestones', priority: 0.6, changeFrequency: 'monthly' as const },
    { url: '/about/partner-program', priority: 0.6, changeFrequency: 'monthly' as const },
    { url: '/about/e-waste-management', priority: 0.5, changeFrequency: 'monthly' as const },
    { url: '/support', priority: 0.7, changeFrequency: 'monthly' as const },
    { url: '/support/product-registration', priority: 0.6, changeFrequency: 'monthly' as const },
    { url: '/support/learning-center', priority: 0.6, changeFrequency: 'weekly' as const },
    { url: '/support/warranty-policy', priority: 0.5, changeFrequency: 'monthly' as const },
    { url: '/contact', priority: 0.8, changeFrequency: 'monthly' as const },
    { url: '/legal/privacy-policy', priority: 0.3, changeFrequency: 'yearly' as const },
    { url: '/legal/terms-of-use', priority: 0.3, changeFrequency: 'yearly' as const },
  ];

  for (const page of staticPages) {
    entries.push({
      url: `${BASE_URL}${page.url}`,
      lastModified: new Date(),
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    });
  }

  // Dynamic product pages — wrap in try/catch so sitemap still generates if Strapi is down
  try {
    const [domains, familySlugs, categorySlugs, productSlugs] = await Promise.all([
      getAllDomains(),
      getAllFamilySlugs(),
      getAllCategorySlugs(),
      getAllProductSlugs(),
    ]);

    // Domain pages
    for (const domain of domains) {
      entries.push({
        url: `${BASE_URL}/products/${domain.attributes.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }

    // Family pages
    for (const { domainSlug, familySlug } of familySlugs) {
      entries.push({
        url: `${BASE_URL}/products/${domainSlug}/${familySlug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }

    // Category pages
    for (const { domainSlug, familySlug, categorySlug } of categorySlugs) {
      entries.push({
        url: `${BASE_URL}/products/${domainSlug}/${familySlug}/${categorySlug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }

    // Product detail pages
    for (const { domainSlug, familySlug, categorySlug, productSlug } of productSlugs) {
      entries.push({
        url: `${BASE_URL}/products/${domainSlug}/${familySlug}/${categorySlug}/${productSlug}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.6,
      });
    }
  } catch (err) {
    console.error('[sitemap] Failed to fetch dynamic routes from Strapi:', err);
  }

  return entries;
}
