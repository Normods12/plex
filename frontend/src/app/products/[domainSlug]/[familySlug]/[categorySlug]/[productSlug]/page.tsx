import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  getProductBySlug,
  getDomainBySlug,
  getFamilyBySlug,
  getCategoryBySlug,
  getAllProductSlugs,
} from '@/lib/strapi-queries';
import { getStrapiMediaUrl } from '@/lib/strapi';
import { Button } from '@/components/ui/Button';
import { ProductTabs } from './ProductTabs';

interface Props {
  params: {
    domainSlug: string;
    familySlug: string;
    categorySlug: string;
    productSlug: string;
  };
}

export async function generateStaticParams() {
  const slugs = await getAllProductSlugs();
  return slugs.map(({ domainSlug, familySlug, categorySlug, productSlug }) => ({
    domainSlug,
    familySlug,
    categorySlug,
    productSlug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProductBySlug(params.productSlug);
  if (!product) return { title: 'Not Found' };
  return {
    title: product.attributes.seo?.metaTitle ?? product.attributes.name,
    description:
      product.attributes.seo?.metaDescription ??
      product.attributes.shortDescription ??
      undefined,
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const [domain, family, category, product] = await Promise.all([
    getDomainBySlug(params.domainSlug),
    getFamilyBySlug(params.familySlug),
    getCategoryBySlug(params.categorySlug),
    getProductBySlug(params.productSlug),
  ]);

  if (!product) notFound();
  // After notFound(), product is guaranteed non-null
  const p = product!;

  const mainImageUrl = getStrapiMediaUrl(
    p.attributes.mainImage?.data?.attributes?.url
  );
  const galleryImages = p.attributes.gallery?.data ?? [];

  return (
    <div>
      {/* Breadcrumb */}
      <div className="bg-ui-lightGray border-b border-ui-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="text-sm text-ui-charcoal" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-brand-red transition-colors">Home</Link>
            <span className="mx-2">›</span>
            <Link href="/products" className="hover:text-brand-red transition-colors">Products</Link>
            <span className="mx-2">›</span>
            <Link href={`/products/${params.domainSlug}`} className="hover:text-brand-red transition-colors">
              {domain?.attributes.name ?? params.domainSlug}
            </Link>
            <span className="mx-2">›</span>
            <Link href={`/products/${params.domainSlug}/${params.familySlug}`} className="hover:text-brand-red transition-colors">
              {family?.attributes.name ?? params.familySlug}
            </Link>
            <span className="mx-2">›</span>
            <Link href={`/products/${params.domainSlug}/${params.familySlug}/${params.categorySlug}`} className="hover:text-brand-red transition-colors">
              {category?.attributes.name ?? params.categorySlug}
            </Link>
            <span className="mx-2">›</span>
            <span className="text-ui-nearBlack font-medium">{p.attributes.name}</span>
          </nav>
        </div>
      </div>

      {/* Product detail */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
          {/* Left: Images */}
          <div>
            <div className="relative h-80 bg-ui-lightGray border border-ui-border rounded-sm mb-3">
              {mainImageUrl ? (
                <Image
                  src={mainImageUrl}
                  alt={p.attributes.mainImage?.data?.attributes?.alternativeText ?? p.attributes.name}
                  fill
                  className="object-contain p-6"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-300">
                  <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
            {/* Gallery thumbnails */}
            {galleryImages.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {galleryImages.map((img) => (
                  <div
                    key={img.id}
                    className="relative w-16 h-16 border border-ui-border rounded-sm bg-ui-lightGray overflow-hidden cursor-pointer hover:border-brand-red transition-colors"
                  >
                    <Image
                      src={getStrapiMediaUrl(img.attributes.url)}
                      alt={img.attributes.alternativeText ?? ''}
                      fill
                      className="object-contain p-1"
                      sizes="64px"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Info */}
          <div>
            {p.attributes.modelCode && (
              <p className="text-brand-red font-bold text-lg mb-1">
                {p.attributes.modelCode}
              </p>
            )}
            <h1 className="text-3xl font-bold text-ui-nearBlack mb-3">
              {p.attributes.name}
            </h1>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span
                className={
                  p.attributes.status === 'active'
                    ? 'badge-active'
                    : p.attributes.status === 'legacy'
                    ? 'badge-legacy'
                    : 'badge-discontinued'
                }
              >
                {p.attributes.status}
              </span>
              {p.attributes.isNDAA && (
                <span className="badge-ndaa">NDAA Compliant</span>
              )}
              {p.attributes.compliance?.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200"
                >
                  {c}
                </span>
              ))}
            </div>

            {p.attributes.shortDescription && (
              <p className="text-ui-charcoal mb-6 leading-relaxed">
                {p.attributes.shortDescription}
              </p>
            )}

            {/* Key features */}
            {p.attributes.keyFeatures?.length > 0 && (
              <div className="mb-6">
                <h3 className="font-bold text-ui-nearBlack mb-3">Key Features</h3>
                <ul className="space-y-1">
                  {p.attributes.keyFeatures.map((f) => (
                    <li key={f.id} className="flex items-start gap-2 text-sm text-ui-charcoal">
                      <span className="text-brand-red mt-0.5 flex-shrink-0">✓</span>
                      {f.text}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Quick download */}
            {p.attributes.datasheets?.data?.length > 0 && (
              <div className="mt-4">
                <Button
                  href={getStrapiMediaUrl(
                    p.attributes.datasheets.data[0].attributes.file?.data?.attributes?.url
                  )}
                  variant="outline"
                  size="sm"
                >
                  Download Datasheet
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <ProductTabs product={p} />

        {p.attributes.relatedProducts?.data?.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-ui-nearBlack mb-6">Related Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {p.attributes.relatedProducts.data.map((related) => {
                const relatedImage = getStrapiMediaUrl(
                  related.attributes.mainImage?.data?.attributes?.url
                );
                return (
                  <Link
                    key={related.id}
                    href={`/products/${params.domainSlug}/${params.familySlug}/${params.categorySlug}/${related.attributes.slug}`}
                    className="group bg-white border border-ui-border rounded-sm overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="relative h-32 bg-ui-lightGray">
                      {relatedImage ? (
                        <Image
                          src={relatedImage}
                          alt={related.attributes.name}
                          fill
                          className="object-contain p-3"
                          sizes="25vw"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-300">
                          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      {related.attributes.modelCode && (
                        <p className="text-brand-red font-bold text-xs mb-0.5">
                          {related.attributes.modelCode}
                        </p>
                      )}
                      <p className="text-sm font-bold text-ui-nearBlack group-hover:text-brand-red transition-colors line-clamp-2">
                        {related.attributes.name}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


