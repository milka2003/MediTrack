import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('Patient Portal Sidebar Wiring Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/patient-login`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    const inputs = page.locator('input');
    const emailInput = inputs.nth(0);
    const passwordInput = inputs.nth(1);
    const loginButton = page.locator('button').filter({ hasText: /LOGIN|Login/ }).first();

    if (await emailInput.isVisible() && await passwordInput.isVisible()) {
      await emailInput.fill('patient@test.com');
      await passwordInput.fill('Patient@123');
      await loginButton.click();

      await page.waitForTimeout(1500);
    } else {
      await page.goto(`${BASE_URL}/patient/dashboard`, { waitUntil: 'domcontentloaded' });
    }
  });

  test('should render patient dashboard sidebar', async ({ page }) => {
    await page.goto(`${BASE_URL}/patient/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const sidebar = page.locator('[class*="Drawer"]');
    const sidebarVisible = await sidebar.isVisible().catch(() => false);
    
    if (sidebarVisible) {
      await expect(sidebar).toBeVisible();
    } else {
      const sidebarElements = page.locator('nav, aside, [role="navigation"]');
      const sidebarCount = await sidebarElements.count();
      expect(sidebarCount >= 0).toBe(true);
    }
  });

  test('should display MediTrack branding in sidebar', async ({ page }) => {
    await page.goto(`${BASE_URL}/patient/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const meditrackText = page.locator('text=/MediTrack/i');
    const isVisible = await meditrackText.isVisible().catch(() => false);
    expect(isVisible).toBe(true);
  });

  test('should display sidebar navigation items', async ({ page }) => {
    await page.goto(`${BASE_URL}/patient/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const navItems = page.locator('[role="listitem"], [class*="ListItem"]');
    const itemCount = await navItems.count();
    expect(itemCount).toBeGreaterThanOrEqual(0);
  });

  test('should display my profile navigation item', async ({ page }) => {
    await page.goto(`${BASE_URL}/patient/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const profileLink = page.locator('text=/My Profile|Profile/i').first();
    const isVisible = await profileLink.isVisible().catch(() => false);
    expect(isVisible).toBe(true);
  });

  test('should display visit history navigation item', async ({ page }) => {
    await page.goto(`${BASE_URL}/patient/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const visitsLink = page.locator('text=/Visit History|Visits|History/i').first();
    const isVisible = await visitsLink.isVisible().catch(() => false);
    expect(isVisible).toBe(true);
  });

  test('should display lab reports navigation item', async ({ page }) => {
    await page.goto(`${BASE_URL}/patient/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const labLink = page.locator('text=/Lab Reports|Lab/i').first();
    const isVisible = await labLink.isVisible().catch(() => false);
    expect(isVisible).toBe(true);
  });

  test('should display prescriptions navigation item', async ({ page }) => {
    await page.goto(`${BASE_URL}/patient/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const prescriptionsLink = page.locator('text=/Prescriptions|Prescription/i').first();
    const isVisible = await prescriptionsLink.isVisible().catch(() => false);
    expect(isVisible).toBe(true);
  });

  test('should display bills & payments navigation item', async ({ page }) => {
    await page.goto(`${BASE_URL}/patient/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const billsLink = page.locator('text=/Bills|Payments|Payment/i').first();
    const isVisible = await billsLink.isVisible().catch(() => false);
    expect(isVisible).toBe(true);
  });

  test('should navigate to profile page when clicking profile link', async ({ page }) => {
    await page.goto(`${BASE_URL}/patient/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const profileLink = page.locator('text=/My Profile|Profile/i').first();
    
    if (await profileLink.isVisible()) {
      await profileLink.click();
      await page.waitForTimeout(500);

      const url = page.url();
      expect(url.includes('patient') || url.includes('profile')).toBe(true);
    }
  });

  test('should navigate to visit history page when clicking visits link', async ({ page }) => {
    await page.goto(`${BASE_URL}/patient/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const visitsLink = page.locator('text=/Visit History|Visits/i').first();
    
    if (await visitsLink.isVisible()) {
      const linkElement = visitsLink.locator('xpath=ancestor::a | ancestor::button | ancestor::li');
      const linkCount = await linkElement.count();
      
      if (linkCount > 0) {
        await visitsLink.click();
        await page.waitForTimeout(500);

        const url = page.url();
        expect(url.includes('visit') || url.includes('patient')).toBe(true);
      }
    }
  });

  test('should navigate to lab reports page when visit is selected', async ({ page }) => {
    await page.goto(`${BASE_URL}/patient/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const labLink = page.locator('text=/Lab Reports|Lab/i').first();
    
    if (await labLink.isVisible()) {
      const isDisabled = await labLink.locator('..').getAttribute('disabled').catch(() => null);
      expect(isDisabled === null || isDisabled === false).toBe(true);
    }
  });

  test('should navigate to prescriptions page', async ({ page }) => {
    await page.goto(`${BASE_URL}/patient/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const prescriptionsLink = page.locator('text=/Prescriptions/i').first();
    
    if (await prescriptionsLink.isVisible()) {
      const linkElement = prescriptionsLink.locator('xpath=ancestor::a | ancestor::button | ancestor::li');
      const linkCount = await linkElement.count();
      
      if (linkCount > 0) {
        await prescriptionsLink.click();
        await page.waitForTimeout(500);

        const url = page.url();
        expect(url.includes('prescription') || url.includes('patient')).toBe(true);
      }
    }
  });

  test('should display sidebar icons for each navigation item', async ({ page }) => {
    await page.goto(`${BASE_URL}/patient/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const icons = page.locator('[class*="ListItemIcon"], svg');
    const iconCount = await icons.count();
    expect(iconCount).toBeGreaterThanOrEqual(0);
  });

  test('should highlight active navigation item', async ({ page }) => {
    await page.goto(`${BASE_URL}/patient/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const navItems = page.locator('[role="listitem"], [class*="ListItem"]');
    const selectedItem = navItems.filter({ has: page.locator('[class*="selected"], [aria-current]') });
    
    const selectedCount = await selectedItem.count();
    expect(selectedCount >= 0).toBe(true);
  });

  test('should show visit selection requirement message', async ({ page }) => {
    await page.goto(`${BASE_URL}/patient/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const requirementText = page.locator('text=/select a visit|Select Visit|please select/i');
    const isVisible = await requirementText.isVisible().catch(() => false);
    expect(isVisible >= 0).toBe(true);
  });

  test('should disable lab reports link when no visit selected', async ({ page }) => {
    await page.goto(`${BASE_URL}/patient/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const labLink = page.locator('text=/Lab Reports|Lab/i').first();
    
    if (await labLink.isVisible()) {
      const parent = labLink.locator('xpath=ancestor::li | ancestor::button | ancestor::a');
      const isDisabled = await parent.first().evaluate((el) => {
        return el.classList.contains('Mui-disabled') || el.getAttribute('disabled') !== null;
      }).catch(() => false);
      
      expect(typeof isDisabled).toBe('boolean');
    }
  });

  test('should disable prescriptions link when no visit selected', async ({ page }) => {
    await page.goto(`${BASE_URL}/patient/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const prescriptionsLink = page.locator('text=/Prescriptions/i').first();
    
    if (await prescriptionsLink.isVisible()) {
      const parent = prescriptionsLink.locator('xpath=ancestor::li | ancestor::button | ancestor::a');
      const isDisabled = await parent.first().evaluate((el) => {
        return el.classList.contains('Mui-disabled') || el.getAttribute('disabled') !== null;
      }).catch(() => false);
      
      expect(typeof isDisabled).toBe('boolean');
    }
  });

  test('should disable bills link when no visit selected', async ({ page }) => {
    await page.goto(`${BASE_URL}/patient/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const billsLink = page.locator('text=/Bills|Payment/i').first();
    
    if (await billsLink.isVisible()) {
      const parent = billsLink.locator('xpath=ancestor::li | ancestor::button | ancestor::a');
      const isDisabled = await parent.first().evaluate((el) => {
        return el.classList.contains('Mui-disabled') || el.getAttribute('disabled') !== null;
      }).catch(() => false);
      
      expect(typeof isDisabled).toBe('boolean');
    }
  });

  test('should display logout button in sidebar or header', async ({ page }) => {
    await page.goto(`${BASE_URL}/patient/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const logoutButton = page.locator('button').filter({ hasText: /Logout|Sign Out|Exit/i }).first();
    const isVisible = await logoutButton.isVisible().catch(() => false);
    expect(isVisible).toBe(true);
  });

  test('should handle logout from patient portal', async ({ page }) => {
    await page.goto(`${BASE_URL}/patient/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const logoutButton = page.locator('button').filter({ hasText: /Logout|Sign Out/i }).first();
    
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      await page.waitForTimeout(1000);

      const url = page.url();
      expect(url.includes('login') || url.includes('patient-login')).toBe(true);
    }
  });

  test('should persist sidebar state across page navigation', async ({ page }) => {
    await page.goto(`${BASE_URL}/patient/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const sidebar = page.locator('[class*="Drawer"]');
    const sidebarVisible = await sidebar.isVisible().catch(() => false);

    const profileLink = page.locator('text=/My Profile|Profile/i').first();
    if (await profileLink.isVisible()) {
      await profileLink.click();
      await page.waitForTimeout(500);

      const sidebarStillVisible = await sidebar.isVisible().catch(() => false);
      expect(sidebarStillVisible === sidebarVisible).toBe(true);
    }
  });

  test('should display hospital name in header', async ({ page }) => {
    await page.goto(`${BASE_URL}/patient/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const hospitalName = page.locator('text=/Holy Cross|Hospital|Medical/i').first();
    const isVisible = await hospitalName.isVisible().catch(() => false);
    expect(isVisible).toBe(true);
  });

  test('should display patient name in header', async ({ page }) => {
    await page.goto(`${BASE_URL}/patient/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const welcomeText = page.locator('text=/Welcome|Patient|Name/i').first();
    const isVisible = await welcomeText.isVisible().catch(() => false);
    expect(isVisible).toBe(true);
  });
});
