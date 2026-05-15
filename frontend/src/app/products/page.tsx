import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getAllDomains } from '@/lib/strapi-queries';

export const metadata: Metadata = {
  title: 'Our Products',
  description:
    'Explore the full Plexonics product range — enterprise networking, surveillance, displays, industrial solutions and more.',
};

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

export default async function ProductsPage() {
  const domains = await getAllDomains();

  return (
    <div>
      {/* Page header */}
      <div className="bg-ui-nearBlack text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="text-sm text-gray-400 mb-3" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <span className="mx-2">›</span>
            <span className="text-white">Products</span>
          </nav>
          <h1 className="text-4xl font-bold text-white">Our Products</h1>
          <p className="text-gray-300 mt-2 max-w-2xl">
            Enterprise-grade networking, surveillance, display, and industrial solutions.
          </p>
        </div>
      </div>

      {/* Domains grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {domains.map((domain) => (
            <Link
              key={domain.id}
              href={`/products/${domain.attributes.slug}`}
              className="group bg-white border border-ui-border rounded-sm p-6 hover:border-l-4 hover:border-l-brand-red hover:shadow-md transition-all duration-200"
            >
              <div className="text-4xl mb-4" aria-hidden="true">
                {domain.attributes.icon ||
                  domainIcons[domain.attributes.slug] ||
                  '📦'}
              </div>
              <h2 className="font-bold text-ui-nearBlack group-hover:text-brand-red transition-colors mb-2">
                {domain.attributes.name}
              </h2>
              {domain.attributes.shortDescription && (
                <p className="text-sm text-ui-charcoal line-clamp-3 mb-4">
                  {domain.attributes.shortDescription}
                </p>
              )}
              <span className="text-sm font-bold text-brand-red group-hover:underline">
                Explore →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
