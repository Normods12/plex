# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: plexonics.spec.ts >> /contact form: fill all fields, submit, success message shown
- Location: e2e\plexonics.spec.ts:96:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Message Sent')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('text=Message Sent')

```

```yaml
- banner:
  - navigation:
    - link "Plexonics Technologies":
      - /url: /
      - img "Plexonics Technologies"
    - link "Home":
      - /url: /
    - link "About Us":
      - /url: /about/about-us
    - link "Products":
      - /url: /products
    - link "Support":
      - /url: /support
    - link "Contact Us":
      - /url: /contact
    - link "1800-1200-023":
      - /url: tel:18001200023
    - link "Get in Touch":
      - /url: /contact
- main:
  - navigation "Breadcrumb":
    - link "Home":
      - /url: /
    - text: ›Contact Us
  - heading "Contact Us" [level=1]
  - paragraph: Get in touch with our team for sales, support, or partnership enquiries.
  - heading "Get in Touch" [level=2]
  - paragraph: Phone
  - link "1800-1200-023":
    - /url: tel:18001200023
  - text: Toll-free · Mon–Sat 9am–6pm IST
  - paragraph: Email
  - link "info@plexonics.com":
    - /url: mailto:info@plexonics.com
  - paragraph: Address
  - text: Plexonics Technologies Limited 181/23, First Floor, Industrial Area Phase I, Chandigarh - 160002, India
  - paragraph: Map will be embedded here
  - heading "Send a Message" [level=2]
  - text: Full Name
  - textbox "Full Name":
    - /placeholder: Your name
    - text: Test User
  - text: Company
  - textbox "Company":
    - /placeholder: Your company
    - text: Test Company
  - text: Email
  - textbox "Email":
    - /placeholder: you@example.com
    - text: test@example.com
  - text: Phone
  - textbox "Phone":
    - /placeholder: +91 XXXXX XXXXX
    - text: +91 98765 43210
  - text: Type of Enquiry
  - combobox "Type of Enquiry":
    - option "Select enquiry type"
    - option "General" [selected]
    - option "Support"
    - option "Partnership"
    - option "Careers"
  - text: Message
  - textbox "Message":
    - /placeholder: How can we help you?
    - text: This is a test message from Playwright.
  - text: Please complete the CAPTCHA verification.
  - button "Send Message"
- contentinfo:
  - heading "Quick Links" [level=3]
  - list:
    - listitem:
      - link "Home":
        - /url: /
    - listitem:
      - link "About Us":
        - /url: /about/about-us
    - listitem:
      - link "Our Milestones":
        - /url: /about/our-milestones
    - listitem:
      - link "Partner Program":
        - /url: /about/partner-program
    - listitem:
      - link "E-Waste Management":
        - /url: /about/e-waste-management
    - listitem:
      - link "Contact Us":
        - /url: /contact
  - heading "Products" [level=3]
  - list:
    - listitem:
      - link "Enterprise Networking":
        - /url: /products/enterprise-networking
    - listitem:
      - link "Enterprise Surveillance":
        - /url: /products/enterprise-surveillance
    - listitem:
      - link "Professional Displays":
        - /url: /products/professional-displays
    - listitem:
      - link "Industrial Networking":
        - /url: /products/industrial-networking
    - listitem:
      - link "Networking PA System":
        - /url: /products/networking-pa-system
    - listitem:
      - link "Video Conference":
        - /url: /products/video-conference
    - listitem:
      - link "Servers & Storage":
        - /url: /products/servers-storage
    - listitem:
      - link "Enterprise Software":
        - /url: /products/enterprise-software
  - heading "Support" [level=3]
  - list:
    - listitem:
      - link "Product Registration":
        - /url: /support/product-registration
    - listitem:
      - link "Learning Center":
        - /url: /support/learning-center
    - listitem:
      - link "Warranty Policy":
        - /url: /support/warranty-policy
    - listitem:
      - link "Glossary":
        - /url: /support/learning-center/glossary
  - img "Plexonics Technologies"
  - paragraph: Trusted networking and surveillance solutions for enterprise and industrial environments.
  - paragraph:
    - text: "Phone:"
    - link "1800-1200-023":
      - /url: tel:18001200023
  - paragraph:
    - text: "Email:"
    - link "info@plexonics.com":
      - /url: mailto:info@plexonics.com
  - paragraph: © 2026 Plexonics Technologies Limited. All rights reserved.
  - link "Privacy Policy":
    - /url: /legal/privacy-policy
  - text: ·
  - link "Terms of Use":
    - /url: /legal/terms-of-use
- alert
```

# Test source

```ts
  42  | // ─── 3. Product listing ───────────────────────────────────────────────────────
  43  | 
  44  | test('/products/enterprise-networking/switches/l2-managed-switches shows product listing', async ({
  45  |   page,
  46  | }) => {
  47  |   await page.goto(
  48  |     `${BASE_URL}/products/enterprise-networking/switches/l2-managed-switches`
  49  |   );
  50  | 
  51  |   // Breadcrumb should contain the domain name
  52  |   await expect(page.locator('nav[aria-label="Breadcrumb"]')).toContainText(
  53  |     'Enterprise Networking'
  54  |   );
  55  | 
  56  |   // Page should have a heading
  57  |   await expect(page.locator('h1')).toBeVisible();
  58  | });
  59  | 
  60  | // ─── 4. Product detail page ───────────────────────────────────────────────────
  61  | 
  62  | test('Product detail page: model code in red, Specifications tab, Downloads tab', async ({
  63  |   page,
  64  | }) => {
  65  |   await page.goto(
  66  |     `${BASE_URL}/products/enterprise-networking/switches/l2-managed-switches`
  67  |   );
  68  | 
  69  |   const viewDetailsBtn = page.locator('a:has-text("View Details")').first();
  70  |   const hasProducts = await viewDetailsBtn.isVisible({ timeout: 5000 }).catch(() => false);
  71  | 
  72  |   if (!hasProducts) {
  73  |     test.skip();
  74  |     return;
  75  |   }
  76  | 
  77  |   await viewDetailsBtn.click();
  78  |   await page.waitForLoadState('networkidle');
  79  | 
  80  |   // Model code should be in brand red
  81  |   await expect(page.locator('.text-brand-red').first()).toBeVisible({ timeout: 10000 });
  82  | 
  83  |   // Specifications tab
  84  |   const specsTab = page.getByRole('button', { name: 'Specifications' });
  85  |   await expect(specsTab).toBeVisible({ timeout: 10000 });
  86  |   await specsTab.click();
  87  | 
  88  |   // Downloads tab
  89  |   const downloadsTab = page.getByRole('button', { name: 'Downloads' });
  90  |   await expect(downloadsTab).toBeVisible({ timeout: 10000 });
  91  |   await downloadsTab.click();
  92  | });
  93  | 
  94  | // ─── 5. Contact form ──────────────────────────────────────────────────────────
  95  | 
  96  | test('/contact form: fill all fields, submit, success message shown', async ({ page }) => {
  97  |   // Mock the hCaptcha script so it doesn't load externally
  98  |   await page.route('**/js.hcaptcha.com/**', (route) => route.abort());
  99  | 
  100 |   // Mock the API route
  101 |   await page.route('**/api/contact', async (route) => {
  102 |     await route.fulfill({
  103 |       status: 200,
  104 |       contentType: 'application/json',
  105 |       body: JSON.stringify({ success: true }),
  106 |     });
  107 |   });
  108 | 
  109 |   await page.goto(`${BASE_URL}/contact`);
  110 | 
  111 |   // Inject a fake hCaptcha token into the component state by simulating
  112 |   // the captcha callback via window.hcaptcha mock
  113 |   await page.addInitScript(() => {
  114 |     // Stub hcaptcha so renderCaptcha() fires the callback immediately with a test token
  115 |     (window as any).hcaptcha = {
  116 |       render: (container: HTMLElement, opts: { callback: (t: string) => void }) => {
  117 |         // Fire callback immediately with a test token
  118 |         setTimeout(() => opts.callback('test-captcha-token'), 100);
  119 |         return 'widget-id-1';
  120 |       },
  121 |       reset: () => {},
  122 |     };
  123 |   });
  124 | 
  125 |   await page.reload();
  126 | 
  127 |   // Wait for captcha token to be set (100ms delay in mock)
  128 |   await page.waitForTimeout(500);
  129 | 
  130 |   // Fill form
  131 |   await page.fill('#name', 'Test User');
  132 |   await page.fill('#company', 'Test Company');
  133 |   await page.fill('#email', 'test@example.com');
  134 |   await page.fill('#phone', '+91 98765 43210');
  135 |   await page.selectOption('#enquiryType', 'General');
  136 |   await page.fill('#message', 'This is a test message from Playwright.');
  137 | 
  138 |   // Submit
  139 |   await page.click('button[type="submit"]');
  140 | 
  141 |   // Success message
> 142 |   await expect(page.locator('text=Message Sent')).toBeVisible({ timeout: 10000 });
      |                                                   ^ Error: expect(locator).toBeVisible() failed
  143 | });
  144 | 
  145 | // ─── 6. Joomla redirect patterns ─────────────────────────────────────────────
  146 | 
  147 | test('Joomla redirects: /index.php/products/... → /products/...', async ({ page }) => {
  148 |   await page.goto(
  149 |     `${BASE_URL}/index.php/products/enterprise-networking/switches`,
  150 |     { waitUntil: 'commit', timeout: 60000 }
  151 |   );
  152 |   await expect(page).toHaveURL(/.*\/products\/enterprise-networking\/switches/, { timeout: 15000 });
  153 |   expect(page.url()).not.toContain('/index.php');
  154 | });
  155 | 
  156 | test('Joomla redirect: /index.php/contact-us → /contact', async ({ page }) => {
  157 |   await page.goto(`${BASE_URL}/index.php/contact-us`, { waitUntil: 'commit', timeout: 60000 });
  158 |   await expect(page).toHaveURL(/.*\/contact/, { timeout: 15000 });
  159 |   expect(page.url()).not.toContain('/index.php');
  160 | });
  161 | 
  162 | test('Joomla redirect: /index.php/about-us → /about/about-us', async ({ page }) => {
  163 |   await page.goto(`${BASE_URL}/index.php/about-us`, { waitUntil: 'commit', timeout: 60000 });
  164 |   await expect(page).toHaveURL(/.*\/about\/about-us/, { timeout: 15000 });
  165 | });
  166 | 
  167 | test('Joomla redirect: /index.php/support/warranty-policy → /support/warranty-policy', async ({ page }) => {
  168 |   await page.goto(`${BASE_URL}/index.php/support/warranty-policy`, { waitUntil: 'commit', timeout: 60000 });
  169 |   await expect(page).toHaveURL(/.*\/support\/warranty-policy/, { timeout: 15000 });
  170 |   expect(page.url()).not.toContain('/index.php');
  171 | });
  172 | 
  173 | test('Joomla redirect: servers-and-storage → servers-storage', async ({ page }) => {
  174 |   await page.goto(
  175 |     `${BASE_URL}/products/servers-and-storage/surveillance-servers`,
  176 |     { waitUntil: 'commit' }
  177 |   );
  178 |   expect(page.url()).toContain('/products/servers-storage/surveillance-servers');
  179 | });
  180 | 
  181 | // ─── 7. Product registration page ────────────────────────────────────────────
  182 | 
  183 | test('/support/product-registration page exists and renders a form', async ({ page }) => {
  184 |   await page.goto(`${BASE_URL}/support/product-registration`);
  185 | 
  186 |   await expect(page.locator('h1')).toContainText('Product Registration');
  187 |   await expect(page.locator('form')).toBeVisible();
  188 |   await expect(page.locator('#name')).toBeVisible();
  189 |   await expect(page.locator('#email')).toBeVisible();
  190 |   await expect(page.locator('#productModel')).toBeVisible();
  191 |   await expect(page.locator('#serialNumber')).toBeVisible();
  192 | });
  193 | 
  194 | // ─── 8. Footer content ────────────────────────────────────────────────────────
  195 | 
  196 | test('Footer contains phone number and email', async ({ page }) => {
  197 |   await page.goto(BASE_URL);
  198 | 
  199 |   const footer = page.locator('footer');
  200 |   await expect(footer).toContainText('1800-1200-023');
  201 |   await expect(footer).toContainText('info@plexonics.com');
  202 | });
  203 | 
  204 | // ─── 9. No console errors ─────────────────────────────────────────────────────
  205 | 
  206 | async function checkNoConsoleErrors(page: Page, url: string) {
  207 |   const errors: string[] = [];
  208 |   page.on('console', (msg) => {
  209 |     if (msg.type() === 'error') {
  210 |       errors.push(msg.text());
  211 |     }
  212 |   });
  213 | 
  214 |   await page.goto(url);
  215 |   await page.waitForLoadState('networkidle');
  216 | 
  217 |   const criticalErrors = errors.filter(
  218 |     (e) =>
  219 |       !e.includes('favicon') &&
  220 |       !e.includes('analytics') &&
  221 |       !e.includes('gtag') &&
  222 |       !e.includes('hcaptcha') &&
  223 |       !e.includes('Failed to load resource: net::ERR_BLOCKED_BY_CLIENT') &&
  224 |       !e.includes('net::ERR_ABORTED')
  225 |   );
  226 | 
  227 |   expect(criticalErrors, `Console errors on ${url}: ${criticalErrors.join(', ')}`).toHaveLength(0);
  228 | }
  229 | 
  230 | test('No console errors on homepage', async ({ page }) => {
  231 |   await checkNoConsoleErrors(page, BASE_URL);
  232 | });
  233 | 
  234 | test('No console errors on /products', async ({ page }) => {
  235 |   await checkNoConsoleErrors(page, `${BASE_URL}/products`);
  236 | });
  237 | 
  238 | test('No console errors on /contact', async ({ page }) => {
  239 |   await checkNoConsoleErrors(page, `${BASE_URL}/contact`);
  240 | });
  241 | 
  242 | // ─── 10. Mobile hamburger menu ────────────────────────────────────────────────
```