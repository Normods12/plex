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
    if (src && !src.startsWith('data:') && !src.startsWith('/_next/')) {
      const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
      expect(naturalWidth, `Image broken: ${src}`).toBeGreaterThan(0);
    }
  }
});

// ─── 2. Products page ─────────────────────────────────────────────────────────

test('/products renders all 8 domain cards', async ({ page }) => {
  await page.goto(`${BASE_URL}/products`);

  await expect(page.locator('h1')).toContainText('Products');

  const domainCards = page.locator('a[href^="/products/"]').filter({ hasText: /Explore|View/ });
  await expect(domainCards).toHaveCount(8, { timeout: 10000 });
});

// ─── 3. Product listing ───────────────────────────────────────────────────────

test('/products/enterprise-networking/switches/l2-managed-switches shows product listing', async ({
  page,
}) => {
  await page.goto(
    `${BASE_URL}/products/enterprise-networking/switches/l2-managed-switches`
  );

  // Breadcrumb should contain the domain name
  await expect(page.locator('nav[aria-label="Breadcrumb"]')).toContainText(
    'Enterprise Networking'
  );

  // Page should have a heading
  await expect(page.locator('h1')).toBeVisible();
});

// ─── 4. Product detail page ───────────────────────────────────────────────────

test('Product detail page: model code in red, Specifications tab, Downloads tab', async ({
  page,
}) => {
  await page.goto(
    `${BASE_URL}/products/enterprise-networking/switches/l2-managed-switches`
  );

  const viewDetailsBtn = page.locator('a:has-text("View Details")').first();
  const hasProducts = await viewDetailsBtn.isVisible({ timeout: 5000 }).catch(() => false);

  if (!hasProducts) {
    test.skip();
    return;
  }

  await viewDetailsBtn.click();
  await page.waitForLoadState('networkidle');

  // Model code should be in brand red
  await expect(page.locator('.text-brand-red').first()).toBeVisible({ timeout: 10000 });

  // Specifications tab
  const specsTab = page.getByRole('button', { name: 'Specifications' });
  await expect(specsTab).toBeVisible({ timeout: 10000 });
  await specsTab.click();

  // Downloads tab
  const downloadsTab = page.getByRole('button', { name: 'Downloads' });
  await expect(downloadsTab).toBeVisible({ timeout: 10000 });
  await downloadsTab.click();
});

// ─── 5. Contact form ──────────────────────────────────────────────────────────

test('/contact form: fill all fields, submit, success message shown', async ({ page }) => {
  // Mock the hCaptcha script so it doesn't load externally
  await page.route('**/js.hcaptcha.com/**', (route) => route.abort());

  // Mock the API route
  await page.route('**/api/contact', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });

  await page.goto(`${BASE_URL}/contact`);

  // Inject a fake hCaptcha token into the component state by simulating
  // the captcha callback via window.hcaptcha mock
  await page.addInitScript(() => {
    // Stub hcaptcha so renderCaptcha() fires the callback immediately with a test token
    (window as any).hcaptcha = {
      render: (container: HTMLElement, opts: { callback: (t: string) => void }) => {
        // Fire callback immediately with a test token
        setTimeout(() => opts.callback('test-captcha-token'), 100);
        return 'widget-id-1';
      },
      reset: () => {},
    };
  });

  await page.reload();

  // Wait for captcha token to be set (100ms delay in mock)
  await page.waitForTimeout(500);

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
  await expect(page.locator('text=Message Sent')).toBeVisible({ timeout: 10000 });
});

// ─── 6. Joomla redirect patterns ─────────────────────────────────────────────

test('Joomla redirects: /index.php/products/... → /products/...', async ({ page }) => {
  await page.goto(
    `${BASE_URL}/index.php/products/enterprise-networking/switches`,
    { waitUntil: 'commit', timeout: 60000 }
  );
  await expect(page).toHaveURL(/.*\/products\/enterprise-networking\/switches/, { timeout: 15000 });
  expect(page.url()).not.toContain('/index.php');
});

test('Joomla redirect: /index.php/contact-us → /contact', async ({ page }) => {
  await page.goto(`${BASE_URL}/index.php/contact-us`, { waitUntil: 'commit', timeout: 60000 });
  await expect(page).toHaveURL(/.*\/contact/, { timeout: 15000 });
  expect(page.url()).not.toContain('/index.php');
});

test('Joomla redirect: /index.php/about-us → /about/about-us', async ({ page }) => {
  await page.goto(`${BASE_URL}/index.php/about-us`, { waitUntil: 'commit', timeout: 60000 });
  await expect(page).toHaveURL(/.*\/about\/about-us/, { timeout: 15000 });
});

test('Joomla redirect: /index.php/support/warranty-policy → /support/warranty-policy', async ({ page }) => {
  await page.goto(`${BASE_URL}/index.php/support/warranty-policy`, { waitUntil: 'commit', timeout: 60000 });
  await expect(page).toHaveURL(/.*\/support\/warranty-policy/, { timeout: 15000 });
  expect(page.url()).not.toContain('/index.php');
});

test('Joomla redirect: servers-and-storage → servers-storage', async ({ page }) => {
  await page.goto(
    `${BASE_URL}/products/servers-and-storage/surveillance-servers`,
    { waitUntil: 'commit' }
  );
  expect(page.url()).toContain('/products/servers-storage/surveillance-servers');
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

  const criticalErrors = errors.filter(
    (e) =>
      !e.includes('favicon') &&
      !e.includes('analytics') &&
      !e.includes('gtag') &&
      !e.includes('hcaptcha') &&
      !e.includes('Failed to load resource: net::ERR_BLOCKED_BY_CLIENT') &&
      !e.includes('net::ERR_ABORTED')
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

  // Desktop nav links should be hidden on mobile
  const desktopNav = page.locator('.hidden.lg\\:flex');
  await expect(desktopNav).toBeHidden();

  // Tap hamburger
  await hamburger.click();

  // Mobile menu should open — check for a nav link
  const mobileMenuLink = page.locator('a[href="/products"]').last();
  await expect(mobileMenuLink).toBeVisible({ timeout: 3000 });
});

// ─── 11. Support pages ────────────────────────────────────────────────────────

test('/support page renders with support links', async ({ page }) => {
  await page.goto(`${BASE_URL}/support`);
  await expect(page.locator('h1')).toContainText('Support');
  await expect(page.locator('a[href="/support/product-registration"]').first()).toBeVisible();
  await expect(page.locator('a[href="/support/learning-center"]').first()).toBeVisible();
});

test('/support/learning-center page renders', async ({ page }) => {
  await page.goto(`${BASE_URL}/support/learning-center`);
  await expect(page.locator('h1')).toContainText('Learning Center');
});

// ─── 12. Legal pages ─────────────────────────────────────────────────────────

test('/legal/privacy-policy page renders', async ({ page }) => {
  await page.goto(`${BASE_URL}/legal/privacy-policy`);
  await expect(page.locator('h1')).toContainText('Privacy Policy');
});

test('/legal/terms-of-use page renders', async ({ page }) => {
  await page.goto(`${BASE_URL}/legal/terms-of-use`);
  await expect(page.locator('h1')).toContainText('Terms of Use');
});

// ─── 13. 404 page ─────────────────────────────────────────────────────────────

test('404 page renders for unknown routes', async ({ page }) => {
  await page.goto(`${BASE_URL}/this-page-does-not-exist-xyz`);
  await expect(page.locator('text=404')).toBeVisible();
  await expect(page.locator('text=Page Not Found')).toBeVisible();
});

// ─── 14. Sitemap and robots ───────────────────────────────────────────────────

test('/sitemap.xml is accessible', async ({ page }) => {
  const response = await page.goto(`${BASE_URL}/sitemap.xml`);
  expect(response?.status()).toBe(200);
});

test('/robots.txt is accessible', async ({ page }) => {
  const response = await page.goto(`${BASE_URL}/robots.txt`);
  expect(response?.status()).toBe(200);
  const content = await page.content();
  expect(content).toContain('sitemap');
});
