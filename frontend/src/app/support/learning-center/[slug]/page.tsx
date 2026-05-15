import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { fetchStrapi, getStrapiMediaUrl } from '@/lib/strapi';

interface SupportArticle {
  id: number;
  attributes: {
    title: string;
    slug: string;
    category: string;
    content: unknown;
    attachments?: {
      data?: Array<{
        id: number;
        attributes: { url: string; name: string; ext: string; size: number };
      }>;
    };
    seo?: { metaTitle: string | null; metaDescription: string | null } | null;
  };
}

async function getArticle(slug: string): Promise<SupportArticle | null> {
  try {
    const res = await fetchStrapi<SupportArticle[]>('/support-articles', {
      params: {
        'filters[slug][$eq]': slug,
        'populate[attachments][fields][0]': 'url',
        'populate[attachments][fields][1]': 'name',
        'populate[attachments][fields][2]': 'ext',
        'populate[attachments][fields][3]': 'size',
        'populate[seo][fields][0]': 'metaTitle',
        'populate[seo][fields][1]': 'metaDescription',
        'pagination[pageSize]': 1,
      },
    });
    return res.data[0] ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const article = await getArticle(params.slug);
  if (!article) return { title: 'Not Found' };
  return {
    title: article.attributes.seo?.metaTitle ?? article.attributes.title,
    description: article.attributes.seo?.metaDescription ?? undefined,
  };
}

export default async function LearningCenterArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const article = await getArticle(params.slug);
  if (!article) notFound();

  const attachments = article.attributes.attachments?.data ?? [];

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
            <Link href="/support/learning-center" className="hover:text-white transition-colors">
              Learning Center
            </Link>
            <span className="mx-2">›</span>
            <span className="text-white">{article.attributes.title}</span>
          </nav>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider bg-brand-red text-white px-2 py-0.5 rounded-sm">
              {article.attributes.category}
            </span>
          </div>
          <h1 className="text-4xl font-bold text-white">{article.attributes.title}</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Content */}
        <div className="prose prose-lg max-w-none text-ui-charcoal mb-10">
          <RichTextContent content={article.attributes.content} />
        </div>

        {/* Attachments */}
        {attachments.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-ui-nearBlack mb-4">Attachments</h2>
            <div className="space-y-2">
              {attachments.map((file) => (
                <a
                  key={file.id}
                  href={getStrapiMediaUrl(file.attributes.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="flex items-center gap-3 p-3 bg-white border border-ui-border rounded-sm hover:border-brand-red transition-colors group"
                >
                  <div className="w-8 h-8 bg-brand-red text-white rounded-sm flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {file.attributes.ext?.replace('.', '').toUpperCase() ?? 'FILE'}
                  </div>
                  <span className="text-sm font-medium text-ui-charcoal group-hover:text-brand-red transition-colors">
                    {file.attributes.name}
                  </span>
                  <svg
                    className="w-4 h-4 text-brand-red ml-auto"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RichTextContent({ content }: { content: unknown }) {
  if (!content || !Array.isArray(content)) {
    return <p className="text-gray-400">No content available.</p>;
  }
  return (
    <>
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
        if (block.type === 'list') {
          return (
            <ul key={i} className="list-disc list-inside space-y-1 mb-4">
              {block.children?.map((item, j) => (
                <li key={j} className="text-ui-charcoal">
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
    </>
  );
}
