'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { getStrapiMediaUrl } from '@/lib/strapi';
import { Button } from '@/components/ui/Button';
import type { ProductListItem } from '@/lib/strapi-queries';

interface ProductListingProps {
  products: ProductListItem[];
  domainSlug: string;
  familySlug: string;
  categorySlug: string;
}

export function ProductListing({
  products,
  domainSlug,
  familySlug,
  categorySlug,
}: ProductListingProps) {
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());

  // Collect all unique tags across products
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    products.forEach((p) => {
      if (p.attributes.isNDAA) tags.add('NDAA');
      p.attributes.tags?.forEach((t) => tags.add(t));
    });
    return Array.from(tags).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (activeFilters.size === 0) return products;
    return products.filter((p) => {
      if (activeFilters.has('NDAA') && !p.attributes.isNDAA) return false;
      const productTags = new Set(p.attributes.tags ?? []);
      const filterArr = Array.from(activeFilters);
      for (const filter of filterArr) {
        if (filter !== 'NDAA' && !productTags.has(filter)) return false;
      }
      return true;
    });
  }, [products, activeFilters]);

  const toggleFilter = (tag: string) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Filter chips */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          <span className="text-sm font-bold text-ui-charcoal self-center mr-1">Filter:</span>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleFilter(tag)}
              className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                activeFilters.has(tag)
                  ? 'bg-brand-red text-white border-brand-red'
                  : 'bg-white text-ui-charcoal border-ui-border hover:border-brand-red hover:text-brand-red'
              }`}
            >
              {tag}
            </button>
          ))}
          {activeFilters.size > 0 && (
            <button
              onClick={() => setActiveFilters(new Set())}
              className="px-3 py-1 rounded-full text-xs font-bold border border-gray-300 text-gray-500 hover:border-gray-400 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Count */}
      <p className="text-sm text-ui-charcoal mb-6">
        {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
        {activeFilters.size > 0 ? ' (filtered)' : ''}
      </p>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-ui-charcoal">No products match the selected filters.</p>
          <button
            onClick={() => setActiveFilters(new Set())}
            className="mt-3 text-brand-red font-bold hover:underline text-sm"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => {
            const imageUrl = getStrapiMediaUrl(
              product.attributes.mainImage?.data?.attributes?.url
            );
            const imageAlt =
              product.attributes.mainImage?.data?.attributes?.alternativeText ||
              product.attributes.name;

            return (
              <div
                key={product.id}
                className="bg-white border border-ui-border rounded-sm overflow-hidden hover:shadow-md transition-shadow group"
              >
                <div className="relative h-44 bg-ui-lightGray">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={imageAlt}
                      fill
                      className="object-contain p-3"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-300">
                      <svg
                        className="w-12 h-12"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                  {product.attributes.status !== 'active' && (
                    <div className="absolute top-2 right-2">
                      <span
                        className={
                          product.attributes.status === 'legacy'
                            ? 'badge-legacy'
                            : 'badge-discontinued'
                        }
                      >
                        {product.attributes.status}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  {product.attributes.modelCode && (
                    <p className="text-brand-red font-bold text-xs mb-1">
                      {product.attributes.modelCode}
                    </p>
                  )}
                  <h3 className="font-bold text-ui-nearBlack group-hover:text-brand-red transition-colors text-sm mb-2 line-clamp-2">
                    {product.attributes.name}
                  </h3>
                  {product.attributes.shortDescription && (
                    <p className="text-xs text-ui-charcoal line-clamp-2 mb-3">
                      {product.attributes.shortDescription}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {product.attributes.isNDAA && (
                      <span className="badge-ndaa">NDAA</span>
                    )}
                    {product.attributes.tags?.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-ui-lightGray text-ui-charcoal border border-ui-border"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <Button
                    href={`/products/${domainSlug}/${familySlug}/${categorySlug}/${product.attributes.slug}`}
                    variant="outline"
                    size="sm"
                  >
                    View Details
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
