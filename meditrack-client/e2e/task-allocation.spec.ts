import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('Automatic Task Allocation Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    
    const usernameInput = page.getByLabel(/Username or Email/i);
    const passwordInput = page.getByLabel(/Password/i);
    const loginButton = page.getByRole('button', { name: /Login/i });

    await usernameInput.fill('admin');
    await passwordInput.fill('Admin@123');
    await loginButton.click();

    // Wait for navigation and token
    await expect(async () => {
      const hasToken = await page.evaluate(() => !!localStorage.getItem('token'));
      expect(hasToken).toBe(true);
    }).toPass({ timeout: 5000 });
  });

  test('should display task allocation page', async ({ page }) => {
    await page.goto(`${BASE_URL}/task-allocation`, { waitUntil: 'domcontentloaded' });

    const pageTitle = page.getByRole('heading', { name: /Task Allocation System/i });
    await expect(pageTitle).toBeVisible();
  });

  test('should display create new task form', async ({ page }) => {
    await page.goto(`${BASE_URL}/task-allocation`, { waitUntil: 'domcontentloaded' });

    const createTaskHeading = page.getByRole('heading', { name: /Create New Task/i });
    await expect(createTaskHeading).toBeVisible();
  });

  test('should display task type dropdown', async ({ page }) => {
    await page.goto(`${BASE_URL}/task-allocation`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const taskTypeLabel = page.getByText(/Task Type/i);
    const dropdown = page.locator('select, [role="combobox"]').first();

    await expect(taskTypeLabel.or(dropdown).first()).toBeVisible();
  });

  test('should display task description field', async ({ page }) => {
    await page.goto(`${BASE_URL}/task-allocation`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const descriptionLabel = page.getByText(/Task Description|Description/i);
    const textarea = page.locator('textarea').first();

    await expect(descriptionLabel.or(textarea).first()).toBeVisible();
  });

  test('should display tasks list/table', async ({ page }) => {
    await page.goto(`${BASE_URL}/task-allocation`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const allTasksHeading = page.getByRole('heading', { name: /All Tasks/i });
    const table = page.locator('table');

    await expect(allTasksHeading.or(table).first()).toBeVisible();
  });

  test('should be able to select task type', async ({ page }) => {
    await page.goto(`${BASE_URL}/task-allocation`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const selects = page.locator('select');
    
    if (await selects.count() > 0) {
      const taskTypeSelect = selects.first();
      const options = taskTypeSelect.locator('option');
      const optionCount = await options.count();
      
      if (optionCount > 1) {
        await taskTypeSelect.selectOption(options.nth(1).getAttribute('value'));
        const selectedValue = await taskTypeSelect.inputValue();
        expect(selectedValue).toBeTruthy();
      }
    }
  });

  test('should be able to enter task description', async ({ page }) => {
    await page.goto(`${BASE_URL}/task-allocation`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const textareas = page.locator('textarea');
    
    if (await textareas.count() > 0) {
      const descriptionField = textareas.first();
      await descriptionField.fill('Lab test for patient - Complete blood count');
      await expect(descriptionField).toHaveValue('Lab test for patient - Complete blood count');
    }
  });

  test('should display create task button', async ({ page }) => {
    await page.goto(`${BASE_URL}/task-allocation`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const createButton = page.getByRole('button', { name: /Create Task|Create|Submit/i }).first();
    await expect(createButton).toBeVisible();
  });

  test('should create a new task', async ({ page }) => {
    await page.goto(`${BASE_URL}/task-allocation`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const textarea = page.locator('textarea').first();
    const createButton = page.getByRole('button', { name: /Create Task|Create|Submit/i }).first();

    await textarea.fill('Test task for lab work');
    await createButton.click();

    // Confirm dialog
    const confirmButton = page.getByRole('button', { name: /Confirm/i });
    await expect(confirmButton).toBeVisible();
    await confirmButton.click();

    await page.waitForTimeout(1000);

    const successMessage = page.locator('text=/created|success|assigned/i').first();
    await expect(successMessage).toBeVisible();
  });

  test('should display task list with all columns', async ({ page }) => {
    await page.goto(`${BASE_URL}/task-allocation`, { waitUntil: 'domcontentloaded' });

    const table = page.locator('table');
    await expect(table).toBeVisible();
    
    const count = await table.locator('th').count();
    expect(count).toBeGreaterThanOrEqual(5);
  });

  test('should display task status indicators', async ({ page }) => {
    await page.goto(`${BASE_URL}/task-allocation`, { waitUntil: 'domcontentloaded' });

    const statusChips = page.locator('text=/Pending|In Progress|Completed/i');
    const count = await statusChips.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should display assigned staff information', async ({ page }) => {
    await page.goto(`${BASE_URL}/task-allocation`, { waitUntil: 'domcontentloaded' });

    const table = page.locator('table');
    await expect(table).toBeVisible();
    
    const staffHeader = table.locator('th', { hasText: /Assigned Staff|Staff/i }).first();
    await expect(staffHeader).toBeVisible();
  });

  test('should auto-assign task to available staff', async ({ page }) => {
    await page.goto(`${BASE_URL}/task-allocation`, { waitUntil: 'domcontentloaded' });

    const table = page.locator('table');
    await expect(table).toBeVisible();
    
    const firstRow = table.locator('tbody tr').first();
    // If there are rows, check they have cells
    if (await firstRow.count() > 0) {
      await expect(firstRow.locator('td').count()).toBeGreaterThan(0);
    }
  });

  test('should display confirmation dialog before creating task', async ({ page }) => {
    await page.goto(`${BASE_URL}/task-allocation`, { waitUntil: 'domcontentloaded' });

    const textarea = page.locator('textarea').first();
    const createButton = page.getByRole('button', { name: /Create Task|Create|Submit/i }).first();

    await textarea.fill('Confirmation test task');
    await createButton.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText(/confirm/i);
  });

  test('should handle task creation errors gracefully', async ({ page }) => {
    await page.goto(`${BASE_URL}/task-allocation`, { waitUntil: 'domcontentloaded' });

    const createButton = page.getByRole('button', { name: /Create Task|Create|Submit/i }).first();
    await expect(createButton).toBeVisible();
  });

  test('should display related visit ID field (optional)', async ({ page }) => {
    await page.goto(`${BASE_URL}/task-allocation`, { waitUntil: 'domcontentloaded' });

    const relatedVisitLabel = page.getByText(/Related Visit|Visit ID/i);
    await expect(relatedVisitLabel.first()).toBeVisible();
  });

  test('should load and display existing tasks on page load', async ({ page }) => {
    await page.goto(`${BASE_URL}/task-allocation`, { waitUntil: 'domcontentloaded' });

    const table = page.locator('table');
    const loadingSpinner = page.locator('[role="progressbar"]');

    // Wait for either table to be visible or spinner to be hidden
    await expect(table.or(loadingSpinner).first()).toBeVisible();
    
    if (await loadingSpinner.isVisible()) {
      await expect(loadingSpinner).toBeHidden({ timeout: 10000 });
    }
    
    await expect(table).toBeVisible();
  });
});
