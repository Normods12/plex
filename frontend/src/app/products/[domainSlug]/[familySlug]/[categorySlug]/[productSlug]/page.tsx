'use client';

import React, { useState } from 'react';
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

  const mainImageUrl = getStrapiMediaUrl(
    product.attributes.mainImage?.data?.attributes?.url
  );
  const galleryImages = product.attributes.gallery?.data ?? [];

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
            <span className="text-ui-nearBlack font-medium">{product.attributes.name}</span>
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
                  alt={product.attributes.mainImage?.data?.attributes?.alternativeText ?? product.attributes.name}
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
            {product.attributes.modelCode && (
              <p className="text-brand-red font-bold text-lg mb-1">
                {product.attributes.modelCode}
              </p>
            )}
            <h1 className="text-3xl font-bold text-ui-nearBlack mb-3">
              {product.attributes.name}
            </h1>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span
                className={
                  product.attributes.status === 'active'
                    ? 'badge-active'
                    : product.attributes.status === 'legacy'
                    ? 'badge-legacy'
                    : 'badge-discontinued'
                }
              >
                {product.attributes.status}
              </span>
              {product.attributes.isNDAA && (
                <span className="badge-ndaa">NDAA Compliant</span>
              )}
              {product.attributes.compliance?.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200"
                >
                  {c}
                </span>
              ))}
            </div>

            {product.attributes.shortDescription && (
              <p className="text-ui-charcoal mb-6 leading-relaxed">
                {product.attributes.shortDescription}
              </p>
            )}

            {/* Key features */}
            {product.attributes.keyFeatures?.length > 0 && (
              <div className="mb-6">
                <h3 className="font-bold text-ui-nearBlack mb-3">Key Features</h3>
                <ul className="space-y-1">
                  {product.attributes.keyFeatures.map((f) => (
                    <li key={f.id} className="flex items-start gap-2 text-sm text-ui-charcoal">
                      <span className="text-brand-red mt-0.5 flex-shrink-0">✓</span>
                      {f.text}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Quick download */}
            {product.attributes.datasheets?.data?.length > 0 && (
              <div className="mt-4">
                <Button
                  href={getStrapiMediaUrl(
                    product.attributes.datasheets.data[0].attributes.file?.data?.attributes?.url
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
        <ProductTabs product={product} />

        {/* Related products */}
        {product.attributes.relatedProducts?.data?.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-ui-nearBlack mb-6">Related Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {product.attributes.relatedProducts.data.map((related) => {
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

// ─── Tabs component (client) ──────────────────────────────────────────────────

type Tab = 'overview' | 'specifications' | 'downloads' | 'related';

function ProductTabs({ product }: { product: Awaited<ReturnType<typeof getProductBySlug>> }) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  if (!product) return null;

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'specifications', label: 'Specifications' },
    { id: 'downloads', label: 'Downloads' },
  ];

  const allDocs = [
    ...(product.attributes.datasheets?.data ?? []).map((d) => ({ ...d, docType: 'Datasheet' })),
    ...(product.attributes.manuals?.data ?? []).map((d) => ({ ...d, docType: 'Manual' })),
    ...(product.attributes.software?.data ?? []).map((d) => ({ ...d, docType: 'Software' })),
  ];

  return (
    <div>
      {/* Tab bar */}
      <div className="border-b border-ui-border mb-6">
        <div className="flex gap-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-brand-red text-brand-red'
                  : 'border-transparent text-ui-charcoal hover:text-brand-red'
              }`}
            >
              {tab.label}
              {tab.id === 'downloads' && allDocs.length > 0 && (
                <span className="ml-1.5 text-xs bg-brand-red text-white rounded-full px-1.5 py-0.5">
                  {allDocs.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="prose max-w-none text-ui-charcoal">
          {product.attributes.longDescription ? (
            <RichTextRenderer content={product.attributes.longDescription} />
          ) : product.attributes.shortDescription ? (
            <p>{product.attributes.shortDescription}</p>
          ) : (
            <p className="text-gray-400">No overview available.</p>
          )}
        </div>
      )}

      {activeTab === 'specifications' && (
        <div>
          {product.attributes.specs?.length > 0 ? (
            <table className="w-full border-collapse">
              <tbody>
                {product.attributes.specs.map((spec, i) => (
                  <tr
                    key={spec.id}
                    className={i % 2 === 0 ? 'bg-ui-lightGray' : 'bg-white'}
                  >
                    <td className="py-2.5 px-4 text-sm font-bold text-ui-nearBlack w-1/3 border border-ui-border">
                      {spec.label}
                    </td>
                    <td className="py-2.5 px-4 text-sm text-ui-charcoal border border-ui-border">
                      {spec.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-400">No specifications available.</p>
          )}
        </div>
      )}

      {activeTab === 'downloads' && (
        <div>
          {allDocs.length > 0 ? (
            <div className="space-y-3">
              {allDocs.map((doc) => {
                const fileUrl = getStrapiMediaUrl(
                  doc.attributes.file?.data?.attributes?.url
                );
                const fileExt = doc.attributes.file?.data?.attributes?.ext?.toUpperCase() ?? 'FILE';
                return (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 bg-white border border-ui-border rounded-sm hover:border-brand-red transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand-red text-white rounded-sm flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {fileExt === '.PDF' || fileExt === 'PDF' ? 'PDF' : fileExt}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-ui-nearBlack">
                          {doc.attributes.title}
                        </p>
                        <p className="text-xs text-ui-charcoal">
                          {doc.docType}
                          {doc.attributes.version && ` · v${doc.attributes.version}`}
                          {doc.attributes.language && ` · ${doc.attributes.language}`}
                        </p>
                      </div>
                    </div>
                    {fileUrl && (
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className="flex items-center gap-1.5 text-sm font-bold text-brand-red hover:text-brand-darkRed transition-colors"
                        aria-label={`Download ${doc.attributes.title}`}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-400">No downloads available for this product.</p>
          )}
        </div>
      )}
    </div>
  );
}

// Simple rich text renderer (Strapi blocks format)
function RichTextRenderer({ content }: { content: unknown }) {
  if (!content || !Array.isArray(content)) return null;

  return (
    <div className="space-y-4">
      {(content as Array<{ type: string; children?: Array<{ type: string; text?: string }> }>).map((block, i) => {
        if (block.type === 'paragraph') {
          return (
            <p key={i} className="text-ui-charcoal leading-relaxed">
              {block.children?.map((child, j) => (
                <span key={j}>{child.text}</span>
              ))}
            </p>
          );
        }
        if (block.type === 'heading') {
          return (
            <h3 key={i} className="text-lg font-bold text-ui-nearBlack">
              {block.children?.map((child, j) => (
                <span key={j}>{child.text}</span>
              ))}
            </h3>
          );
        }
        if (block.type === 'list') {
          return (
            <ul key={i} className="list-disc list-inside space-y-1">
              {block.children?.map((item, j) => (
                <li key={j} className="text-ui-charcoal text-sm">
                  {(item as { children?: Array<{ text?: string }> }).children?.map((c, k) => (
                    <span key={k}>{c.text}</span>
                  ))}
                </li>
              ))}
            </ul>
          );
        }
        return null;
      })}
    </div>
  );
}
