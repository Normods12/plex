# Plexonics Migration Guide

## What's already done for you
- ✅ PostgreSQL database `plexonics` created
- ✅ `backend/.env` configured with your DB credentials
- ✅ `frontend/.env.local` created
- ✅ All code ready

## Steps to run

### 1. Start Strapi
Open a terminal and run:
```
npm run dev --workspace=backend
```
Wait for: `Strapi started successfully` then open http://localhost:1337/admin

### 2. Create your admin account
Fill in name, email, password at http://localhost:1337/admin

### 3. Get your API token
- Go to Settings → API Tokens → Create new API Token
- Name: `Migration Token`, Type: `Full Access`
- Click Save → **Copy the token** (shown only once)

### 4. Run the full migration
Open a NEW terminal (keep Strapi running in the first one):

```
cd c:\Sarisa-projects\plexonics\backend

set STRAPI_ADMIN_TOKEN=PASTE_YOUR_TOKEN_HERE
set STRAPI_URL=http://localhost:1337

npx ts-node scripts/full-migration.ts
```

This will:
1. Seed all 8 domains, 43 families, 150+ categories
2. Scrape www.plexonics.com for all products
3. Upload all images and PDFs to Strapi
4. Create all product entries

**Takes 30-90 minutes** depending on internet speed.

### 5. Dry run first (optional but recommended)
```
npx ts-node scripts/full-migration.ts --dry-run
```
Shows what would be created without making any changes.

### 6. If scrape already done, skip it
```
npx ts-node scripts/full-migration.ts --skip-scrape
```

### 7. Start the frontend
```
npm run dev --workspace=frontend
```
Open http://localhost:3000

## Troubleshooting

| Error | Fix |
|-------|-----|
| `STRAPI_ADMIN_TOKEN is not set` | Run `set STRAPI_ADMIN_TOKEN=xxx` in same terminal |
| `Cannot reach Strapi` | Make sure `npm run dev --workspace=backend` is running |
| `Domain not found` | URL structure changed — check migration-errors.log |
| Products have wrong names | Re-run migration after fixing taxonomy |

## After migration — manual steps in Strapi admin

1. **Site Settings** → Add logo, favicon, social links
2. **Contact Info** → Add address, phone, map embed  
3. **Products** → Add specs, key features for important products
4. **Products** → Tick `isNDAA` for NDAA-compliant products
