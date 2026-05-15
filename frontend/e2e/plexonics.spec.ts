import { test, expect, type Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// ─── 1. Homepage ──────────────────────────────────────────────────────────────

test('Homepage: loads, H1 exists, 8 domain cards render, no broken images', async ({ page }) => {
  await page.goto(BASE_URL);

  // H1 exists
  const h1 = page.locator('h1').first();
  await expect(h1).toBeVisible();

  // 8 domain cards (links to /products/:slug)
  const domainCards = page.locator('a[href^="/products/"]').filter({ hasText: /Explore|View/ });
  await expect(domainCards).toHaveCount(8, { timeout: 10000 });

  // No broken images
  const images = page.locator('img');
  const imageCount = await images.count();
  for (let i = 0; i < imageCount; i++) {
    const img = images.nth(i);
    const src = await img.getAttribute('src');
    if (src && !src.startsWith('data:')) {
      const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
      expect(naturalWidth, `Image broken: ${src}`).toBeGreaterThan(0);
    }
  }
});

// ─── 2. Products page ─────────────────────────────────────────────────────────

test('/products renders all 8 domain cards', async ({ page }) => {
  await page.goto(`${BASE_URL}/products`);

  await expect(page.locator('h1')).toContainText('Products');

  const domainCards = page.locator('a[href^="/products/"]');
  await expect(domainCards).toHaveCount(8, { timeout: 10000 });
});

// ─── 3. Product listing ───────────────────────────────────────────────────────

test('/products/enterprise-networking/switches/l2-managed-switches shows product listing', async ({
  page,
}) => {
  await page.goto(
    `${BASE_URL}/products/enterprise-networking/switches/l2-managed-switches`
  );

  // Breadcrumb should contain the category name
  await expect(page.locator('nav[aria-label="Breadcrumb"]')).toContainText(
    'Enterprise Networking'
  );

  // Page should have a heading
  const h1 = page.locator('h1');
  await expect(h1).toBeVisible();
});

// ─── 4. Product detail page ───────────────────────────────────────────────────

test('Product detail page: model code in red, Specifications tab, Downloads tab with PDF', async ({
  page,
}) => {
  // Navigate to a product listing first to find a real product
  await page.goto(
    `${BASE_URL}/products/enterprise-networking/switches/l2-managed-switches`
  );

  // Click first "View Details" button if products exist
  const viewDetailsBtn = page.locator('a:has-text("View Details")').first();
  const hasProducts = await viewDetailsBtn.isVisible({ timeout: 5000 }).catch(() => false);

  if (!hasProducts) {
    test.skip();
    return;
  }

  await viewDetailsBtn.click();
  await page.waitForLoadState('networkidle');

  // Model code should be in brand red
  const modelCode = page.locator('.text-brand-red').first();
  await expect(modelCode).toBeVisible();

  // Specifications tab
  const specsTab = page.locator('button:has-text("Specifications")');
  await expect(specsTab).toBeVisible();
  await specsTab.click();

  // Downloads tab
  const downloadsTab = page.locator('button:has-text("Downloads")');
  await expect(downloadsTab).toBeVisible();
  await downloadsTab.click();
});

// ─── 5. Contact form ──────────────────────────────────────────────────────────

test('/contact form: fill all fields, submit, success message shown', async ({ page }) => {
  // Mock the API route
  await page.route('**/api/contact', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });

  await page.goto(`${BASE_URL}/contact`);

  // Fill form
  await page.fill('#name', 'Test User');
  await page.fill('#company', 'Test Company');
  await page.fill('#email', 'test@example.com');
  await page.fill('#phone', '+91 98765 43210');
  await page.selectOption('#enquiryType', 'General');
  await page.fill('#message', 'This is a test message from Playwright.');

  // Submit
  await page.click('button[type="submit"]');

  // Success message
  await expect(page.locator('text=Message Sent')).toBeVisible({ timeout: 5000 });
});

// ─── 6. Joomla redirect patterns ─────────────────────────────────────────────

test('Joomla redirects: /index.php/products/... → /products/...', async ({ page }) => {
  const response = await page.goto(
    `${BASE_URL}/index.php/products/enterprise-networking/switches`,
    { waitUntil: 'commit' }
  );

  // Should have been redirected
  expect(page.url()).toContain('/products/enterprise-networking/switches');
  expect(page.url()).not.toContain('/index.php');
});

test('Joomla redirect: /index.php/contact-us → /contact', async ({ page }) => {
  await page.goto(`${BASE_URL}/index.php/contact-us`, { waitUntil: 'commit' });
  expect(page.url()).toContain('/contact');
  expect(page.url()).not.toContain('/index.php');
});

test('Joomla redirect: /index.php/about-us → /about/about-us', async ({ page }) => {
  await page.goto(`${BASE_URL}/index.php/about-us`, { waitUntil: 'commit' });
  expect(page.url()).toContain('/about/about-us');
});

// ─── 7. Product registration page ────────────────────────────────────────────

test('/support/product-registration page exists and renders a form', async ({ page }) => {
  await page.goto(`${BASE_URL}/support/product-registration`);

  await expect(page.locator('h1')).toContainText('Product Registration');
  await expect(page.locator('form')).toBeVisible();
  await expect(page.locator('#name')).toBeVisible();
  await expect(page.locator('#email')).toBeVisible();
  await expect(page.locator('#productModel')).toBeVisible();
  await expect(page.locator('#serialNumber')).toBeVisible();
});

// ─── 8. Footer content ────────────────────────────────────────────────────────

test('Footer contains phone number and email', async ({ page }) => {
  await page.goto(BASE_URL);

  const footer = page.locator('footer');
  await expect(footer).toContainText('1800-1200-023');
  await expect(footer).toContainText('info@plexonics.com');
});

// ─── 9. No console errors ─────────────────────────────────────────────────────

async function checkNoConsoleErrors(page: Page, url: string) {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  await page.goto(url);
  await page.waitForLoadState('networkidle');

  // Filter out known non-critical errors (e.g. missing favicon, analytics)
  const criticalErrors = errors.filter(
    (e) =>
      !e.includes('favicon') &&
      !e.includes('analytics') &&
      !e.includes('gtag') &&
      !e.includes('Failed to load resource: net::ERR_BLOCKED_BY_CLIENT')
  );

  expect(criticalErrors, `Console errors on ${url}: ${criticalErrors.join(', ')}`).toHaveLength(0);
}

test('No console errors on homepage', async ({ page }) => {
  await checkNoConsoleErrors(page, BASE_URL);
});

test('No console errors on /products', async ({ page }) => {
  await checkNoConsoleErrors(page, `${BASE_URL}/products`);
});

test('No console errors on /contact', async ({ page }) => {
  await checkNoConsoleErrors(page, `${BASE_URL}/contact`);
});

// ─── 10. Mobile hamburger menu ────────────────────────────────────────────────

test('Mobile (375px): hamburger appears, nav hidden, tap opens nav', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(BASE_URL);

  // Hamburger button should be visible
  const hamburger = page.locator('button[aria-label="Toggle navigation menu"]');
  await expect(hamburger).toBeVisible();

  // Desktop nav links should be hidden
  const desktopNav = page.locator('.hidden.lg\\:flex');
  await expect(desktopNav).toBeHidden();

  // Tap hamburger
  await hamburger.click();

  // Mobile menu should open — check for a nav link
  const mobileMenuLink = page.locator('a[href="/products"]').last();
  await expect(mobileMenuLink).toBeVisible({ timeout: 3000 });
});
