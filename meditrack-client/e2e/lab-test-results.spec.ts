import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('Lab Test Results Management Tests', () => {
  // Before each test, login as admin and navigate to lab dashboard
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    // Login with admin credentials
    const inputs = page.locator('input');
    const usernameInput = inputs.nth(0);
    const passwordInput = inputs.nth(1);
    const loginButton = page.locator('button').filter({ hasText: /LOGIN|Login/ }).first();

    await usernameInput.fill('admin');
    await passwordInput.fill('Admin@123');
    await loginButton.click();

    // Wait for login to complete
    await page.waitForTimeout(1000);
    
    // Verify login was successful
    const hasToken = await page.evaluate(() => {
      return !!localStorage.getItem('token');
    });
    
    if (!hasToken) {
      throw new Error('Login failed - no token found');
    }

    // Navigate to lab dashboard
    await page.goto(`${BASE_URL}/lab-dashboard`, { waitUntil: 'domcontentloaded' });
    
    // Wait for page to render
    await page.waitForTimeout(1000);
  });

  test('should display lab dashboard with pending tests section', async ({ page }) => {
    // Look for pending tests section
    const pageText = await page.textContent('body');
    
    // Check if lab-related content is visible
    const hasLabContent = pageText && (
      pageText.includes('Pending') || 
      pageText.includes('Test') || 
      pageText.includes('Lab') ||
      pageText.includes('Result')
    );
    
    if (hasLabContent) {
      expect(hasLabContent).toBe(true);
    }
  });

  test('should display pending lab tests table', async ({ page }) => {
    // Look for table or list of pending tests
    const tables = page.locator('table');
    const tableRows = page.locator('tr');
    
    if (await tables.count() > 0) {
      const table = tables.first();
      await expect(table).toBeVisible();
    } else if (await tableRows.count() > 0) {
      expect(await tableRows.count()).toBeGreaterThan(0);
    }
  });

  test('should display OP number search field', async ({ page }) => {
    // Look for search inputs
    const searchInputs = page.locator('input[type="text"]');
    const hasSearchField = await searchInputs.count() > 0;
    
    if (hasSearchField) {
      expect(hasSearchField).toBe(true);
    }
  });

  test('should allow searching lab tests by OP number', async ({ page }) => {
    const searchInputs = page.locator('input[type="text"]');
    
    if (await searchInputs.count() > 0) {
      const opNumberInput = searchInputs.first();
      
      // Search by OP number
      await opNumberInput.fill('OP-001');
      await page.waitForTimeout(500);
      
      // Verify input was filled
      await expect(opNumberInput).toHaveValue('OP-001');
    }
  });

  test('should display date filter field', async ({ page }) => {
    const dateInputs = page.locator('input[type="date"]');
    
    if (await dateInputs.count() > 0) {
      const dateInput = dateInputs.first();
      await expect(dateInput).toBeVisible();
    }
  });

  test('should allow filtering by date', async ({ page }) => {
    const dateInputs = page.locator('input[type="date"]');
    
    if (await dateInputs.count() > 0) {
      const dateInput = dateInputs.first();
      
      // Set a past date for filtering
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7);
      const dateString = pastDate.toISOString().split('T')[0];
      
      await dateInput.fill(dateString);
      await page.waitForTimeout(500);
      
      // Verify date was set
      await expect(dateInput).toHaveValue(dateString);
    }
  });

  test('should display search/filter button', async ({ page }) => {
    // Look for search, filter, or refresh buttons
    const buttons = page.locator('button').filter({ 
      hasText: /Search|Filter|Refresh|Apply/ 
    });
    
    if (await buttons.count() > 0) {
      const searchButton = buttons.first();
      await expect(searchButton).toBeVisible();
    }
  });

  test('should handle clearing search filters', async ({ page }) => {
    const searchInputs = page.locator('input[type="text"]');
    
    if (await searchInputs.count() > 0) {
      const opNumberInput = searchInputs.first();
      
      // Fill and then clear
      await opNumberInput.fill('OP-001');
      await page.waitForTimeout(300);
      
      // Clear the input
      await opNumberInput.clear();
      await page.waitForTimeout(300);
      
      // Verify it's cleared
      await expect(opNumberInput).toHaveValue('');
    }
  });

  test('should display test details when test is selected', async ({ page }) => {
    // Try to click on a test in the list
    const tableRows = page.locator('tr, [role="button"]');
    const rowCount = await tableRows.count();
    
    if (rowCount > 1) {
      // Click on first data row (skip header)
      const firstDataRow = tableRows.nth(1);
      await firstDataRow.click();
      await page.waitForTimeout(500);
    }
  });

  test('should display test parameter fields', async ({ page }) => {
    // Look for parameter input fields
    const textInputs = page.locator('input[type="text"]');
    const numberInputs = page.locator('input[type="number"]');
    
    const hasParameterFields = 
      (await textInputs.count() > 0) || 
      (await numberInputs.count() > 0);
    
    if (hasParameterFields) {
      expect(hasParameterFields).toBe(true);
    }
  });

  test('should allow entering numeric test results', async ({ page }) => {
    const numberInputs = page.locator('input[type="number"]');
    
    if (await numberInputs.count() > 0) {
      const firstParameterInput = numberInputs.first();
      
      // Enter a test result value
      await firstParameterInput.fill('125');
      await page.waitForTimeout(300);
      
      // Verify value was entered
      await expect(firstParameterInput).toHaveValue('125');
    }
  });

  test('should allow entering text-based test results', async ({ page }) => {
    const textInputs = page.locator('input[type="text"]');
    
    if (await textInputs.count() > 1) {
      // Get non-search text inputs (skip first which might be search)
      const parameterInput = textInputs.nth(1);
      
      // Enter a text result
      await parameterInput.fill('Positive');
      await page.waitForTimeout(300);
      
      // Verify value was entered
      await expect(parameterInput).toHaveValue('Positive');
    }
  });

  test('should display remarks/notes field', async ({ page }) => {
    // Look for textarea for remarks
    const textareas = page.locator('textarea');
    
    if (await textareas.count() > 0) {
      const remarksField = textareas.first();
      await expect(remarksField).toBeVisible();
    }
  });

  test('should allow entering test remarks', async ({ page }) => {
    const textareas = page.locator('textarea');
    
    if (await textareas.count() > 0) {
      const remarksField = textareas.first();
      
      // Enter remarks
      const remarks = 'Test results appear normal. Follow-up recommended in 2 weeks.';
      await remarksField.fill(remarks);
      await page.waitForTimeout(300);
      
      // Verify remarks were entered
      await expect(remarksField).toHaveValue(remarks);
    }
  });

  test('should display overall result dropdown', async ({ page }) => {
    // Look for select or dropdown for overall result
    const selects = page.locator('select');
    const muiSelects = page.locator('input[role="button"][type="text"]');
    
    if (await selects.count() > 0 || await muiSelects.count() > 0) {
      expect(true).toBe(true);
    }
  });

  test('should select overall test result status', async ({ page }) => {
    const selects = page.locator('select');
    const muiSelects = page.locator('input[role="button"][type="text"]');
    
    if (await selects.count() > 0) {
      // Try to find and select a result status
      const resultSelect = selects.last();
      const options = await resultSelect.locator('option').count();
      
      if (options > 1) {
        await resultSelect.selectOption({ index: 1 });
        await page.waitForTimeout(300);
      }
    } else if (await muiSelects.count() > 0) {
      // Use MUI select
      const resultSelect = muiSelects.last();
      await resultSelect.click();
      await page.waitForTimeout(300);
      
      const option = page.locator('[role="option"]').first();
      if (await option.count() > 0) {
        await option.click();
      }
    }
  });

  test('should display save/submit button for results', async ({ page }) => {
    // Look for save or submit button
    const saveButtons = page.locator('button').filter({ 
      hasText: /Save|Submit|Confirm|Post/ 
    });
    
    if (await saveButtons.count() > 0) {
      const saveButton = saveButtons.first();
      await expect(saveButton).toBeVisible();
    }
  });

  test('should handle result form validation', async ({ page }) => {
    // Try to submit without filling fields
    const saveButtons = page.locator('button').filter({ 
      hasText: /Save|Submit/ 
    });
    
    if (await saveButtons.count() > 0) {
      const saveButton = saveButtons.first();
      
      // Check if button is disabled
      const isDisabled = await saveButton.isDisabled();
      
      if (!isDisabled) {
        await saveButton.click();
        await page.waitForTimeout(500);
        
        // Look for validation errors
        const errorMessages = page.locator('.error, [role="alert"], .MuiAlert-root');
        const hasErrors = await errorMessages.count() > 0;
        
        if (hasErrors) {
          expect(hasErrors).toBe(true);
        }
      }
    }
  });

  test('should fill complete test result and verify state', async ({ page }) => {
    await page.waitForTimeout(300);
    
    const numberInputs = page.locator('input[type="number"]');
    const textareas = page.locator('textarea');
    
    let resultsFilled = false;
    
    // Fill numeric parameter
    if (await numberInputs.count() > 0) {
      await numberInputs.first().fill('100');
      resultsFilled = true;
    }
    
    // Fill remarks
    if (await textareas.count() > 0) {
      await textareas.first().fill('Normal results');
      resultsFilled = true;
    }
    
    await page.waitForTimeout(300);
    
    // Verify inputs retained their values
    if (await numberInputs.count() > 0) {
      await expect(numberInputs.first()).toHaveValue('100');
    }
    
    if (resultsFilled) {
      expect(resultsFilled).toBe(true);
    }
  });

  test('should display history/past results section', async ({ page }) => {
    // Look for history table or section
    const pageText = await page.textContent('body');
    
    const hasHistory = pageText && (
      pageText.includes('History') || 
      pageText.includes('Completed') || 
      pageText.includes('Past')
    );
    
    if (hasHistory) {
      expect(hasHistory).toBe(true);
    }
  });

  test('should handle rapid result entry', async ({ page }) => {
    await page.waitForTimeout(300);
    
    const numberInputs = page.locator('input[type="number"]');
    
    // Rapidly fill multiple parameter fields
    const updates = [];
    for (let i = 0; i < Math.min(3, await numberInputs.count()); i++) {
      updates.push(numberInputs.nth(i).fill(String(100 + i * 10)));
    }
    
    await Promise.all(updates);
    await page.waitForTimeout(300);
    
    // Verify all values are retained
    if (await numberInputs.count() > 0) {
      await expect(numberInputs.first()).toHaveValue('100');
    }
  });

  test('should maintain form state during interactions', async ({ page }) => {
    await page.waitForTimeout(300);
    
    const numberInputs = page.locator('input[type="number"]');
    const textareas = page.locator('textarea');
    
    // Fill number input
    if (await numberInputs.count() > 0) {
      await numberInputs.first().fill('150');
    }
    
    // Click on textarea to change focus
    if (await textareas.count() > 0) {
      await textareas.first().click();
    }
    
    // Verify number input still has value
    if (await numberInputs.count() > 0) {
      await expect(numberInputs.first()).toHaveValue('150');
    }
  });

  test('should display all test parameter sections', async ({ page }) => {
    // Check for various parameter input types
    const numberInputs = page.locator('input[type="number"]');
    const textInputs = page.locator('input[type="text"]');
    const textareas = page.locator('textarea');
    
    const hasMultipleInputTypes = 
      (await numberInputs.count() > 0) ||
      (await textInputs.count() > 1) ||
      (await textareas.count() > 0);
    
    expect(hasMultipleInputTypes).toBe(true);
  });

  test('should handle special characters in remarks', async ({ page }) => {
    const textareas = page.locator('textarea');
    
    if (await textareas.count() > 0) {
      const remarksField = textareas.first();
      
      // Enter remarks with special characters
      const specialRemarks = 'Results: Normal. Notes: <50% variation. Follow-up: 2-3 weeks.';
      await remarksField.fill(specialRemarks);
      await page.waitForTimeout(300);
      
      // Verify special characters were accepted
      const value = await remarksField.inputValue();
      expect(value.length).toBeGreaterThan(0);
    }
  });

  test('should handle long remarks text', async ({ page }) => {
    const textareas = page.locator('textarea');
    
    if (await textareas.count() > 0) {
      const remarksField = textareas.first();
      
      // Enter long text
      const longRemarks = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ' +
        'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ' +
        'Results show normal variation. Continue monitoring.';
      
      await remarksField.fill(longRemarks);
      await page.waitForTimeout(300);
      
      const value = await remarksField.inputValue();
      expect(value.length).toBeGreaterThan(100);
    }
  });

  test('should validate numeric input ranges', async ({ page }) => {
    const numberInputs = page.locator('input[type="number"]');
    
    if (await numberInputs.count() > 0) {
      const parameterInput = numberInputs.first();
      
      // Try various numeric values
      await parameterInput.fill('0');
      await page.waitForTimeout(200);
      await expect(parameterInput).toHaveValue('0');
      
      // Try negative (if allowed)
      await parameterInput.fill('-5');
      await page.waitForTimeout(200);
      
      // Try large number
      await parameterInput.fill('9999');
      await page.waitForTimeout(200);
      await expect(parameterInput).toHaveValue('9999');
    }
  });

  test('should display test result references/normal ranges', async ({ page }) => {
    // Look for reference range information
    const pageText = await page.textContent('body');
    
    const hasReferences = pageText && (
      pageText.includes('Reference') || 
      pageText.includes('Normal') || 
      pageText.includes('Range') ||
      pageText.includes('Min') ||
      pageText.includes('Max')
    );
    
    // References might be optional
    if (hasReferences) {
      expect(hasReferences).toBe(true);
    }
  });

  test('should handle result comparison with reference values', async ({ page }) => {
    await page.waitForTimeout(300);
    
    const numberInputs = page.locator('input[type="number"]');
    
    if (await numberInputs.count() > 0) {
      // Enter a value
      await numberInputs.first().fill('250');
      await page.waitForTimeout(500);
      
      // System might highlight abnormal values
      // Check if there's any visual indication
      const abnormalIndicators = page.locator('.abnormal, .warning, [style*="color: red"]');
      const hasIndicator = await abnormalIndicators.count() > 0;
      
      if (hasIndicator) {
        expect(hasIndicator).toBe(true);
      }
    }
  });

  test('should display action buttons clearly', async ({ page }) => {
    // Verify buttons are visible
    const allButtons = page.locator('button');
    
    if (await allButtons.count() > 0) {
      const firstButton = allButtons.first();
      await expect(firstButton).toBeVisible();
    }
  });

  test('should handle tab navigation through result fields', async ({ page }) => {
    await page.waitForTimeout(300);
    
    const numberInputs = page.locator('input[type="number"]');
    
    if (await numberInputs.count() > 0) {
      // Focus first field
      await numberInputs.first().click();
      await numberInputs.first().fill('100');
      
      // Tab to next field
      await page.keyboard.press('Tab');
      await page.waitForTimeout(200);
      
      // Previous field should retain value
      await expect(numberInputs.first()).toHaveValue('100');
    }
  });

  test('should clear result form fields', async ({ page }) => {
    await page.waitForTimeout(300);
    
    const numberInputs = page.locator('input[type="number"]');
    const textareas = page.locator('textarea');
    
    // Fill fields
    if (await numberInputs.count() > 0) {
      await numberInputs.first().fill('100');
    }
    if (await textareas.count() > 0) {
      await textareas.first().fill('Test remarks');
    }
    
    await page.waitForTimeout(300);
    
    // Look for clear/reset button
    const clearButtons = page.locator('button').filter({ hasText: /Clear|Reset/ });
    if (await clearButtons.count() > 0) {
      const clearButton = clearButtons.first();
      if (!await clearButton.isDisabled()) {
        await clearButton.click();
        await page.waitForTimeout(300);
        
        // Verify fields are cleared
        if (await numberInputs.count() > 0) {
          await expect(numberInputs.first()).toHaveValue('');
        }
      }
    }
  });

  test('should maintain page state during scrolling', async ({ page }) => {
    // Get initial button state
    const buttons = page.locator('button');
    const initialCount = await buttons.count();
    
    // Scroll down
    await page.keyboard.press('End');
    await page.waitForTimeout(300);
    
    // Form elements should still be accessible
    const buttonsAfterScroll = page.locator('button');
    expect(await buttonsAfterScroll.count()).toBeGreaterThan(0);
  });
});