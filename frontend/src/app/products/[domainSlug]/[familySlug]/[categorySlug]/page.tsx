import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  getDomainBySlug,
  getFamilyBySlug,
  getCategoryBySlug,
  getProductsByCategory,
  getAllCategorySlugs,
} from '@/lib/strapi-queries';
import { ProductListing } from './ProductListing';

interface Props {
  params: { domainSlug: string; familySlug: string; categorySlug: string };
}

export async function generateStaticParams() {
  const slugs = await getAllCategorySlugs();
  return slugs.map(({ domainSlug, familySlug, categorySlug }) => ({
    domainSlug,
    familySlug,
    categorySlug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = await getCategoryBySlug(params.categorySlug);
  if (!category) return { title: 'Not Found' };
  return {
    title: category.attributes.name,
    description: category.attributes.shortDescription ?? undefined,
  };
}

export default async function CategoryPage({ params }: Props) {
  const [domain, family, category, products] = await Promise.all([
    getDomainBySlug(params.domainSlug),
    getFamilyBySlug(params.familySlug),
    getCategoryBySlug(params.categorySlug),
    getProductsByCategory(params.categorySlug),
  ]);

  if (!category) notFound();

  return (
    <div>
      {/* Header */}
      <div className="bg-ui-nearBlack text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="text-sm text-gray-400 mb-3" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span className="mx-2">›</span>
            <Link href="/products" className="hover:text-white transition-colors">Products</Link>
            <span className="mx-2">›</span>
            <Link href={`/products/${params.domainSlug}`} className="hover:text-white transition-colors">
              {domain?.attributes.name ?? params.domainSlug}
            </Link>
            <span className="mx-2">›</span>
            <Link href={`/products/${params.domainSlug}/${params.familySlug}`} className="hover:text-white transition-colors">
              {family?.attributes.name ?? params.familySlug}
            </Link>
            <span className="mx-2">›</span>
            <span className="text-white">{category.attributes.name}</span>
          </nav>
          <h1 className="text-4xl font-bold text-white">{category.attributes.name}</h1>
          {category.attributes.shortDescription && (
            <p className="text-gray-300 mt-2 max-w-2xl">
              {category.attributes.shortDescription}
            </p>
          )}
        </div>
      </div>

      {/* Product listing with client-side filters */}
      <ProductListing
        products={products}
        domainSlug={params.domainSlug}
        familySlug={params.familySlug}
        categorySlug={params.categorySlug}
      />
    </div>
  );
}
