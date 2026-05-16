# PLEXONICS WEB PLATFORM
## Phase 1 Handover & Operations Manual

---

### **1. Executive Summary**
The new Plexonics web platform represents a modern, highly optimized leap forward from the legacy Joomla infrastructure. By decoupling the architecture into a **headless CMS (Strapi 5)** and a high-performance **frontend (Next.js 14)**, the site delivers a blazing-fast, responsive user experience, robust visual presence conforming to brand colors, and perfect SEO preservation.

This manual serves as the comprehensive technical and operational blueprint for the Plexonics IT and Content teams to run, modify, and successfully deploy the platform.

---

### **2. Architectural & System Overview**

The system employs a decoupled, secure modern architecture:

```
[Web Browser] <---> (HTTPS / HTML5 / JS) <---> [Next.js 14 App Router]
                                                        |
                                            (REST API / Token Auth)
                                                        |
                                                        v
                                            [Strapi 5 Headless CMS]
                                                        |
                                            (Local / Cloud Storage)
                                                        |
                                                        v
                                             [PostgreSQL / SQLite]
```

#### **Core Tech Stack**
*   **Frontend Framework:** Next.js 14 (App Router, dynamic page generation, React server components).
*   **Backend CMS:** Strapi 5 (Community Edition, headless, schema-driven).
*   **Database:** PostgreSQL (recommended for production) / SQLite (pre-configured for development).
*   **Styling & UI:** Vanilla CSS + TailwindCSS framework ensuring responsive grid layouts.
*   **Testing:** Playwright E2E automation suite.

---

### **3. Accomplishments & Completed Work**

#### **3.1 Strapi 5 Migration & Backend Architecture**
*   **Taxonomy Engine:** Designed a robust five-level taxonomy structure:
    `Product Domain ➔ Product Family ➔ Product Category ➔ Product Series ➔ Product`
*   **Data Integrity:** Migrated **358 products** from the Joomla audit database directly into Strapi.
*   **Rich Media Mapping:** Created media relationships linking datasheets, manual PDFs, software clients, and product galleries dynamically to each model.

#### **3.2 UI/UX Improvements**
*   **Brand Aesthetics:** Enforced consistent red (`#E31E24`) brand colors on all interactive components.
*   **CTA Placement:** Added a permanent, highly visible "Get in Touch" call-to-action button in the site header and fixed visibility conflicts on the homepage hero buttons.
*   **Tabs Interface:** Implemented smooth dynamic tabs for **Overview**, **Specifications**, and **Downloads** on the product detail templates.

#### **3.3 Search Engine Optimization (SEO)**
*   **Joomla Redirects:** Configured redirect rules converting legacy `index.php` paths into new, SEO-friendly clean routes without search engine ranking penalties.
*   **Metadata Integration:** Added dynamic metadata rendering fetching Strapi-configured Meta Titles and Descriptions for every route.
*   **Sitemap & Indexing:** Enabled dynamically generated `/sitemap.xml` and standard `/robots.txt` configuration.

---

### **4. Content Management Guide (For Editors)**

Editors can easily update all content on the live site directly from the **Strapi Admin Panel**.

#### **4.1 Accessing the CMS**
*   **Staging/Production URL:** `http://<your-domain>:1337/admin`
*   **Local URL:** `http://localhost:1337/admin`

#### **4.2 Adding a New Product**
1.  Navigate to **Content Manager** ➔ **Product**.
2.  Click **Create new entry** (top-right).
3.  **Basic Details:** Fill in the Product Name, Slug, Model Code, and choose a Status (`active`, `legacy`, or `discontinued`).
4.  **Taxonomy Association:** Select the appropriate **Product Category** from the dropdown menu to position it in the correct URL structure.
5.  **Technical Specs:** Under the **Specs** component, click "Add entry" to define technical specs (e.g., *Resolution: 5 Megapixel*, *Interface: RJ45*).
6.  **Media & Files:** Upload a main image (white background, transparent PNG format preferred) and associate Datasheet/Manual relations.
7.  Click **Save**, then **Publish** to make the product visible on the live frontend.

---

### **5. System Operations & Go-Live Checklist**

Before launching the site in production, ensure all items on this checklist are completed:

#### **5.1 Environment Variables Setup**
Create a production `.env` file in the `frontend/` directory with the following variables:
```env
NEXT_PUBLIC_STRAPI_API_URL=https://api.plexonics.com
STRAPI_API_TOKEN=<your-generated-read-only-token>
HCAPTCHA_SITEKEY=<your-production-hcaptcha-sitekey>
```

#### **5.2 Database & Media Storage Production Migration**
*   **Database:** Modify the database configuration in the Strapi backend (`config/database.ts`) to target your PostgreSQL instance.
*   **Asset Storage:** For horizontal scaling, configure a cloud provider plugin (like AWS S3 or Cloudinary) in `config/plugins.ts` to host PDF datasheets and images securely.

#### **5.3 Reverse Proxy Configuration (Nginx / Caddy)**
We highly recommend routing requests through a reverse proxy. Here is the Nginx mapping configuration to preserve legacy Joomla PDFs and optimize caching:

```nginx
# Cache rules for PDF datasheets
location ~* \.(pdf)$ {
    root /var/www/plexonics/uploads;
    expires 30d;
    add_header Cache-Control "public, no-transform";
}

# Redirect all legacy index.php traffic to clean URLs
location /index.php/ {
    rewrite ^/index.php/(.*)$ /$1 permanent;
}
```

---

### **6. Run-Time Maintenance**

#### **Local Development Execution**
To start the services locally for ongoing development:
*   **Backend:** `npm run dev` inside `/backend`
*   **Frontend:** `npm run dev` inside `/frontend`

#### **Automated Verification**
To run the automated visual validation and E2E regression test suite:
```bash
cd frontend
npx playwright test --project=chromium
```
This script validates sitemaps, forms, redirects, and responsive rendering automatically in under two minutes.
