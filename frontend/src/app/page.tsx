import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { fetchStrapi, getStrapiMediaUrl } from '@/lib/strapi';
import { Button } from '@/components/ui/Button';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductDomain {
  id: number;
  attributes: {
    name: string;
    slug: string;
    shortDescription: string;
    icon: string;
  };
}

interface Product {
  id: number;
  attributes: {
    name: string;
    modelCode: string;
    slug: string;
    shortDescription: string;
    status: 'active' | 'legacy' | 'discontinued';
    mainImage?: {
      data?: {
        attributes: { url: string; alternativeText: string };
      };
    };
    domain?: { data?: { attributes: { slug: string } } };
    family?: { data?: { attributes: { slug: string } } };
    category?: { data?: { attributes: { slug: string } } };
  };
}

// ─── Data fetching ─────────────────────────────────────────────────────────────

async function getHomeData() {
  const [domainsRes, productsRes] = await Promise.allSettled([
    fetchStrapi<ProductDomain[]>('/product-domains', {
      params: {
        'sort[0]': 'sortOrder:asc',
        'pagination[pageSize]': 8,
        'fields[0]': 'name',
        'fields[1]': 'slug',
        'fields[2]': 'shortDescription',
        'fields[3]': 'icon',
      },
    }),
    fetchStrapi<Product[]>('/products', {
      params: {
        'filters[status][$eq]': 'active',
        'sort[0]': 'updatedAt:desc',
        'pagination[pageSize]': 6,
        'populate[mainImage][fields][0]': 'url',
        'populate[mainImage][fields][1]': 'alternativeText',
        'populate[domain][fields][0]': 'slug',
        'populate[family][fields][0]': 'slug',
        'populate[category][fields][0]': 'slug',
        'fields[0]': 'name',
        'fields[1]': 'modelCode',
        'fields[2]': 'slug',
        'fields[3]': 'shortDescription',
        'fields[4]': 'status',
      },
    }),
  ]);

  return {
    domains: domainsRes.status === 'fulfilled' ? domainsRes.value.data : [],
    products: productsRes.status === 'fulfilled' ? productsRes.value.data : [],
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const { domains, products } = await getHomeData();

  return (
    <>
      <HeroSection />
      <DomainsGrid domains={domains} />
      <FeaturedProducts products={products} />
      <SolutionCallout />
      <WhyPlexonics />
    </>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section className="relative bg-brand-red text-white overflow-hidden">
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)',
          backgroundSize: '20px 20px',
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
            Enterprise-Grade Networking &amp; Surveillance Solutions
          </h1>
          <p className="text-lg md:text-xl text-red-100 mb-8 leading-relaxed">
            Plexonics delivers reliable, high-performance networking, surveillance, display, and industrial solutions trusted by enterprises across India.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button href="/products" variant="outline" size="lg">
              Explore Products
            </Button>
            <Button
              href="/contact"
              size="lg"
              className="bg-white text-brand-red hover:bg-gray-100 border-white"
            >
              Get in Touch
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Domains grid ─────────────────────────────────────────────────────────────

const domainIcons: Record<string, string> = {
  'enterprise-networking': '🌐',
  'enterprise-surveillance': '📷',
  'professional-displays': '🖥️',
  'industrial-networking': '🏭',
  'networking-pa-system': '📢',
  'video-conference': '🎥',
  'servers-storage': '🖧',
  'enterprise-software': '💻',
};

function DomainsGrid({ domains }: { domains: ProductDomain[] }) {
  return (
    <section className="bg-ui-lightGray py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-ui-nearBlack mb-3">
            Our Product Domains
          </h2>
          <p className="text-ui-charcoal max-w-2xl mx-auto">
            From enterprise networking to AI-powered surveillance — explore our complete range of technology solutions.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {domains.map((domain) => (
            <Link
              key={domain.id}
              href={`/products/${domain.attributes.slug}`}
              className="group bg-white border border-ui-border rounded-sm p-6 hover:border-l-4 hover:border-l-brand-red hover:shadow-md transition-all duration-200"
            >
              <div className="text-3xl mb-3" aria-hidden="true">
                {domain.attributes.icon || domainIcons[domain.attributes.slug] || '📦'}
              </div>
              <h3 className="font-bold text-ui-nearBlack group-hover:text-brand-red transition-colors mb-2">
                {domain.attributes.name}
              </h3>
              {domain.attributes.shortDescription && (
                <p className="text-sm text-ui-charcoal line-clamp-2 mb-3">
                  {domain.attributes.shortDescription}
                </p>
              )}
              <span className="text-sm font-bold text-brand-red group-hover:underline">
                Explore →
              </span>
            </Link>
          ))}

          {/* Fallback if no domains loaded */}
          {domains.length === 0 &&
            Object.entries(domainIcons).map(([slug, icon]) => (
              <Link
                key={slug}
                href={`/products/${slug}`}
                className="group bg-white border border-ui-border rounded-sm p-6 hover:border-l-4 hover:border-l-brand-red hover:shadow-md transition-all duration-200"
              >
                <div className="text-3xl mb-3" aria-hidden="true">
                  {icon}
                </div>
                <h3 className="font-bold text-ui-nearBlack group-hover:text-brand-red transition-colors mb-2 capitalize">
                  {slug.replace(/-/g, ' ')}
                </h3>
                <span className="text-sm font-bold text-brand-red group-hover:underline">
                  Explore →
                </span>
              </Link>
            ))}
        </div>
      </div>
    </section>
  );
}

// ─── Featured products ────────────────────────────────────────────────────────

function FeaturedProducts({ products }: { products: Product[] }) {
  if (products.length === 0) return null;

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold text-ui-nearBlack mb-2">
              Featured Products
            </h2>
            <p className="text-ui-charcoal">Latest additions to our product lineup</p>
          </div>
          <Button href="/products" variant="outline">
            View All
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => {
            const imageUrl = getStrapiMediaUrl(
              product.attributes.mainImage?.data?.attributes?.url
            );
            const imageAlt =
              product.attributes.mainImage?.data?.attributes?.alternativeText ||
              product.attributes.name;
            const domainSlug = product.attributes.domain?.data?.attributes?.slug;
            const familySlug = product.attributes.family?.data?.attributes?.slug;
            const categorySlug = product.attributes.category?.data?.attributes?.slug;
            const productHref =
              domainSlug && familySlug && categorySlug
                ? `/products/${domainSlug}/${familySlug}/${categorySlug}/${product.attributes.slug}`
                : `/products`;

            return (
              <div
                key={product.id}
                className="bg-white border border-ui-border rounded-sm overflow-hidden hover:shadow-md transition-shadow group"
              >
                <div className="relative h-48 bg-ui-lightGray">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={imageAlt}
                      fill
                      className="object-contain p-4"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-300">
                      <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  {product.attributes.modelCode && (
                    <p className="text-brand-red font-bold text-sm mb-1">
                      {product.attributes.modelCode}
                    </p>
                  )}
                  <h3 className="font-bold text-ui-nearBlack group-hover:text-brand-red transition-colors mb-2 line-clamp-2">
                    {product.attributes.name}
                  </h3>
                  {product.attributes.shortDescription && (
                    <p className="text-sm text-ui-charcoal line-clamp-2 mb-4">
                      {product.attributes.shortDescription}
                    </p>
                  )}
                  <Button href={productHref} variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Solution callout ─────────────────────────────────────────────────────────

function SolutionCallout() {
  return (
    <section className="bg-ui-lightGray py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-ui-nearBlack mb-4">
          Trusted Networking &amp; Surveillance Solutions
        </h2>
        <p className="text-ui-charcoal max-w-2xl mx-auto mb-8 text-lg">
          From small offices to large enterprise deployments — Plexonics has the right solution for your infrastructure needs.
        </p>
        <Button href="/contact" size="lg">
          Talk to an Expert
        </Button>
      </div>
    </section>
  );
}

// ─── Why Plexonics ────────────────────────────────────────────────────────────

const differentiators = [
  {
    icon: '🏆',
    title: 'Proven Reliability',
    text: 'Products tested to enterprise standards with multi-year warranties and dedicated support.',
  },
  {
    icon: '🔒',
    title: 'NDAA Compliant',
    text: 'Select products meet NDAA Section 889 compliance requirements for government and sensitive deployments.',
  },
  {
    icon: '🛠️',
    title: 'End-to-End Support',
    text: 'From pre-sales consultation to post-deployment support — our team is with you at every step.',
  },
];

function WhyPlexonics() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-ui-nearBlack mb-3">
            Why Plexonics?
          </h2>
          <p className="text-ui-charcoal max-w-xl mx-auto">
            We combine enterprise-grade hardware with local expertise and support.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {differentiators.map((item) => (
            <div key={item.title} className="text-center p-6">
              <div className="text-4xl mb-4" aria-hidden="true">
                {item.icon}
              </div>
              <h3 className="font-bold text-ui-nearBlack text-lg mb-3">
                {item.title}
              </h3>
              <p className="text-ui-charcoal text-sm leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
