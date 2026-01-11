import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe.configure({ timeout: 60000 });

test.describe('Admin Dashboard Quick Tests', () => {
  test.beforeEach(async ({ page }) => {
    try {
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'load', timeout: 15000 });

      const inputs = page.locator('input');
      const usernameInput = inputs.nth(0);
      const passwordInput = inputs.nth(1);
      const loginButton = page.locator('button').filter({ hasText: /LOGIN|Login/ }).first();

      await usernameInput.fill('admin');
      await passwordInput.fill('Admin@123');
      await loginButton.click();

      await page.waitForNavigation({ timeout: 10000 }).catch(() => {});
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'load', timeout: 15000 });
    } catch (error) {
      console.error('Setup failed:', error.message);
      throw new Error(`Cannot connect to ${BASE_URL}. Ensure backend and frontend are running: npm run start && npm run client`);
    }
  });

  test('admin dashboard displays correctly', async ({ page }) => {
    const heading = page.locator('h6:has-text("MediTrack")');
    await expect(heading).toBeVisible({ timeout: 5000 });
    
    const hospitalName = page.locator('h6:has-text("Holy Cross Hospital")');
    await expect(hospitalName).toBeVisible({ timeout: 5000 });
  });

  test('sidebar displays all navigation items', async ({ page }) => {
    const addStaff = page.locator('a:has-text("Add Staff")');
    const manageStaff = page.locator('a:has-text("Manage Staff")');
    const departments = page.locator('a:has-text("Departments")');

    await expect(addStaff).toBeVisible({ timeout: 5000 });
    await expect(manageStaff).toBeVisible({ timeout: 5000 });
    await expect(departments).toBeVisible({ timeout: 5000 });
  });

  test('logout button works', async ({ page }) => {
    const logoutButton = page.locator('button:has-text("Logout")');
    await logoutButton.click({ timeout: 3000 });

    await page.waitForURL(`${BASE_URL}/login`, { timeout: 5000 });
    expect(page.url()).toContain('/login');
  });

  test('navigate to add staff page', async ({ page }) => {
    const addStaffLink = page.locator('a:has-text("Add Staff")');
    await addStaffLink.click({ timeout: 3000 });

    await page.waitForURL(/add-staff/, { timeout: 5000 });
    expect(page.url()).toContain('add-staff');
  });

  test('navigate to manage staff page', async ({ page }) => {
    const manageStaffLink = page.locator('a:has-text("Manage Staff")');
    await manageStaffLink.click({ timeout: 3000 });

    await page.waitForURL(/staff/, { timeout: 5000 });
    expect(page.url()).toContain('staff');
  });

  test('navigate to departments page', async ({ page }) => {
    const deptLink = page.locator('a:has-text("Departments")');
    await deptLink.click({ timeout: 3000 });

    await page.waitForURL(/departments/, { timeout: 5000 });
    expect(page.url()).toContain('departments');
  });

  test('displays hospital name', async ({ page }) => {
    const hospitalName = page.locator(':text("Holy Cross Hospital")');
    await expect(hospitalName).toBeVisible({ timeout: 3000 });
  });

  test('user stays logged in after navigation', async ({ page }) => {
    const token1 = await page.evaluate(() => localStorage.getItem('token'));
    expect(token1).toBeTruthy();

    const link = page.locator('a:has-text("Add Staff")');
    await link.click({ timeout: 3000 });

    const token2 = await page.evaluate(() => localStorage.getItem('token'));
    expect(token2).toBe(token1);
  });
});
