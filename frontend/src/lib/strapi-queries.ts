import { fetchStrapi } from './strapi';

// ─── Shared types ──────────────────────────────────────────────────────────────

export interface StrapiImage {
  data?: {
    id: number;
    attributes: {
      url: string;
      alternativeText: string | null;
      width: number;
      height: number;
    };
  };
}

export interface StrapiImages {
  data?: Array<{
    id: number;
    attributes: {
      url: string;
      alternativeText: string | null;
      width: number;
      height: number;
    };
  }>;
}

export interface StrapiFile {
  data?: {
    id: number;
    attributes: {
      url: string;
      name: string;
      size: number;
      ext: string;
    };
  };
}

// ─── Domain types ──────────────────────────────────────────────────────────────

export interface ProductDomain {
  id: number;
  attributes: {
    name: string;
    slug: string;
    shortDescription: string | null;
    icon: string | null;
    sortOrder: number;
  };
}

export interface ProductFamily {
  id: number;
  attributes: {
    name: string;
    slug: string;
    shortDescription: string | null;
    heroImage: StrapiImage;
    showInNav: boolean;
    sortOrder: number;
    domain?: { data: { id: number; attributes: { name: string; slug: string } } };
  };
}

export interface ProductCategory {
  id: number;
  attributes: {
    name: string;
    slug: string;
    shortDescription: string | null;
    sortOrder: number;
    family?: { data: { id: number; attributes: { name: string; slug: string } } };
  };
}

export interface ProductSeries {
  id: number;
  attributes: {
    name: string;
    slug: string;
    seriesCode: string | null;
    sortOrder: number;
  };
}

export interface ProductListItem {
  id: number;
  attributes: {
    name: string;
    modelCode: string | null;
    slug: string;
    shortDescription: string | null;
    status: 'active' | 'legacy' | 'discontinued';
    isNDAA: boolean;
    tags: string[] | null;
    mainImage: StrapiImage;
    domain?: { data: { attributes: { slug: string } } };
    family?: { data: { attributes: { slug: string } } };
    category?: { data: { attributes: { slug: string } } };
  };
}

export interface ProductDetail extends ProductListItem {
  attributes: ProductListItem['attributes'] & {
    longDescription: unknown;
    applications: unknown;
    compliance: string[] | null;
    keyFeatures: Array<{ id: number; text: string }>;
    specs: Array<{ id: number; label: string; value: string }>;
    gallery: StrapiImages;
    datasheets: {
      data: Array<{
        id: number;
        attributes: {
          title: string;
          slug: string;
          type: string;
          file: StrapiFile;
          version: string | null;
          language: string;
        };
      }>;
    };
    manuals: {
      data: Array<{
        id: number;
        attributes: {
          title: string;
          slug: string;
          type: string;
          file: StrapiFile;
          version: string | null;
          language: string;
        };
      }>;
    };
    software: {
      data: Array<{
        id: number;
        attributes: {
          title: string;
          slug: string;
          type: string;
          file: StrapiFile;
          version: string | null;
          language: string;
        };
      }>;
    };
    relatedProducts: { data: ProductListItem[] };
    seo: {
      metaTitle: string | null;
      metaDescription: string | null;
      canonicalUrl: string | null;
      ogImage: StrapiImage;
    } | null;
    series?: { data: { attributes: { name: string; slug: string } } | null };
  };
}

// ─── Query functions ───────────────────────────────────────────────────────────

export async function getAllDomains(): Promise<ProductDomain[]> {
  const res = await fetchStrapi<ProductDomain[]>('/product-domains', {
    params: {
      'sort[0]': 'sortOrder:asc',
      'pagination[pageSize]': 20,
    },
  });
  return res.data;
}

export async function getDomainBySlug(slug: string): Promise<ProductDomain | null> {
  const res = await fetchStrapi<ProductDomain[]>('/product-domains', {
    params: {
      'filters[slug][$eq]': slug,
      'pagination[pageSize]': 1,
    },
  });
  return res.data[0] ?? null;
}

export async function getFamiliesByDomain(domainSlug: string): Promise<ProductFamily[]> {
  const res = await fetchStrapi<ProductFamily[]>('/product-families', {
    params: {
      'filters[domain][slug][$eq]': domainSlug,
      'populate[heroImage][fields][0]': 'url',
      'populate[heroImage][fields][1]': 'alternativeText',
      'populate[domain][fields][0]': 'name',
      'populate[domain][fields][1]': 'slug',
      'sort[0]': 'sortOrder:asc',
      'pagination[pageSize]': 50,
    },
  });
  return res.data;
}

export async function getFamilyBySlug(slug: string): Promise<ProductFamily | null> {
  const res = await fetchStrapi<ProductFamily[]>('/product-families', {
    params: {
      'filters[slug][$eq]': slug,
      'populate[heroImage][fields][0]': 'url',
      'populate[heroImage][fields][1]': 'alternativeText',
      'populate[domain][fields][0]': 'name',
      'populate[domain][fields][1]': 'slug',
      'pagination[pageSize]': 1,
    },
  });
  return res.data[0] ?? null;
}

export async function getCategoriesByFamily(familySlug: string): Promise<ProductCategory[]> {
  const res = await fetchStrapi<ProductCategory[]>('/product-categories', {
    params: {
      'filters[family][slug][$eq]': familySlug,
      'populate[family][fields][0]': 'name',
      'populate[family][fields][1]': 'slug',
      'sort[0]': 'sortOrder:asc',
      'pagination[pageSize]': 50,
    },
  });
  return res.data;
}

export async function getCategoryBySlug(slug: string): Promise<ProductCategory | null> {
  const res = await fetchStrapi<ProductCategory[]>('/product-categories', {
    params: {
      'filters[slug][$eq]': slug,
      'populate[family][fields][0]': 'name',
      'populate[family][fields][1]': 'slug',
      'pagination[pageSize]': 1,
    },
  });
  return res.data[0] ?? null;
}

export async function getProductsByCategory(categorySlug: string): Promise<ProductListItem[]> {
  const res = await fetchStrapi<ProductListItem[]>('/products', {
    params: {
      'filters[category][slug][$eq]': categorySlug,
      'populate[mainImage][fields][0]': 'url',
      'populate[mainImage][fields][1]': 'alternativeText',
      'populate[domain][fields][0]': 'slug',
      'populate[family][fields][0]': 'slug',
      'populate[category][fields][0]': 'slug',
      'sort[0]': 'name:asc',
      'pagination[pageSize]': 100,
    },
  });
  return res.data;
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  const res = await fetchStrapi<ProductDetail[]>('/products', {
    params: {
      'filters[slug][$eq]': slug,
      populate: 'deep',
      'pagination[pageSize]': 1,
    },
  });
  return res.data[0] ?? null;
}

export async function getSeriesByFamily(familySlug: string): Promise<ProductSeries[]> {
  const res = await fetchStrapi<ProductSeries[]>('/product-series', {
    params: {
      'filters[family][slug][$eq]': familySlug,
      'sort[0]': 'sortOrder:asc',
      'pagination[pageSize]': 20,
    },
  });
  return res.data;
}

// Static params helpers for generateStaticParams

export async function getAllDomainSlugs(): Promise<string[]> {
  const domains = await getAllDomains();
  return domains.map((d) => d.attributes.slug);
}

export async function getAllFamilySlugs(): Promise<Array<{ domainSlug: string; familySlug: string }>> {
  const res = await fetchStrapi<ProductFamily[]>('/product-families', {
    params: {
      'populate[domain][fields][0]': 'slug',
      'pagination[pageSize]': 200,
    },
  });
  return res.data
    .filter((f) => f.attributes.domain?.data)
    .map((f) => ({
      domainSlug: f.attributes.domain!.data.attributes.slug,
      familySlug: f.attributes.slug,
    }));
}

export async function getAllCategorySlugs(): Promise<
  Array<{ domainSlug: string; familySlug: string; categorySlug: string }>
> {
  const res = await fetchStrapi<ProductCategory[]>('/product-categories', {
    params: {
      'populate[family][populate][domain][fields][0]': 'slug',
      'populate[family][fields][0]': 'slug',
      'pagination[pageSize]': 500,
    },
  });
  return res.data
    .filter((c) => c.attributes.family?.data)
    .map((c) => ({
      domainSlug:
        (c.attributes.family as unknown as {
          data: { attributes: { domain?: { data?: { attributes: { slug: string } } }; slug: string } };
        }).data.attributes.domain?.data?.attributes.slug ?? '',
      familySlug: c.attributes.family!.data.attributes.slug,
      categorySlug: c.attributes.slug,
    }))
    .filter((c) => c.domainSlug);
}

export async function getAllProductSlugs(): Promise<
  Array<{ domainSlug: string; familySlug: string; categorySlug: string; productSlug: string }>
> {
  const res = await fetchStrapi<ProductListItem[]>('/products', {
    params: {
      'populate[domain][fields][0]': 'slug',
      'populate[family][fields][0]': 'slug',
      'populate[category][fields][0]': 'slug',
      'fields[0]': 'slug',
      'pagination[pageSize]': 1000,
    },
  });
  return res.data
    .filter(
      (p) =>
        p.attributes.domain?.data &&
        p.attributes.family?.data &&
        p.attributes.category?.data
    )
    .map((p) => ({
      domainSlug: p.attributes.domain!.data.attributes.slug,
      familySlug: p.attributes.family!.data.attributes.slug,
      categorySlug: p.attributes.category!.data.attributes.slug,
      productSlug: p.attributes.slug,
    }));
}
