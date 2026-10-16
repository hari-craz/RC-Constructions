import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('Phase 7D — Contact Section and Formspree Integration', () => {
  test('renders Contact section with headline, ruled channels, form fields, and footer', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForTimeout(1000);

    const contact = page.locator('#contact');
    await contact.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);

    // Verify headline and subhead
    await expect(page.locator('#contact-heading')).toBeVisible();
    await expect(page.locator('#contact-heading')).toHaveText(/tell us what you want to build/i);

    // Verify ruled channels
    const channels = contact.locator('.contact-channel-item');
    await expect(channels).toHaveCount(5);

    // Verify phone, email, WhatsApp links
    const phoneLink = contact.locator('a[href^="tel:"]');
    await expect(phoneLink).toBeVisible();
    const waLink = contact.locator('a[href^="https://wa.me/"]');
    await expect(waLink).toBeVisible();
    const emailLink = contact.locator('a[href^="mailto:"]');
    await expect(emailLink).toBeVisible();

    // Verify required form fields with labels
    const nameInput = contact.locator('input[name="name"]');
    await expect(nameInput).toBeVisible();
    await expect(nameInput).toHaveAttribute('required', '');

    const phoneInput = contact.locator('input[name="phone"]');
    await expect(phoneInput).toBeVisible();
    await expect(phoneInput).toHaveAttribute('type', 'tel');

    const projectTypeSelect = contact.locator('select[name="projectType"]');
    await expect(projectTypeSelect).toBeVisible();

    const messageTextarea = contact.locator('textarea[name="message"]');
    await expect(messageTextarea).toBeVisible();

    // Verify amber send enquiry button
    const submitBtn = contact.locator('.contact-submit-btn');
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toHaveText(/send enquiry/i);

    // Verify minimal footer
    const footer = contact.locator('.contact-footer');
    await expect(footer).toBeVisible();
    await expect(footer).toContainText('Built by UnitaryX');
    await expect(footer).toContainText('RC Constructions');

    const backToTop = footer.locator('a[href="#hero"]');
    await expect(backToTop).toBeVisible();

    expect(consoleErrors).toEqual([]);
  });

  test('submits successfully via mocked Formspree endpoint and focuses status confirmation', async ({
    page,
  }) => {
    let requestCount = 0;
    const submittedPayload: Record<string, string> = {};

    // Mock Formspree endpoint (NEVER call real endpoint in tests)
    await page.route('**/formspree.io/**', async (route) => {
      requestCount++;
      const postData = route.request().postData();
      if (postData) {
        // Parse multipart or URL-encoded form data
        const params = new URLSearchParams(postData);
        params.forEach((value, key) => {
          submittedPayload[key] = value;
        });
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, next: '/thanks' }),
      });
    });

    await page.goto('/#contact');
    await page.waitForTimeout(800);

    const contact = page.locator('#contact');
    await contact.locator('input[name="name"]').fill('Radha Construction Ltd');
    await contact.locator('input[name="phone"]').fill('+91 44 2847 1111');
    await contact.locator('input[name="email"]').fill('tender@radha.example.com');
    await contact.locator('select[name="projectType"]').selectOption('Commercial');
    await contact.locator('input[name="location"]').fill('Chennai Industrial Zone');
    await contact
      .locator('textarea[name="message"]')
      .fill('We request a proposal for a 4-storey commercial frame structure.');

    await contact.locator('.contact-submit-btn').click();

    // Verify success state confirmation
    const successRegion = contact.locator('[role="status"]');
    await expect(successRegion).toBeVisible();
    await expect(successRegion).toContainText(/enquiry delivered/i);

    // Verify focus moved to status region
    await expect(successRegion).toBeFocused();

    // Verify single request sent
    expect(requestCount).toBe(1);
    expect(submittedPayload).toBeDefined();
  });

  test('handles Formspree server error gracefully by preserving entered values and showing fallback', async ({
    page,
  }) => {
    // Mock Formspree error
    await page.route('**/formspree.io/**', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    await page.goto('/#contact');
    await page.waitForTimeout(800);

    const contact = page.locator('#contact');
    const enteredName = 'Muthu Enterprises';
    const enteredPhone = '+91 98400 99999';
    const enteredMsg = 'Structural concrete frame tender enquiry for warehouse unit.';

    await contact.locator('input[name="name"]').fill(enteredName);
    await contact.locator('input[name="phone"]').fill(enteredPhone);
    await contact.locator('textarea[name="message"]').fill(enteredMsg);

    await contact.locator('.contact-submit-btn').click();

    // Verify error banner is shown with fallback phone & email
    const errorBanner = contact.locator('.contact-status-error');
    await expect(errorBanner).toBeVisible();
    await expect(errorBanner).toContainText('+91 (0) 44 2847 0000');
    await expect(errorBanner).toContainText('build@rcconstructions.com');

    // Values must be preserved in form fields
    await expect(contact.locator('input[name="name"]')).toHaveValue(enteredName);
    await expect(contact.locator('input[name="phone"]')).toHaveValue(enteredPhone);
    await expect(contact.locator('textarea[name="message"]')).toHaveValue(enteredMsg);
  });

  test('validates required fields, moves focus to first invalid field, and announces errors', async ({
    page,
  }) => {
    await page.goto('/#contact');
    await page.waitForTimeout(800);

    const contact = page.locator('#contact');
    const nameInput = contact.locator('input[name="name"]');

    // Attempt submit with empty fields
    await contact.locator('.contact-submit-btn').click();

    // Focus must move to first invalid field (name)
    await expect(nameInput).toBeFocused();

    // Field error message visible and linked
    const nameError = contact.locator('#contact-name-error, [id$="-error"]').first();
    await expect(nameError).toBeVisible();

    // Fill valid name, trigger phone error
    await nameInput.fill('Valid Name');
    await contact.locator('.contact-submit-btn').click();

    const phoneInput = contact.locator('input[name="phone"]');
    await expect(phoneInput).toBeFocused();
  });

  test('drops bot submission without network call when honeypot is filled', async ({ page }) => {
    let networkCalled = false;
    await page.route('**/formspree.io/**', async (route) => {
      networkCalled = true;
      await route.fulfill({ status: 200, body: '{}' });
    });

    await page.goto('/#contact');
    await page.waitForTimeout(800);

    const contact = page.locator('#contact');
    await contact.locator('input[name="name"]').fill('Spam Bot');
    await contact.locator('input[name="phone"]').fill('123456789');
    await contact.locator('textarea[name="message"]').fill('Spam message body over 10 chars');

    // Fill hidden honeypot field
    await contact.locator('input[name="_gotcha"]').fill('I am a bot');
    await contact.locator('.contact-submit-btn').click();

    // No network request sent to Formspree
    expect(networkCalled).toBe(false);
  });

  test('guards against double submit and rapid double-clicking', async ({ page }) => {
    let requestCount = 0;
    await page.route('**/formspree.io/**', async (route) => {
      requestCount++;
      await new Promise((resolve) => setTimeout(resolve, 100));
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    });

    await page.goto('/#contact');
    await page.waitForTimeout(800);

    const contact = page.locator('#contact');
    await contact.locator('input[name="name"]').fill('Client Double Click');
    await contact.locator('input[name="phone"]').fill('+91 44 2847 0000');
    await contact.locator('textarea[name="message"]').fill('Valid description of 4-storey build.');

    const btn = contact.locator('.contact-submit-btn');
    await btn.dblclick();

    await page.waitForTimeout(500);
    expect(requestCount).toBe(1);
  });

  test('supports full keyboard-only form completion', async ({ page }) => {
    await page.route('**/formspree.io/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    });

    await page.goto('/#contact');
    await page.waitForTimeout(800);

    const contact = page.locator('#contact');
    const nameInput = contact.locator('input[name="name"]');
    await nameInput.focus();

    await page.keyboard.type('Keyboard Navigator');
    await page.keyboard.press('Tab'); // to phone
    await page.keyboard.type('+91 44 2847 0000');
    await page.keyboard.press('Tab'); // to email
    await page.keyboard.press('Tab'); // to projectType
    await page.keyboard.press('Tab'); // to location
    await page.keyboard.press('Tab'); // to message
    await page.keyboard.type('Full keyboard navigation verification description.');
    // The privacy link sits before the button; Safari-family browsers skip links when tabbing
    const submit = contact.locator('.contact-submit-btn');
    for (let i = 0; i < 3 && !(await submit.evaluate((el) => el === document.activeElement)); i++) {
      await page.keyboard.press('Tab');
    }
    await page.keyboard.press('Enter');

    const successRegion = contact.locator('[role="status"]');
    await expect(successRegion).toBeVisible();
  });

  test('passes axe accessibility audit across idle, error, and success states', async ({
    page,
  }) => {
    await page.route('**/formspree.io/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    });

    await page.goto('/#contact');
    await page.waitForTimeout(1000);

    // 1. Idle state
    const idleAxe = await new AxeBuilder({ page }).analyze();
    expect(idleAxe.violations).toEqual([]);

    // 2. Error state (trigger invalid submit)
    const contact = page.locator('#contact');
    await contact.locator('.contact-submit-btn').click();
    await page.waitForTimeout(200);

    const errorAxe = await new AxeBuilder({ page }).analyze();
    expect(errorAxe.violations).toEqual([]);

    // 3. Success state
    await contact.locator('input[name="name"]').fill('Valid User');
    await contact.locator('input[name="phone"]').fill('+91 44 2847 0000');
    await contact.locator('textarea[name="message"]').fill('Valid construction scope description.');
    await contact.locator('.contact-submit-btn').click();
    await page.waitForTimeout(300);

    const successAxe = await new AxeBuilder({ page }).analyze();
    expect(successAxe.violations).toEqual([]);
  });

  test('maintains minimum 44px touch targets on interactive controls', async ({ page }) => {
    await page.goto('/#contact');
    await page.waitForTimeout(800);

    const contact = page.locator('#contact');
    const interactive = contact.locator('input:not([tabindex="-1"]), select, textarea, button, a');
    const count = await interactive.count();

    for (let i = 0; i < count; i++) {
      const el = interactive.nth(i);
      const isVisible = await el.isVisible();
      if (!isVisible) continue;

      const box = await el.boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });
});
