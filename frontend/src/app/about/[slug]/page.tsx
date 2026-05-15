import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { fetchStrapi, getStrapiMediaUrl } from '@/lib/strapi';

interface PageData {
  id: number;
  attributes: {
    title: string;
    slug: string;
    pageType: string;
    content: unknown;
    heroImage?: {
      data?: { attributes: { url: string; alternativeText: string | null } };
    };
    seo?: {
      metaTitle: string | null;
      metaDescription: string | null;
    } | null;
  };
}

const ABOUT_SLUGS = ['about-us', 'our-milestones', 'partner-program', 'e-waste-management'];

export async function generateStaticParams() {
  return ABOUT_SLUGS.map((slug) => ({ slug }));
}

async function getPage(slug: string): Promise<PageData | null> {
  try {
    const res = await fetchStrapi<PageData[]>('/pages', {
      params: {
        'filters[slug][$eq]': slug,
        'filters[pageType][$eq]': 'about',
        'populate[heroImage][fields][0]': 'url',
        'populate[heroImage][fields][1]': 'alternativeText',
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
  const page = await getPage(params.slug);
  if (!page) return { title: 'Not Found' };
  return {
    title: page.attributes.seo?.metaTitle ?? page.attributes.title,
    description: page.attributes.seo?.metaDescription ?? undefined,
  };
}

export default async function AboutPage({ params }: { params: { slug: string } }) {
  const page = await getPage(params.slug);

  // Fallback content for pages not yet in Strapi
  const fallbackTitles: Record<string, string> = {
    'about-us': 'About Us',
    'our-milestones': 'Our Milestones',
    'partner-program': 'Partner Program',
    'e-waste-management': 'E-Waste Management',
  };

  const title = page?.attributes.title ?? fallbackTitles[params.slug] ?? params.slug;
  const heroUrl = getStrapiMediaUrl(page?.attributes.heroImage?.data?.attributes?.url);

  return (
    <div>
      {/* Hero */}
      <div className="relative bg-ui-nearBlack text-white py-16 overflow-hidden">
        {heroUrl && (
          <Image
            src={heroUrl}
            alt={page?.attributes.heroImage?.data?.attributes?.alternativeText ?? title}
            fill
            className="object-cover opacity-20"
            priority
          />
        )}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="text-sm text-gray-400 mb-3" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span className="mx-2">›</span>
            <Link href="/about/about-us" className="hover:text-white transition-colors">About Us</Link>
            {params.slug !== 'about-us' && (
              <>
                <span className="mx-2">›</span>
                <span className="text-white">{title}</span>
              </>
            )}
          </nav>
          <h1 className="text-4xl font-bold text-white">{title}</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {page?.attributes.content ? (
          <RichTextContent content={page.attributes.content} />
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
  const content: Record<string, React.ReactNode> = {
    'about-us': (
      <div className="space-y-6 text-ui-charcoal">
        <p className="text-lg leading-relaxed">
          Plexonics Technologies Limited is a leading provider of enterprise networking, surveillance, display, and industrial solutions in India.
        </p>
        <p className="leading-relaxed">
          We deliver reliable, high-performance technology products trusted by enterprises, government institutions, and industrial facilities across the country.
        </p>
        <p className="leading-relaxed">
          Our product portfolio spans enterprise networking switches and routers, IP surveillance cameras, professional displays, industrial networking equipment, PA systems, video conferencing solutions, servers and storage, and enterprise software.
        </p>
      </div>
    ),
    'our-milestones': (
      <p className="text-ui-charcoal">
        Content coming soon. Please check back later.
      </p>
    ),
    'partner-program': (
      <div className="space-y-4 text-ui-charcoal">
        <p className="leading-relaxed">
          Join the Plexonics Partner Program and grow your business with our enterprise-grade product portfolio.
        </p>
        <p className="leading-relaxed">
          For partnership enquiries, please{' '}
          <Link href="/contact" className="text-brand-red hover:underline font-bold">
            contact us
          </Link>
          .
        </p>
      </div>
    ),
    'e-waste-management': (
      <div className="space-y-4 text-ui-charcoal">
        <p className="leading-relaxed">
          Plexonics is committed to responsible e-waste management in compliance with the E-Waste (Management) Rules, 2016.
        </p>
        <p className="leading-relaxed">
          For e-waste disposal and collection information, please{' '}
          <Link href="/contact" className="text-brand-red hover:underline font-bold">
            contact us
          </Link>
          .
        </p>
      </div>
    ),
  };

  return <>{content[slug] ?? <p className="text-ui-charcoal">Content coming soon.</p>}</>;
}
