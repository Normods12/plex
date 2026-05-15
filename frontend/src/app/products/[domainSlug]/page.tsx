import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  getDomainBySlug,
  getFamiliesByDomain,
  getAllDomainSlugs,
} from '@/lib/strapi-queries';
import { getStrapiMediaUrl } from '@/lib/strapi';

interface Props {
  params: { domainSlug: string };
}

export async function generateStaticParams() {
  const slugs = await getAllDomainSlugs();
  return slugs.map((slug) => ({ domainSlug: slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const domain = await getDomainBySlug(params.domainSlug);
  if (!domain) return { title: 'Not Found' };
  return {
    title: domain.attributes.name,
    description: domain.attributes.shortDescription ?? undefined,
  };
}

export default async function DomainPage({ params }: Props) {
  const [domain, families] = await Promise.all([
    getDomainBySlug(params.domainSlug),
    getFamiliesByDomain(params.domainSlug),
  ]);

  if (!domain) notFound();

  return (
    <div>
      {/* Domain hero */}
      <div className="bg-ui-nearBlack text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="text-sm text-gray-400 mb-3" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span className="mx-2">›</span>
            <Link href="/products" className="hover:text-white transition-colors">Products</Link>
            <span className="mx-2">›</span>
            <span className="text-white">{domain.attributes.name}</span>
          </nav>
          <h1 className="text-4xl font-bold text-white">{domain.attributes.name}</h1>
          {domain.attributes.shortDescription && (
            <p className="text-gray-300 mt-2 max-w-2xl">
              {domain.attributes.shortDescription}
            </p>
          )}
        </div>
      </div>

      {/* Families grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {families.length === 0 ? (
          <p className="text-ui-charcoal text-center py-12">
            No product families found in this domain yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {families.map((family) => {
              const heroUrl = getStrapiMediaUrl(
                family.attributes.heroImage?.data?.attributes?.url
              );
              return (
                <Link
                  key={family.id}
                  href={`/products/${params.domainSlug}/${family.attributes.slug}`}
                  className="group bg-white border border-ui-border rounded-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  {heroUrl ? (
                    <div className="relative h-40 bg-ui-lightGray">
                      <Image
                        src={heroUrl}
                        alt={family.attributes.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                  ) : (
                    <div className="h-40 bg-ui-lightGray flex items-center justify-center">
                      <span className="text-4xl" aria-hidden="true">📦</span>
                    </div>
                  )}
                  <div className="p-5">
                    <h2 className="font-bold text-ui-nearBlack group-hover:text-brand-red transition-colors mb-2">
                      {family.attributes.name}
                    </h2>
                    {family.attributes.shortDescription && (
                      <p className="text-sm text-ui-charcoal line-clamp-2 mb-3">
                        {family.attributes.shortDescription}
                      </p>
                    )}
                    <span className="text-sm font-bold text-brand-red group-hover:underline">
                      View Products →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
