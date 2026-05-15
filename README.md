# Plexonics — Phase 1

Strapi 5 + Next.js 14 monorepo for plexonics.com.

## Stack

- **Backend:** Strapi 5, TypeScript, PostgreSQL
- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS

## Prerequisites

- Node.js 20+
- PostgreSQL 15+
- npm 10+

## Setup

### 1. Clone & install

```bash
git clone <repo>
cd plexonics
npm install
```

### 2. Configure backend

```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your PostgreSQL credentials and Strapi secrets
```

### 3. Configure frontend

```bash
cp frontend/.env.example frontend/.env.local
# Edit frontend/.env.local with your Strapi URL and API token
```

### 4. Run development servers

```bash
# Run both apps concurrently
npm run dev

# Or individually
npm run dev --workspace=backend   # Strapi on http://localhost:1337
npm run dev --workspace=frontend  # Next.js on http://localhost:3000
```

## Project Structure

```
plexonics/
├── backend/          # Strapi 5 CMS
│   ├── config/       # Database, server, middleware config
│   ├── src/
│   │   ├── api/      # Content type schemas & controllers
│   │   ├── components/ # Reusable Strapi components
│   │   └── index.ts  # Bootstrap (roles, permissions, API tokens)
│   └── scripts/      # Seed & migration scripts
└── frontend/         # Next.js 14 app
    └── src/
        ├── app/      # App Router pages & API routes
        ├── components/ # React components
        └── lib/      # Strapi fetch helpers
```

## Scripts

```bash
# Seed taxonomy data (domains, families, categories)
cd backend && npx ts-node scripts/seed-taxonomy.ts

# Audit Joomla site
cd backend && npx ts-node scripts/audit-joomla.ts

# Migrate products (dry run)
cd backend && npx ts-node scripts/migrate-products.ts --dry-run

# Migrate products (live)
cd backend && npx ts-node scripts/migrate-products.ts
```
