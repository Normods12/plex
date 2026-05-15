# Plexonics Phase 1 — Implementation Plan
### Strapi 5 + Next.js · Built with Antigravity
**Version 1.0 · May 2026**

---

## How to Read This Document

Each phase below lists:
- **What to build** — the deliverable
- **Antigravity prompt** — copy-paste this into Antigravity to execute that step
- **Gate** — what must be true before you move to the next phase

---

## Phase 0 — Project Scaffolding & Environment Setup

**Goal:** Working Strapi 5 + Next.js monorepo, connected to PostgreSQL, with dev/staging/prod environments defined.

### 0.1 — Initialise the monorepo

**Antigravity Prompt:**
```
Create a monorepo with two workspaces:
- /backend  → Strapi 5 project, TypeScript, PostgreSQL adapter
- /frontend → Next.js 14 app router project, TypeScript, Tailwind CSS

In the root:
- package.json with workspaces: ["backend", "frontend"]
- .gitignore covering node_modules, .env*, .strapi, .next, dist
- README.md with setup instructions

For /backend:
- Use `npx create-strapi-app@latest backend --ts --dbclient=postgres`
- Add .env.example with: DATABASE_URL, APP_KEYS, API_TOKEN_SALT, ADMIN_JWT_SECRET, TRANSFER_TOKEN_SALT, JWT_SECRET, NODE_ENV
- Add config/database.ts reading from DATABASE_URL
- Add config/server.ts setting host, port, url from env

For /frontend:
- Use `npx create-next-app@latest frontend --ts --tailwind --app --src-dir`
- Add .env.example with: NEXT_PUBLIC_STRAPI_URL, STRAPI_API_TOKEN
- Add src/lib/strapi.ts with a typed fetchStrapi(path, options) helper that reads NEXT_PUBLIC_STRAPI_URL

Output the complete file tree and all file contents.
```

**Gate:** `npm run dev` starts both apps without errors.

---

### 0.2 — Strapi roles & permissions

**Antigravity Prompt:**
```
In the Strapi 5 backend (/backend), configure the following via the bootstrap function in src/index.ts:

1. Ensure the "Public" role has `find` and `findOne` permissions on:
   product-domain, product-family, product-category, product-series,
   product, document, page, support-article, navigation-menu,
   contact-info, site-settings

2. Ensure the "Public" role does NOT have create/update/delete on any content type.

3. Create an API token named "Frontend Read Token" with read-only access and full-access scope limited to the above types.

Show the full src/index.ts bootstrap code.
```

---

## Phase 1 — Strapi Content Models

**Goal:** All 11 content types and 6 components defined in Strapi, matching the spec exactly.

### 1.1 — Shared components

**Antigravity Prompt:**
```
In the Strapi 5 backend, create the following reusable components under src/components/. Output the complete JSON schema for each file:

1. src/components/shared/seo.json
   Fields: metaTitle (String, max 60), metaDescription (Text, max 160),
   canonicalUrl (String), ogImage (Media, single)

2. src/components/shared/link.json
   Fields: label (String, required), url (String, required), openInNewTab (Boolean, default false)

3. src/components/shared/hero-section.json
   Fields: headline (String, required), subheadline (Text),
   backgroundImage (Media, single), ctaButtons (Component: shared.link, repeatable)

4. src/components/shared/alert-banner.json
   Fields: message (Text, required), type (Enum: info/warning/promo, default info),
   active (Boolean, default false)

5. src/components/product/spec-item.json
   Fields: label (String, required), value (String, required)

6. src/components/product/feature-item.json
   Fields: text (String, required)

Output all 6 JSON files in full.
```

---

### 1.2 — Collection types: taxonomy

**Antigravity Prompt:**
```
In the Strapi 5 backend, create four collection type schemas. Output the complete JSON schema under src/api/<name>/content-types/<name>/schema.json for each:

1. product-domain
   Fields: name (String, required, unique), slug (UID from name, required),
   shortDescription (Text), icon (String), sortOrder (Integer, default 0)

2. product-family
   Fields: name (String, required), slug (UID from name, required),
   shortDescription (Text), heroImage (Media, single),
   domain (Relation: manyToOne → product-domain, required),
   showInNav (Boolean, default true), sortOrder (Integer, default 0)

3. product-category
   Fields: name (String, required), slug (UID from name, required),
   shortDescription (Text),
   family (Relation: manyToOne → product-family, required),
   sortOrder (Integer, default 0)

4. product-series
   Fields: name (String, required), slug (UID from name, required),
   seriesCode (String), family (Relation: manyToOne → product-family),
   sortOrder (Integer, default 0)

Output all 4 schema files.
```

---

### 1.3 — Product collection type

**Antigravity Prompt:**
```
In the Strapi 5 backend, create the product collection type.
Output the full JSON schema at src/api/product/content-types/product/schema.json.

Required fields:
- name: String, required
- modelCode: String
- slug: UID from name, required
- domain: Relation manyToOne → product-domain, required
- family: Relation manyToOne → product-family, required
- category: Relation manyToOne → product-category
- series: Relation manyToOne → product-series
- status: Enum [active, legacy, discontinued], default active, required
- shortDescription: Text
- longDescription: RichText (blocks)
- keyFeatures: Component product.feature-item, repeatable
- specs: Component product.spec-item, repeatable
- applications: RichText
- compliance: JSON (array of strings)
- isNDAA: Boolean, default false
- relatedProducts: Relation manyToMany → product (self)
- mainImage: Media, single image
- gallery: Media, multiple images
- datasheets: Relation manyToMany → document
- manuals: Relation manyToMany → document
- software: Relation manyToMany → document
- tags: JSON (array of strings)
- seo: Component shared.seo, single

Output the complete schema.json file.
```

---

### 1.4 — Document, Page, Support Article collection types

**Antigravity Prompt:**
```
In the Strapi 5 backend, create three more collection types. Output full schema.json for each:

1. document (src/api/document/content-types/document/schema.json)
   Fields: title (String, required), slug (UID from title, required),
   type (Enum: datasheet/manual/brochure/software/other, required),
   file (Media, single, required), relatedProducts (Relation manyToMany → product),
   publishedDate (Date), version (String), language (String, default "EN")

2. page (src/api/page/content-types/page/schema.json)
   Fields: title (String, required), slug (UID from title, required),
   pageType (Enum: home/about/support/legal/other, required),
   content (RichText blocks), heroImage (Media, single),
   seo (Component: shared.seo, single)

3. support-article (src/api/support-article/content-types/support-article/schema.json)
   Fields: title (String, required), slug (UID from title, required),
   category (Enum: glossary/technology/warranty/registration/other, required),
   content (RichText blocks), attachments (Media, multiple),
   seo (Component: shared.seo, single)

Output all 3 schema.json files.
```

---

### 1.5 — Single types

**Antigravity Prompt:**
```
In the Strapi 5 backend, create three single types. Output the full schema.json for each:

1. navigation-menu (src/api/navigation-menu/content-types/navigation-menu/schema.json)
   Fields: mainNav (JSON), footerNav (JSON)
   kind: "singleType"

2. contact-info (src/api/contact-info/content-types/contact-info/schema.json)
   Fields: phone (String), email (String), address (Text),
   mapEmbed (Text), contactFormTarget (String)
   kind: "singleType"

3. site-settings (src/api/site-settings/content-types/site-settings/schema.json)
   Fields: siteName (String), logoLight (Media, single), logoDark (Media, single),
   favicon (Media, single), socialLinks (JSON), defaultSeo (Component: shared.seo, single)
   kind: "singleType"

Output all 3 schema.json files.
```

**Gate:** All content types visible in Strapi admin panel. Relations resolve correctly. No TypeScript errors.

---

## Phase 2 — Seed Data: Domains, Families & Categories

**Goal:** All 8 product domains, their families, and all categories entered in Strapi before any product migration.

### 2.1 — Seed script

**Antigravity Prompt:**
```
Write a Node.js/TypeScript seed script at backend/scripts/seed-taxonomy.ts.

It should use the Strapi REST API (base URL from process.env.STRAPI_URL, token from process.env.STRAPI_ADMIN_TOKEN) to POST entries in this order:
1. product-domain (all 8, with slug and sortOrder)
2. product-family (for each domain, with relation to domain by slug lookup)
3. product-category (for each family, with relation to family by slug lookup)
4. product-series (MAXECO, MAX360, MAXVIEW, MAXOBILE, MAXVALUE for Enterprise Surveillance)

Use this exact taxonomy:

DOMAINS (sortOrder 1–8):
1. enterprise-networking
2. enterprise-surveillance
3. professional-displays
4. industrial-networking
5. networking-pa-system
6. video-conference
7. servers-storage
8. enterprise-software

FAMILIES per domain (include all from the brief):
Enterprise Networking: switches, routers, sfp-modules, media-convertors, wireless, network-infrastructure
Enterprise Surveillance: maxeco-series, max360-series, maxview-series, maxobile-series, maxvalue-series, camera-accessories
Professional Displays: professional-monitors, digital-signage, video-wall
Industrial Networking: industrial-switches, industrial-cameras, industrial-displays, industrial-gateways, industrial-servers, industrial-accessories
Networking PA System: paging-devices, emergency-call-box, ip-pa-server, outdoor-ip-column-speaker
Video Conference: usb-ptz-cameras, all-in-one-ptz-cameras, all-in-one-end-points, enterprise-end-points, professional-microphone
Servers & Storage: surveillance-servers, rack-workstation, box-servers, network-attached-storage, local-processing-units
Enterprise Software: sd-wan, network-management-software, video-management-software, ai-video-analytics, itms-solutions, vehicle-tracking-system, cloud-video-conference, cloud-public-addressing

CATEGORIES (create for each family — use the sub-headings from the spec, e.g. for Switches: unmanaged-switches, smart-managed-switches, l2-managed-switches, l3-managed-switches, datacenter-switches):
[Insert all categories from the product hierarchy in the brief]

The script should be idempotent: check if slug exists before creating.
Output the full script.
```

---

## Phase 3 — Content Migration from Joomla

**Goal:** All product models, datasheets, manuals, and images migrated from the live Joomla site.

### 3.1 — Joomla audit scraper

**Antigravity Prompt:**
```
Write a Node.js/TypeScript script at backend/scripts/audit-joomla.ts.

It should crawl https://www.plexonics.com (respecting robots.txt, 1 req/sec rate limit) and:
1. Discover all product URLs matching the pattern /index.php/products/...
2. For each product page, extract: product name, model code, all text content, all PDF download links (href ending in .pdf), all <img> src attributes
3. Output a JSON file at backend/scripts/output/joomla-audit.json with structure:
   { products: [{ url, name, modelCode, pdfLinks: [], imageLinks: [], rawText }] }
4. Output a separate CSV at backend/scripts/output/pdf-links.csv with columns: productUrl, pdfUrl, filename

Use cheerio for HTML parsing. Use p-queue for rate limiting.
Output the full script.
```

---

### 3.2 — Product migration script

**Antigravity Prompt:**
```
Write a Node.js/TypeScript migration script at backend/scripts/migrate-products.ts.

It reads backend/scripts/output/joomla-audit.json and for each product:
1. Looks up the correct domain, family, category slugs based on the URL path segments
2. Uploads the product's mainImage to Strapi media library (download from Joomla, POST to /api/upload)
3. Creates a product entry in Strapi via POST /api/products with all fields populated
4. For each PDF link: downloads the file, uploads to Strapi media library, creates a document entry (type=datasheet or manual based on filename pattern), links it to the product

The script should:
- Be idempotent (check modelCode before creating)
- Log progress to console and errors to backend/scripts/output/migration-errors.log
- Accept a --dry-run flag that logs what would be created without POSTing

Use environment variables: STRAPI_URL, STRAPI_ADMIN_TOKEN.
Output the full script.
```

**Gate:** All 8 domains populated. Product count matches live site. All PDF links resolve. Run `node scripts/migrate-products.ts --dry-run` and confirm zero errors before running live.

---

## Phase 4 — Next.js Frontend

**Goal:** Fully functioning frontend at all routes defined in Section 8 of the brief, matching brand guidelines exactly.

### 4.1 — Design tokens & global styles

**Antigravity Prompt:**
```
In the Next.js frontend (/frontend), set up design tokens and global styles matching the Plexonics brand:

1. tailwind.config.ts — extend theme with:
   colors:
     brand: { red: '#DC2127', darkRed: '#B71C1C' }
     ui: { charcoal: '#333333', nearBlack: '#1A1A1A', lightGray: '#F8F9FA', border: '#DDDDDD', success: '#27AE60', error: '#B71C1C' }
   fontFamily: { sans: ['Arial', 'sans-serif'] }
   No custom font imports — Arial only per brand spec.

2. src/app/globals.css — set:
   --primary: #DC2127
   --secondary: #333333
   --background: #FFFFFF
   --footer-bg: #1A1A1A
   --section-bg: #F8F9FA
   --border: #DDDDDD
   Base body styles: font-family Arial, color #333333, background #FFFFFF

3. src/components/ui/Button.tsx — variants:
   primary: bg #DC2127, text white, hover bg #B71C1C
   outline: border #DC2127, text #DC2127, bg white, hover bg #DC2127 text white
   Both: Arial Bold 14-16px, px-6 py-3, rounded-sm

Output all 3 files in full.
```

---

### 4.2 — Layout: Header & Footer

**Antigravity Prompt:**
```
In the Next.js frontend, create the site layout components:

1. src/components/layout/Header.tsx
   - Top announcement bar: bg #DC2127, white text, fetches alert-banner from Strapi (hidden if active=false)
   - Navigation bar: white bg, Plexonics logo left (use placeholder /images/logo-sticky.png until real files supplied)
   - Nav items: Home, About Us (dropdown: Our Milestones / Partner Program / E-Waste Management),
     Products (mega-menu — fetch all product-domains from Strapi, list their families),
     Support (dropdown: Product Registration / Learning Center / Warranty Policy),
     Contact Us
   - Active item: #DC2127 color, bold, underline indicator
   - Responsive: hamburger menu on mobile
   - Phone number 1800-1200-023 visible on desktop in top-right
   - Use Next.js Link for all nav items

2. src/components/layout/Footer.tsx
   - Background #1A1A1A, text white
   - Four columns: Quick Links, Products (top domains), Support, Company + Contact
   - Links in #DC2127, hover underline
   - Legal row at bottom: Privacy Policy · Terms of Use · © 2026 Plexonics Technologies Limited
   - Social icons row (LinkedIn, Twitter/X, YouTube) — links from site-settings

3. src/app/layout.tsx — wrap children in <Header /> and <Footer />

Output all 3 files in full. Use Tailwind CSS only, no external CSS files.
```

---

### 4.3 — Homepage

**Antigravity Prompt:**
```
In the Next.js frontend, create the homepage at src/app/page.tsx.

Sections (in order):
1. Hero banner — uses shared.hero-section from Strapi site-settings or a hardcoded fallback.
   Bold headline, sub-headline, two CTA buttons (primary + outline style).
   Full-width, bg #DC2127 or a product image, white text.

2. 8 Product Domains grid — fetch all product-domain entries from Strapi.
   Each card: icon, domain name, short description, "Explore →" link to /products/:slug.
   White cards, #DDDDDD border, hover: red left-border accent.
   4-col grid on desktop, 2-col tablet, 1-col mobile.

3. Featured products strip — fetch 6 products where status=active, sorted by updatedAt desc.
   Product card: white bg, product image, model code in #DC2127, name, shortDescription, "View Details" link.

4. Solution callout banner — full-width #F8F9FA section.
   Headline: "Trusted Networking & Surveillance Solutions", subtext, CTA to /contact.

5. Why Plexonics — 3-column grid: icons + short text for key differentiators.

Use Tailwind only. Fetch data server-side (async page component).
Output the full page.tsx and any sub-components created.
```

---

### 4.4 — Products section routes

**Antigravity Prompt:**
```
In the Next.js frontend, implement all product catalog routes using the App Router:

1. src/app/products/page.tsx
   Fetch all product-domain entries. Render a grid of domain cards (same style as homepage domains section). Page title "Our Products".

2. src/app/products/[domainSlug]/page.tsx
   Fetch domain by slug + all product-family entries where domain.slug = domainSlug.
   Render domain hero (name + shortDescription + heroImage), then family cards grid.
   Each card links to /products/:domainSlug/:familySlug.
   Generate static params from all domain slugs.

3. src/app/products/[domainSlug]/[familySlug]/page.tsx
   Fetch family by slug + all product-category entries for that family.
   Render breadcrumb (Home > Products > Domain > Family).
   Render category list with links to next level.
   If family has series (Enterprise Surveillance), group categories under series headings.
   Generate static params.

4. src/app/products/[domainSlug]/[familySlug]/[categorySlug]/page.tsx
   Fetch category + all products in that category.
   Render product listing grid: mainImage, modelCode (#DC2127 bold), name, shortDescription, "View Details" button.
   Filterable by tags (isNDAA, PoE, etc.) using client-side filter chips.
   Generate static params.

5. src/app/products/[domainSlug]/[familySlug]/[categorySlug]/[productSlug]/page.tsx
   Fetch single product with all relations populated (domain, family, category, datasheets, manuals, software, relatedProducts).
   Layout:
   - Breadcrumb full path
   - Left: mainImage + gallery thumbnails
   - Right: modelCode (#DC2127), name (H1), shortDescription, status badge, compliance badges (NDAA flag if isNDAA=true)
   - Tabs: Overview | Specifications | Downloads | Related Products
   - Specifications tab: renders specs[] as a two-column table
   - Downloads tab: lists datasheets, manuals, software with file type icon and download button
   - Related Products: small product card grid

Create a shared src/lib/strapi-queries.ts with typed fetch functions for each query.
Output all 5 route files plus strapi-queries.ts.
```

---

### 4.5 — Support & About pages

**Antigravity Prompt:**
```
In the Next.js frontend, implement the remaining page routes:

1. src/app/about/[slug]/page.tsx
   Fetch page by slug where pageType=about. Render title, heroImage, rich text content.
   Handle slugs: about-us, our-milestones, partner-program, e-waste-management.

2. src/app/support/product-registration/page.tsx
   Fetch page with slug=product-registration. Render content.
   Add a product registration form: Name, Email, Product Model (text), Serial Number, Purchase Date, Retailer. Submit to a Next.js API route that emails info@plexonics.com.

3. src/app/support/learning-center/[slug]/page.tsx
   Fetch support-article by slug where category=glossary or category=technology.
   Render title, content (rich text), attachments list.

4. src/app/support/[slug]/page.tsx
   Generic support page fallback. Fetch page or support-article by slug.

5. src/app/contact/page.tsx
   Fetch contact-info singleton.
   Left side: address, phone (1800-1200-023), info@plexonics.com, Google Maps embed.
   Right side: contact form fields — Name, Company, Email, Phone, Type of Enquiry (dropdown: General/Support/Partnership/Careers), Message.
   Add hCaptcha. Submit to /api/contact which sends to info@plexonics.com via SMTP.
   Show success/error state.

6. src/app/api/contact/route.ts
   POST handler: validate fields, send email via nodemailer (SMTP config from env: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS), return {success: true} or {error}.

Output all 6 files.
```

---

## Phase 5 — SEO & Redirects

**Goal:** All Joomla `/index.php/` URLs redirect 301 to clean new URLs. No broken inbound links.

### 5.1 — next.config.js redirects

**Antigravity Prompt:**
```
In the Next.js frontend, configure next.config.ts with a redirects() function.

Add 301 redirects for all Joomla URL patterns listed below. Use regex-based permanent redirects where applicable:

1. /index.php/products/:path* → /products/:path*
2. /index.php/about-us → /about/about-us
3. /index.php/about-us/our-milestones → /about/our-milestones
4. /index.php/about-us/partner-program → /about/partner-program
5. /index.php/about-us/e-waste-management → /about/e-waste-management
6. /index.php/support/product-registration → /support/product-registration
7. /index.php/support/warranty-policy → /support/warranty-policy
8. /index.php/support/learning-center/:slug* → /support/learning-center/:slug*
9. /index.php/contact-us → /contact
10. /index.php/:path* → /:path* (catch-all for any remaining Joomla paths)
11. /images/DATASHEETS/:filename → /downloads (with a note that PDF-level redirects should be handled at Nginx level)

Also add a redirects note comment explaining: "For PDF binary redirects (/images/DATASHEETS/*.pdf → Strapi media URLs), configure at the Nginx/Caddy reverse proxy level using a map directive — Next.js redirects add overhead for binary files."

Output the full next.config.ts.
```

---

### 5.2 — Nginx redirect config for PDFs

**Antigravity Prompt:**
```
Write an Nginx server block snippet for handling legacy Joomla PDF redirects.

Requirements:
- Location block matching /images/DATASHEETS/ and /images/MANUALS/
- 301 redirect to the Strapi media URL pattern: https://media.plexonics.com/plexonics/datasheets/$1
- Preserve filename in the redirect
- Add a location block for /index.php that strips the prefix and redirects to the clean URL (for any CDN/load balancer that doesn't run Next.js redirects)
- Add GZIP compression for text/html, application/json, text/css
- Add cache headers: product images 30d, PDFs 7d, HTML no-cache

Output the full Nginx server block as nginx-plexonics.conf.
```

---

## Phase 6 — QA Checklist

Run this before go-live. Use the prompt below to generate a test suite.

**Antigravity Prompt:**
```
Write a Playwright end-to-end test suite at frontend/e2e/plexonics.spec.ts covering:

1. Homepage loads, H1 exists, 8 domain cards render, no broken images
2. /products renders all 8 domain cards
3. /products/enterprise-networking/switches/l2-managed-switches shows product listing
4. A product detail page renders: model code in red, Specifications tab, Downloads tab with at least 1 PDF link
5. /contact form: fill all fields, submit, success message shown (mock the email API route)
6. All Joomla redirect patterns return 301: test /index.php/products/enterprise-networking/switches → /products/enterprise-networking/switches
7. /support/product-registration page exists and renders a form
8. Footer contains phone number 1800-1200-023 and info@plexonics.com
9. No console errors on homepage, product listing, product detail, contact pages
10. Mobile viewport (375px): hamburger menu appears, nav items hidden, tap hamburger opens nav

Use Playwright with TypeScript. Output the full test file.
```

---

## Phase 7 — Go-Live

### Pre-launch checklist

**Antigravity Prompt:**
```
Create a go-live checklist markdown file at docs/go-live-checklist.md covering:

Infrastructure:
- [ ] PostgreSQL production database provisioned and backed up
- [ ] S3 bucket (or Cloudinary account) configured in Strapi for media uploads
- [ ] Strapi deployed to production server (PM2 or Docker), HTTPS enabled
- [ ] Next.js deployed (Vercel recommended or self-hosted with PM2)
- [ ] Nginx/Caddy configured as reverse proxy with SSL (Let's Encrypt)
- [ ] DNS records updated: www.plexonics.com → new server IP
- [ ] Old Joomla server kept live for 72h as fallback

Content:
- [ ] All 8 product domains seeded
- [ ] Product count matches live site (verify each domain manually)
- [ ] All datasheet PDFs uploaded and linked to products
- [ ] All manual PDFs uploaded and linked
- [ ] All product images present (white background confirmed)
- [ ] site-settings: logo files replaced (client to supply SVG + PNG)
- [ ] contact-info: address, phone, mapEmbed confirmed
- [ ] navigation-menu: mainNav JSON matches Section 4.1 exactly

SEO:
- [ ] All /index.php/ redirects tested with `curl -I`
- [ ] PDF redirects tested (pick 5 old Joomla PDF URLs, confirm 301)
- [ ] Google Search Console: submit new sitemap (Next.js sitemap.xml)
- [ ] Canonical URLs set on all product pages
- [ ] Meta titles and descriptions populated (spot-check 20 products)

Forms & Email:
- [ ] Contact form sends email to info@plexonics.com (test in production)
- [ ] hCaptcha or reCAPTCHA v3 active
- [ ] SMTP relay configured and tested (SendGrid / AWS SES / Mailgun)
- [ ] Product registration form tested end-to-end

Performance & Monitoring:
- [ ] Lighthouse score > 85 on homepage and a product detail page
- [ ] Uptime monitor configured (e.g. UptimeRobot or Better Uptime)
- [ ] Error tracking configured (Sentry on both Strapi and Next.js)
- [ ] Core Web Vitals: LCP < 2.5s, CLS < 0.1

Output the full checklist as docs/go-live-checklist.md.
```

---

## Summary: Antigravity Prompt Sequence

| # | Phase | Prompt Target |
|---|-------|--------------|
| 0.1 | Monorepo scaffolding | Initialise backend + frontend |
| 0.2 | Strapi permissions | Bootstrap roles & API token |
| 1.1 | Components | 6 shared/product components |
| 1.2 | Taxonomy types | 4 collection type schemas |
| 1.3 | Product type | Full product schema |
| 1.4 | Doc/Page/Support types | 3 collection schemas |
| 1.5 | Single types | 3 single type schemas |
| 2.1 | Seed script | All 8 domains + families + categories |
| 3.1 | Joomla scraper | Audit all live product URLs & PDFs |
| 3.2 | Migration script | Import products + media into Strapi |
| 4.1 | Design tokens | Tailwind config + global CSS + Button |
| 4.2 | Header & Footer | Layout components |
| 4.3 | Homepage | All homepage sections |
| 4.4 | Product routes | All 5 catalog route files |
| 4.5 | Support/About/Contact | Remaining page routes |
| 5.1 | Next.js redirects | next.config.ts redirect rules |
| 5.2 | Nginx config | PDF + legacy URL redirects |
| 6 | E2E tests | Playwright test suite |
| 7 | Go-live checklist | Full pre-launch checklist doc |

---

*Document covers Plexonics Phase 1 only. All product data sourced from www.plexonics.com as of May 2026.*
