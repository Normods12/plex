import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface SocialLinks {
  linkedin?: string;
  twitter?: string;
  youtube?: string;
}

interface FooterProps {
  socialLinks?: SocialLinks;
}

const quickLinks = [
  { label: 'Home', href: '/' },
  { label: 'About Us', href: '/about/about-us' },
  { label: 'Our Milestones', href: '/about/our-milestones' },
  { label: 'Partner Program', href: '/about/partner-program' },
  { label: 'E-Waste Management', href: '/about/e-waste-management' },
  { label: 'Contact Us', href: '/contact' },
];

const topDomains = [
  { label: 'Enterprise Networking', href: '/products/enterprise-networking' },
  { label: 'Enterprise Surveillance', href: '/products/enterprise-surveillance' },
  { label: 'Professional Displays', href: '/products/professional-displays' },
  { label: 'Industrial Networking', href: '/products/industrial-networking' },
  { label: 'Networking PA System', href: '/products/networking-pa-system' },
  { label: 'Video Conference', href: '/products/video-conference' },
  { label: 'Servers & Storage', href: '/products/servers-storage' },
  { label: 'Enterprise Software', href: '/products/enterprise-software' },
];

const supportLinks = [
  { label: 'Product Registration', href: '/support/product-registration' },
  { label: 'Learning Center', href: '/support/learning-center' },
  { label: 'Warranty Policy', href: '/support/warranty-policy' },
  { label: 'Glossary', href: '/support/learning-center/glossary' },
];

const legalLinks = [
  { label: 'Privacy Policy', href: '/legal/privacy-policy' },
  { label: 'Terms of Use', href: '/legal/terms-of-use' },
];

export function Footer({ socialLinks }: FooterProps) {
  return (
    <footer className="bg-ui-nearBlack text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Column 1: Quick Links */}
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-brand-red text-sm transition-colors hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: Products */}
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4">
              Products
            </h3>
            <ul className="space-y-2">
              {topDomains.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-brand-red text-sm transition-colors hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Support */}
          <div>
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4">
              Support
            </h3>
            <ul className="space-y-2">
              {supportLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-brand-red text-sm transition-colors hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Company + Contact */}
          <div>
            <div className="mb-6">
              <Image
                src="/images/logo-sticky.png"
                alt="Plexonics Technologies"
                width={140}
                height={35}
                className="h-8 w-auto brightness-0 invert mb-4"
              />
              <p className="text-gray-400 text-sm leading-relaxed">
                Trusted networking and surveillance solutions for enterprise and industrial environments.
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm">
                <span className="text-gray-500">Phone: </span>
                <a
                  href="tel:18001200023"
                  className="text-gray-300 hover:text-brand-red transition-colors"
                >
                  1800-1200-023
                </a>
              </p>
              <p className="text-sm">
                <span className="text-gray-500">Email: </span>
                <a
                  href="mailto:info@plexonics.com"
                  className="text-gray-300 hover:text-brand-red transition-colors"
                >
                  info@plexonics.com
                </a>
              </p>
            </div>

            {/* Social icons */}
            <div className="flex space-x-3 mt-4">
              {socialLinks?.linkedin && (
                <SocialIcon
                  href={socialLinks.linkedin}
                  label="LinkedIn"
                  icon={
                    <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M4 6a2 2 0 100-4 2 2 0 000 4z" />
                  }
                />
              )}
              {socialLinks?.twitter && (
                <SocialIcon
                  href={socialLinks.twitter}
                  label="X (Twitter)"
                  icon={
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  }
                />
              )}
              {socialLinks?.youtube && (
                <SocialIcon
                  href={socialLinks.youtube}
                  label="YouTube"
                  icon={
                    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  }
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Legal row */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-gray-500 text-xs">
              © {new Date().getFullYear()} Plexonics Technologies Limited. All rights reserved.
            </p>
            <div className="flex items-center space-x-4">
              {legalLinks.map((link, i) => (
                <React.Fragment key={link.href}>
                  {i > 0 && <span className="text-gray-700">·</span>}
                  <Link
                    href={link.href}
                    className="text-gray-500 hover:text-gray-300 text-xs transition-colors"
                  >
                    {link.label}
                  </Link>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function SocialIcon({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-800 hover:bg-brand-red transition-colors"
    >
      <svg
        className="w-4 h-4 fill-current text-gray-400 hover:text-white"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        {icon}
      </svg>
    </a>
  );
}

export default Footer;
