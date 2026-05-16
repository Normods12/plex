import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Support',
  description: 'Product registration, warranty policy, learning center, and support resources for Plexonics products.',
};

const supportLinks = [
  {
    title: 'Product Registration',
    description: 'Register your Plexonics product to activate your warranty and receive priority support.',
    href: '/support/product-registration',
    icon: '📋',
  },
  {
    title: 'Learning Center',
    description: 'Browse technology guides, glossary, and educational resources.',
    href: '/support/learning-center',
    icon: '📚',
  },
  {
    title: 'Warranty Policy',
    description: 'Understand your product warranty coverage and how to make a claim.',
    href: '/support/warranty-policy',
    icon: '🛡️',
  },
];

export default function SupportPage() {
  return (
    <div>
      {/* Header */}
      <div className="bg-ui-nearBlack text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="text-sm text-gray-400 mb-3" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span className="mx-2">›</span>
            <span className="text-white">Support</span>
          </nav>
          <h1 className="text-4xl font-bold text-white">Support</h1>
          <p className="text-gray-300 mt-2">
            Everything you need to get the most from your Plexonics products.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {supportLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group bg-white border border-ui-border rounded-sm p-6 hover:border-brand-red hover:shadow-md transition-all"
            >
              <div className="text-4xl mb-4" aria-hidden="true">{item.icon}</div>
              <h2 className="font-bold text-ui-nearBlack group-hover:text-brand-red transition-colors text-lg mb-2">
                {item.title}
              </h2>
              <p className="text-sm text-ui-charcoal mb-4">{item.description}</p>
              <span className="text-sm font-bold text-brand-red group-hover:underline">
                Go →
              </span>
            </Link>
          ))}
        </div>

        {/* Contact support CTA */}
        <div className="bg-ui-lightGray border border-ui-border rounded-sm p-8 text-center">
          <h2 className="text-2xl font-bold text-ui-nearBlack mb-3">Need More Help?</h2>
          <p className="text-ui-charcoal mb-6">
            Our support team is available Mon–Sat, 9am–6pm IST.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="tel:18001200023"
              className="inline-flex items-center justify-center gap-2 bg-brand-red text-white font-bold px-6 py-3 rounded-sm hover:bg-brand-darkRed transition-colors"
            >
              📞 1800-1200-023
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 border border-brand-red text-brand-red font-bold px-6 py-3 rounded-sm hover:bg-brand-red hover:text-white transition-colors"
            >
              Send a Message
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
