import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  getDomainBySlug,
  getFamilyBySlug,
  getCategoriesByFamily,
  getSeriesByFamily,
  getAllFamilySlugs,
} from '@/lib/strapi-queries';

interface Props {
  params: { domainSlug: string; familySlug: string };
}

export async function generateStaticParams() {
  const slugs = await getAllFamilySlugs();
  return slugs.map(({ domainSlug, familySlug }) => ({ domainSlug, familySlug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const family = await getFamilyBySlug(params.familySlug);
  if (!family) return { title: 'Not Found' };
  return {
    title: family.attributes.name,
    description: family.attributes.shortDescription ?? undefined,
  };
}

export default async function FamilyPage({ params }: Props) {
  const [domain, family, categories, series] = await Promise.all([
    getDomainBySlug(params.domainSlug),
    getFamilyBySlug(params.familySlug),
    getCategoriesByFamily(params.familySlug),
    getSeriesByFamily(params.familySlug),
  ]);

  if (!family) notFound();
  const fam = family!;

  const hasSeries = series.length > 0;

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
            <Link
              href={`/products/${params.domainSlug}`}
              className="hover:text-white transition-colors"
            >
              {domain?.attributes.name ?? params.domainSlug}
            </Link>
            <span className="mx-2">›</span>
            <span className="text-white">{fam.attributes.name}</span>
          </nav>
          <h1 className="text-4xl font-bold text-white">{fam.attributes.name}</h1>
          {fam.attributes.shortDescription && (
            <p className="text-gray-300 mt-2 max-w-2xl">
              {fam.attributes.shortDescription}
            </p>
          )}
        </div>
      </div>

      {/* Categories */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {categories.length === 0 ? (
          <p className="text-ui-charcoal text-center py-12">
            No categories found in this family yet.
          </p>
        ) : hasSeries ? (
          // Group categories under series headings (e.g. Enterprise Surveillance)
          <div className="space-y-10">
            {series.map((s) => {
              // For series-based families, categories are listed under each series
              // We show all categories and label the section with the series name
              return (
                <div key={s.id}>
                  <h2 className="text-xl font-bold text-ui-nearBlack mb-4 pb-2 border-b border-ui-border">
                    {s.attributes.name}
                    {s.attributes.seriesCode && (
                      <span className="ml-2 text-sm font-normal text-brand-red">
                        ({s.attributes.seriesCode})
                      </span>
                    )}
                  </h2>
                  <CategoryGrid
                    categories={categories}
                    domainSlug={params.domainSlug}
                    familySlug={params.familySlug}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <CategoryGrid
            categories={categories}
            domainSlug={params.domainSlug}
            familySlug={params.familySlug}
          />
        )}
      </div>
    </div>
  );
}

function CategoryGrid({
  categories,
  domainSlug,
  familySlug,
}: {
  categories: Array<{ id: number; attributes: { name: string; slug: string; shortDescription: string | null } }>;
  domainSlug: string;
  familySlug: string;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {categories.map((cat) => (
        <Link
          key={cat.id}
          href={`/products/${domainSlug}/${familySlug}/${cat.attributes.slug}`}
          className="group bg-white border border-ui-border rounded-sm p-5 hover:border-l-4 hover:border-l-brand-red hover:shadow-md transition-all duration-200"
        >
          <h3 className="font-bold text-ui-nearBlack group-hover:text-brand-red transition-colors mb-2">
            {cat.attributes.name}
          </h3>
          {cat.attributes.shortDescription && (
            <p className="text-sm text-ui-charcoal line-clamp-2 mb-3">
              {cat.attributes.shortDescription}
            </p>
          )}
          <span className="text-sm font-bold text-brand-red group-hover:underline">
            View Products →
          </span>
        </Link>
      ))}
    </div>
  );
}
