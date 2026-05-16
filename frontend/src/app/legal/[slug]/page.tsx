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

const LEGAL_SLUGS = ['privacy-policy', 'terms-of-use'];

const FALLBACK_CONTENT: Record<string, { title: string; body: string }> = {
  'privacy-policy': {
    title: 'Privacy Policy',
    body: `Plexonics Technologies Limited ("Plexonics", "we", "us") is committed to protecting your privacy. This policy explains how we collect, use, and safeguard your personal information when you visit www.plexonics.com.

Information We Collect
We may collect personal information such as your name, email address, phone number, and company name when you submit a contact form or register a product.

How We Use Your Information
We use your information to respond to enquiries, process product registrations, and improve our services. We do not sell or share your personal data with third parties except as required by law.

Cookies
Our website may use cookies to improve your browsing experience. You can disable cookies in your browser settings.

Contact
For privacy-related queries, contact us at info@plexonics.com or call 1800-1200-023.`,
  },
  'terms-of-use': {
    title: 'Terms of Use',
    body: `By accessing www.plexonics.com, you agree to these Terms of Use. If you do not agree, please do not use this website.

Intellectual Property
All content on this website, including text, images, logos, and product information, is the property of Plexonics Technologies Limited and is protected by applicable intellectual property laws.

Limitation of Liability
Plexonics Technologies Limited shall not be liable for any direct, indirect, incidental, or consequential damages arising from your use of this website or our products.

Product Information
Product specifications and availability are subject to change without notice. Please contact us for the most current information.

Governing Law
These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Chandigarh, India.

Contact
For questions about these terms, contact us at info@plexonics.com.`,
  },
};

export async function generateStaticParams() {
  return LEGAL_SLUGS.map((slug) => ({ slug }));
}

async function getPage(slug: string): Promise<PageData | null> {
  try {
    const res = await fetchStrapi<PageData[]>('/pages', {
      params: {
        'filters[slug][$eq]': slug,
        'filters[pageType][$eq]': 'legal',
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
  const fallback = FALLBACK_CONTENT[params.slug];
  if (!fallback && !LEGAL_SLUGS.includes(params.slug)) return { title: 'Not Found' };
  const page = await getPage(params.slug);
  return {
    title: page?.attributes.seo?.metaTitle ?? page?.attributes.title ?? fallback?.title ?? 'Legal',
    description: page?.attributes.seo?.metaDescription ?? undefined,
  };
}

export default async function LegalPage({ params }: { params: { slug: string } }) {
  if (!LEGAL_SLUGS.includes(params.slug)) notFound();

  const page = await getPage(params.slug);
  const fallback = FALLBACK_CONTENT[params.slug];
  const title = page?.attributes.title ?? fallback?.title ?? params.slug;

  return (
    <div>
      <div className="bg-ui-nearBlack text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="text-sm text-gray-400 mb-3" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span className="mx-2">›</span>
            <span className="text-white">{title}</span>
          </nav>
          <h1 className="text-4xl font-bold text-white">{title}</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {page?.attributes.content ? (
          <RichTextContent content={page.attributes.content} />
        ) : fallback ? (
          <div className="prose prose-lg max-w-none text-ui-charcoal">
            {fallback.body.split('\n\n').map((para, i) => {
              const isHeading = para.length < 60 && !para.includes('.');
              return isHeading ? (
                <h2 key={i} className="text-xl font-bold text-ui-nearBlack mt-8 mb-3">
                  {para}
                </h2>
              ) : (
                <p key={i} className="mb-4 leading-relaxed">
                  {para}
                </p>
              );
            })}
          </div>
        ) : (
          <p className="text-ui-charcoal">Content coming soon.</p>
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
            <h2 key={i} className="text-xl font-bold text-ui-nearBlack mt-8 mb-3">
              {block.children?.map((c, j) => <span key={j}>{c.text}</span>)}
            </h2>
          );
        }
        return null;
      })}
    </div>
  );
}
