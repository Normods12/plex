import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { fetchStrapi } from '@/lib/strapi';

export const metadata: Metadata = {
  title: 'Learning Center',
  description:
    'Browse Plexonics technology guides, glossary, and support resources.',
};

interface SupportArticle {
  id: number;
  attributes: {
    title: string;
    slug: string;
    category: string;
  };
}

async function getArticles() {
  try {
    const res = await fetchStrapi<SupportArticle[]>('/support-articles', {
      params: {
        'filters[category][$in][0]': 'glossary',
        'filters[category][$in][1]': 'technology',
        'sort[0]': 'title:asc',
        'pagination[pageSize]': 50,
        'fields[0]': 'title',
        'fields[1]': 'slug',
        'fields[2]': 'category',
      },
    });
    return res.data;
  } catch {
    return [];
  }
}

export default async function LearningCenterPage() {
  const articles = await getArticles();

  const glossaryArticles = articles.filter(
    (a) => a.attributes.category === 'glossary'
  );
  const technologyArticles = articles.filter(
    (a) => a.attributes.category === 'technology'
  );

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
            <span className="text-white">Learning Center</span>
          </nav>
          <h1 className="text-4xl font-bold text-white">Learning Center</h1>
          <p className="text-gray-300 mt-2">
            Technology guides, glossary, and resources to help you get the most from Plexonics products.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {articles.length === 0 ? (
          /* Fallback when no articles in Strapi yet */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                label: 'Glossary',
                href: '/support/learning-center/glossary',
                description: 'Definitions and explanations of networking and surveillance terminology.',
              },
              {
                label: 'Technology Guides',
                href: '/support/learning-center/technology',
                description: 'In-depth guides on technologies used in Plexonics products.',
              },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block p-6 bg-white border border-ui-border rounded-sm hover:border-brand-red hover:shadow-md transition-all group"
              >
                <h2 className="font-bold text-ui-nearBlack group-hover:text-brand-red transition-colors text-lg mb-2">
                  {item.label}
                </h2>
                <p className="text-sm text-ui-charcoal mb-3">{item.description}</p>
                <span className="text-sm font-bold text-brand-red group-hover:underline">
                  Browse →
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="space-y-10">
            {technologyArticles.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-ui-nearBlack mb-4">Technology Guides</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {technologyArticles.map((article) => (
                    <Link
                      key={article.id}
                      href={`/support/learning-center/${article.attributes.slug}`}
                      className="block p-5 bg-white border border-ui-border rounded-sm hover:border-brand-red hover:shadow-md transition-all group"
                    >
                      <h3 className="font-bold text-ui-nearBlack group-hover:text-brand-red transition-colors mb-1">
                        {article.attributes.title}
                      </h3>
                      <span className="text-sm font-bold text-brand-red group-hover:underline">
                        Read →
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {glossaryArticles.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-ui-nearBlack mb-4">Glossary</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {glossaryArticles.map((article) => (
                    <Link
                      key={article.id}
                      href={`/support/learning-center/${article.attributes.slug}`}
                      className="block p-5 bg-white border border-ui-border rounded-sm hover:border-brand-red hover:shadow-md transition-all group"
                    >
                      <h3 className="font-bold text-ui-nearBlack group-hover:text-brand-red transition-colors mb-1">
                        {article.attributes.title}
                      </h3>
                      <span className="text-sm font-bold text-brand-red group-hover:underline">
                        Read →
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
