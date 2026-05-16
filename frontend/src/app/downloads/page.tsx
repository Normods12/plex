import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Downloads',
  description: 'Download datasheets, manuals, and software for Plexonics products.',
};

export default function DownloadsPage() {
  return (
    <div>
      <div className="bg-ui-nearBlack text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="text-sm text-gray-400 mb-3" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span className="mx-2">›</span>
            <span className="text-white">Downloads</span>
          </nav>
          <h1 className="text-4xl font-bold text-white">Downloads</h1>
          <p className="text-gray-300 mt-2">
            Product datasheets, manuals, and software are available on each product page.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <p className="text-ui-charcoal mb-6">
          To find downloads for a specific product, browse the product catalog and open the product detail page. Downloads are listed under the <strong>Downloads</strong> tab.
        </p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 bg-brand-red text-white font-bold px-6 py-3 rounded-sm hover:bg-brand-darkRed transition-colors"
        >
          Browse Products →
        </Link>
      </div>
    </div>
  );
}
