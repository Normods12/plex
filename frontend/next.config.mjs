/**
 * Redirect rules for legacy Joomla URLs.
 *
 * NOTE: For PDF binary redirects (/images/DATASHEETS/*.pdf → Strapi media URLs),
 * configure at the Nginx/Caddy reverse proxy level using a map directive.
 * Next.js redirects add overhead for binary files and should not be used for them.
 */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '1337',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'media.plexonics.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.plexonics.com',
        pathname: '/**',
      },
    ],
  },

  async redirects() {
    return [
      // ── Products ──────────────────────────────────────────────────────────
      {
        source: '/index.php/products/:path*',
        destination: '/products/:path*',
        permanent: true,
      },

      // ── About Us ──────────────────────────────────────────────────────────
      {
        source: '/index.php/about-us',
        destination: '/about/about-us',
        permanent: true,
      },
      {
        source: '/index.php/about-us/our-milestones',
        destination: '/about/our-milestones',
        permanent: true,
      },
      {
        source: '/index.php/about-us/partner-program',
        destination: '/about/partner-program',
        permanent: true,
      },
      {
        source: '/index.php/about-us/e-waste-management',
        destination: '/about/e-waste-management',
        permanent: true,
      },

      // ── Support ───────────────────────────────────────────────────────────
      {
        source: '/index.php/support/product-registration',
        destination: '/support/product-registration',
        permanent: true,
      },
      {
        source: '/index.php/support/warranty-policy',
        destination: '/support/warranty-policy',
        permanent: true,
      },
      {
        source: '/index.php/support/learning-center/:slug*',
        destination: '/support/learning-center/:slug*',
        permanent: true,
      },

      // ── Contact ───────────────────────────────────────────────────────────
      {
        source: '/index.php/contact-us',
        destination: '/contact',
        permanent: true,
      },

      // ── PDF downloads (Next.js level — proxy-level preferred for binaries) ─
      // Note: For production, handle /images/DATASHEETS/ and /images/MANUALS/
      // at the Nginx level (see nginx-plexonics.conf) for better performance.
      {
        source: '/images/DATASHEETS/:filename',
        destination: '/downloads',
        permanent: true,
      },
      {
        source: '/images/MANUALS/:filename',
        destination: '/downloads',
        permanent: true,
      },

      // ── Catch-all for remaining Joomla /index.php/ paths ─────────────────
      {
        source: '/index.php/:path*',
        destination: '/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
