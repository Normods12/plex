import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { fetchStrapi } from '@/lib/strapi';

export const metadata: Metadata = {
  title: {
    default: 'Plexonics Technologies — Enterprise Networking & Surveillance',
    template: '%s | Plexonics Technologies',
  },
  description:
    'Plexonics Technologies Limited — trusted enterprise networking, surveillance, display, and industrial solutions.',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'https://www.plexonics.com'
  ),
};

async function getLayoutData() {
  try {
    const [domainsRes, siteSettingsRes] = await Promise.allSettled([
      fetchStrapi<
        Array<{
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
        }>
      >('/product-domains', {
        params: {
          'populate[families][fields][0]': 'name',
          'populate[families][fields][1]': 'slug',
          'populate[families][fields][2]': 'showInNav',
          'sort[0]': 'sortOrder:asc',
          'pagination[pageSize]': 20,
        },
      }),
      fetchStrapi<{
        socialLinks?: { linkedin?: string; twitter?: string; youtube?: string };
      }>('/site-settings'),
    ]);

    const domains =
      domainsRes.status === 'fulfilled' ? domainsRes.value.data : [];
    const siteSettings =
      siteSettingsRes.status === 'fulfilled'
        ? siteSettingsRes.value.data
        : null;

    return { domains, siteSettings };
  } catch {
    return { domains: [], siteSettings: null };
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { domains, siteSettings } = await getLayoutData();

  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col font-sans antialiased">
        <Header
          domains={domains as Parameters<typeof Header>[0]['domains']}
        />
        <main className="flex-1">{children}</main>
        <Footer
          socialLinks={
            (siteSettings as { socialLinks?: { linkedin?: string; twitter?: string; youtube?: string } } | null)
              ?.socialLinks
          }
        />
      </body>
    </html>
  );
}
