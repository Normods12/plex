'use client';

import React, { useState } from 'react';
import { getStrapiMediaUrl } from '@/lib/strapi';
import type { ProductDetail } from '@/lib/strapi-queries';

type Tab = 'overview' | 'specifications' | 'downloads';

interface ProductTabsProps {
  product: ProductDetail;
}

export function ProductTabs({ product }: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');

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

      {/* Overview tab */}
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

      {/* Specifications tab */}
      {activeTab === 'specifications' && (
        <div>
          {product.attributes.specs?.length > 0 ? (
            <table className="w-full border-collapse">
              <tbody>
                {product.attributes.specs.map((spec, i) => (
                  <tr key={spec.id} className={i % 2 === 0 ? 'bg-ui-lightGray' : 'bg-white'}>
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

      {/* Downloads tab */}
      {activeTab === 'downloads' && (
        <div>
          {allDocs.length > 0 ? (
            <div className="space-y-3">
              {allDocs.map((doc) => {
                const fileUrl = getStrapiMediaUrl(
                  doc.attributes.file?.data?.attributes?.url
                );
                const fileExt =
                  doc.attributes.file?.data?.attributes?.ext
                    ?.replace('.', '')
                    .toUpperCase() ?? 'FILE';
                return (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 bg-white border border-ui-border rounded-sm hover:border-brand-red transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand-red text-white rounded-sm flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {fileExt === 'PDF' ? 'PDF' : fileExt}
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

// ─── Rich text renderer for Strapi blocks format ──────────────────────────────

type BlockNode = {
  type: string;
  level?: number;
  children?: Array<{ type?: string; text?: string; bold?: boolean; italic?: boolean; children?: Array<{ text?: string }> }>;
};

function RichTextRenderer({ content }: { content: unknown }) {
  if (!content || !Array.isArray(content)) return null;

  return (
    <div className="space-y-4">
      {(content as BlockNode[]).map((block, i) => {
        if (block.type === 'paragraph') {
          return (
            <p key={i} className="text-ui-charcoal leading-relaxed">
              {block.children?.map((child, j) => {
                if (child.bold) return <strong key={j}>{child.text}</strong>;
                if (child.italic) return <em key={j}>{child.text}</em>;
                return <span key={j}>{child.text}</span>;
              })}
            </p>
          );
        }
        if (block.type === 'heading') {
          const level = block.level ?? 2;
          const text = block.children?.map((c) => c.text).join('') ?? '';
          if (level === 1) return <h1 key={i} className="text-2xl font-bold text-ui-nearBlack mt-6 mb-3">{text}</h1>;
          if (level === 2) return <h2 key={i} className="text-xl font-bold text-ui-nearBlack mt-6 mb-3">{text}</h2>;
          return <h3 key={i} className="text-lg font-bold text-ui-nearBlack mt-4 mb-2">{text}</h3>;
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
