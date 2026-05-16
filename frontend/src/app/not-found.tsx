import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '404 — Page Not Found',
};

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-lg">
        <p className="text-8xl font-bold text-brand-red mb-4">404</p>
        <h1 className="text-3xl font-bold text-ui-nearBlack mb-4">Page Not Found</h1>
        <p className="text-ui-charcoal mb-8">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center bg-brand-red text-white font-bold px-6 py-3 rounded-sm hover:bg-brand-darkRed transition-colors"
          >
            Go to Homepage
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center justify-center border border-brand-red text-brand-red font-bold px-6 py-3 rounded-sm hover:bg-brand-red hover:text-white transition-colors"
          >
            Browse Products
          </Link>
        </div>
      </div>
    </div>
  );
}
