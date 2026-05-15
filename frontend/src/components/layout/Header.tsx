'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface ProductDomain {
  id: number;
  attributes: {
    name: string;
    slug: string;
    families?: {
      data: Array<{
        id: number;
        attributes: { name: string; slug: string; showInNav: boolean };
      }>;
    };
  };
}

interface AlertBanner {
  message: string;
  type: 'info' | 'warning' | 'promo';
  active: boolean;
}

interface HeaderProps {
  domains?: ProductDomain[];
  alertBanner?: AlertBanner | null;
}

const aboutDropdown = [
  { label: 'Our Milestones', href: '/about/our-milestones' },
  { label: 'Partner Program', href: '/about/partner-program' },
  { label: 'E-Waste Management', href: '/about/e-waste-management' },
];

const supportDropdown = [
  { label: 'Product Registration', href: '/support/product-registration' },
  { label: 'Learning Center', href: '/support/learning-center' },
  { label: 'Warranty Policy', href: '/support/warranty-policy' },
];

export function Header({ domains = [], alertBanner }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const showBanner = alertBanner?.active;

  return (
    <header className="sticky top-0 z-50">
      {/* Announcement bar */}
      {showBanner && (
        <div
          className={`w-full text-white text-sm text-center py-2 px-4 ${
            alertBanner.type === 'warning'
              ? 'bg-yellow-600'
              : alertBanner.type === 'promo'
              ? 'bg-brand-darkRed'
              : 'bg-brand-red'
          }`}
        >
          {alertBanner.message}
        </div>
      )}

      {/* Main nav bar */}
      <nav
        className={`bg-white border-b border-ui-border transition-shadow duration-200 ${
          scrolled ? 'shadow-md' : ''
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              <Image
                src="/images/logo-sticky.png"
                alt="Plexonics Technologies"
                width={160}
                height={40}
                className="h-10 w-auto"
                priority
              />
            </Link>

            {/* Desktop nav */}
            <div className="hidden lg:flex items-center space-x-1">
              <NavLink href="/">Home</NavLink>

              {/* About dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setAboutOpen(true)}
                onMouseLeave={() => setAboutOpen(false)}
              >
                <NavLink href="/about/about-us">About Us</NavLink>
                {aboutOpen && (
                  <DropdownMenu items={aboutDropdown} />
                )}
              </div>

              {/* Products mega-menu */}
              <div
                className="relative"
                onMouseEnter={() => setMegaMenuOpen(true)}
                onMouseLeave={() => setMegaMenuOpen(false)}
              >
                <NavLink href="/products">Products</NavLink>
                {megaMenuOpen && domains.length > 0 && (
                  <MegaMenu domains={domains} />
                )}
              </div>

              {/* Support dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setSupportOpen(true)}
                onMouseLeave={() => setSupportOpen(false)}
              >
                <NavLink href="/support">Support</NavLink>
                {supportOpen && (
                  <DropdownMenu items={supportDropdown} />
                )}
              </div>

              <NavLink href="/contact">Contact Us</NavLink>
            </div>

            {/* Phone + hamburger */}
            <div className="flex items-center space-x-4">
              <a
                href="tel:18001200023"
                className="hidden lg:block text-sm font-bold text-ui-charcoal hover:text-brand-red transition-colors"
              >
                1800-1200-023
              </a>

              {/* Hamburger */}
              <button
                className="lg:hidden p-2 rounded-md text-ui-charcoal hover:text-brand-red focus:outline-none focus:ring-2 focus:ring-brand-red"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle navigation menu"
                aria-expanded={mobileOpen}
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  {mobileOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-ui-border bg-white">
            <div className="px-4 py-3 space-y-1">
              <MobileNavLink href="/" onClick={() => setMobileOpen(false)}>
                Home
              </MobileNavLink>
              <MobileNavLink href="/about/about-us" onClick={() => setMobileOpen(false)}>
                About Us
              </MobileNavLink>
              <div className="pl-4 space-y-1">
                {aboutDropdown.map((item) => (
                  <MobileNavLink
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    sub
                  >
                    {item.label}
                  </MobileNavLink>
                ))}
              </div>
              <MobileNavLink href="/products" onClick={() => setMobileOpen(false)}>
                Products
              </MobileNavLink>
              {domains.map((d) => (
                <MobileNavLink
                  key={d.id}
                  href={`/products/${d.attributes.slug}`}
                  onClick={() => setMobileOpen(false)}
                  sub
                >
                  {d.attributes.name}
                </MobileNavLink>
              ))}
              <MobileNavLink href="/support" onClick={() => setMobileOpen(false)}>
                Support
              </MobileNavLink>
              <div className="pl-4 space-y-1">
                {supportDropdown.map((item) => (
                  <MobileNavLink
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    sub
                  >
                    {item.label}
                  </MobileNavLink>
                ))}
              </div>
              <MobileNavLink href="/contact" onClick={() => setMobileOpen(false)}>
                Contact Us
              </MobileNavLink>
              <div className="pt-2 border-t border-ui-border">
                <a
                  href="tel:18001200023"
                  className="block py-2 text-sm font-bold text-brand-red"
                >
                  1800-1200-023
                </a>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="px-3 py-2 text-sm font-medium text-ui-charcoal hover:text-brand-red transition-colors duration-150 relative group"
    >
      {children}
      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand-red transition-all duration-200 group-hover:w-full" />
    </Link>
  );
}

function MobileNavLink({
  href,
  children,
  onClick,
  sub,
}: {
  href: string;
  children: React.ReactNode;
  onClick: () => void;
  sub?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`block py-2 text-sm ${
        sub
          ? 'pl-4 text-ui-charcoal hover:text-brand-red'
          : 'font-medium text-ui-nearBlack hover:text-brand-red'
      } transition-colors`}
    >
      {children}
    </Link>
  );
}

function DropdownMenu({
  items,
}: {
  items: Array<{ label: string; href: string }>;
}) {
  return (
    <div className="absolute top-full left-0 mt-0 w-56 bg-white border border-ui-border shadow-lg rounded-sm z-50">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="block px-4 py-3 text-sm text-ui-charcoal hover:text-brand-red hover:bg-ui-lightGray border-b border-ui-border last:border-b-0 transition-colors"
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}

function MegaMenu({ domains }: { domains: ProductDomain[] }) {
  return (
    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-0 w-[800px] bg-white border border-ui-border shadow-xl rounded-sm z-50">
      <div className="p-6">
        <p className="text-xs font-bold text-ui-charcoal uppercase tracking-wider mb-4">
          Product Domains
        </p>
        <div className="grid grid-cols-4 gap-4">
          {domains.map((domain) => (
            <div key={domain.id}>
              <Link
                href={`/products/${domain.attributes.slug}`}
                className="block font-bold text-sm text-ui-nearBlack hover:text-brand-red mb-2 transition-colors"
              >
                {domain.attributes.name}
              </Link>
              {domain.attributes.families?.data
                .filter((f) => f.attributes.showInNav)
                .slice(0, 4)
                .map((family) => (
                  <Link
                    key={family.id}
                    href={`/products/${domain.attributes.slug}/${family.attributes.slug}`}
                    className="block text-xs text-ui-charcoal hover:text-brand-red py-0.5 transition-colors"
                  >
                    {family.attributes.name}
                  </Link>
                ))}
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-ui-border">
          <Link
            href="/products"
            className="text-sm font-bold text-brand-red hover:text-brand-darkRed transition-colors"
          >
            View All Products →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Header;
