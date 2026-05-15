import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { fetchStrapi } from '@/lib/strapi';

interface PageData {
  id: number;
  attributes: {
    title: string;
    slug: string;
    content: unknown;
    seo?: { metaTitle: string | null; metaDescription: string | null } | null;
  };
}

async function getSupportContent(slug: string) {
  // Try page first, then support-article
  try {
    const pageRes = await fetchStrapi<PageData[]>('/pages', {
      params: {
        'filters[slug][$eq]': slug,
        'filters[pageType][$eq]': 'support',
        'pagination[pageSize]': 1,
      },
    });
    if (pageRes.data[0]) return { type: 'page', data: pageRes.data[0] };
  } catch {}

  try {
    const articleRes = await fetchStrapi<PageData[]>('/support-articles', {
      params: {
        'filters[slug][$eq]': slug,
        'pagination[pageSize]': 1,
      },
    });
    if (articleRes.data[0]) return { type: 'article', data: articleRes.data[0] };
  } catch {}

  return null;
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const result = await getSupportContent(params.slug);
  if (!result) return { title: 'Not Found' };
  return {
    title: result.data.attributes.seo?.metaTitle ?? result.data.attributes.title,
    description: result.data.attributes.seo?.metaDescription ?? undefined,
  };
}

export default async function SupportPage({ params }: { params: { slug: string } }) {
  const result = await getSupportContent(params.slug);

  // Fallback for known support pages
  const fallbackTitles: Record<string, string> = {
    'warranty-policy': 'Warranty Policy',
    'learning-center': 'Learning Center',
  };

  if (!result && !fallbackTitles[params.slug]) notFound();

  const title =
    result?.data.attributes.title ?? fallbackTitles[params.slug] ?? params.slug;

  return (
    <div>
      {/* Header */}
      <div className="bg-ui-nearBlack text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="text-sm text-gray-400 mb-3" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span className="mx-2">›</span>
            <Link href="/support" className="hover:text-white transition-colors">Support</Link>
            <span className="mx-2">›</span>
            <span className="text-white">{title}</span>
          </nav>
          <h1 className="text-4xl font-bold text-white">{title}</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {result?.data.attributes.content ? (
          <RichTextContent content={result.data.attributes.content} />
        ) : (
          <FallbackContent slug={params.slug} />
        )}
      </div>
    </div>
  );
}

function RichTextContent({ content }: { content: unknown }) {
  if (!content || !Array.isArray(content)) return null;
  return (
    <div className="prose prose-lg max-w-none text-ui-charcoal">
      {(content as Array<{ type: string; children?: Array<{ text?: string }> }>).map((block, i) => {
        if (block.type === 'paragraph') {
          return (
            <p key={i} className="mb-4 leading-relaxed">
              {block.children?.map((c, j) => <span key={j}>{c.text}</span>)}
            </p>
          );
        }
        if (block.type === 'heading') {
          return (
            <h2 key={i} className="text-2xl font-bold text-ui-nearBlack mt-8 mb-4">
              {block.children?.map((c, j) => <span key={j}>{c.text}</span>)}
            </h2>
          );
        }
        return null;
      })}
    </div>
  );
}

function FallbackContent({ slug }: { slug: string }) {
  if (slug === 'warranty-policy') {
    return (
      <div className="space-y-6 text-ui-charcoal">
        <p className="leading-relaxed">
          Plexonics Technologies Limited provides warranty coverage for all products against manufacturing defects.
        </p>
        <p className="leading-relaxed">
          For warranty claims and support, please contact our support team at{' '}
          <a href="mailto:info@plexonics.com" className="text-brand-red hover:underline font-bold">
            info@plexonics.com
          </a>{' '}
          or call{' '}
          <a href="tel:18001200023" className="text-brand-red hover:underline font-bold">
            1800-1200-023
          </a>
          .
        </p>
      </div>
    );
  }

  if (slug === 'learning-center') {
    return (
      <div className="space-y-4">
        <p className="text-ui-charcoal leading-relaxed">
          Browse our learning resources, technology guides, and glossary.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          {[
            { label: 'Glossary', href: '/support/learning-center/glossary' },
            { label: 'Technology Guides', href: '/support/learning-center/technology' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block p-5 bg-white border border-ui-border rounded-sm hover:border-brand-red hover:shadow-md transition-all group"
            >
              <h3 className="font-bold text-ui-nearBlack group-hover:text-brand-red transition-colors">
                {item.label}
              </h3>
              <span className="text-sm text-brand-red mt-1 block">Browse →</span>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return <p className="text-ui-charcoal">Content coming soon.</p>;
}
