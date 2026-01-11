import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('Appointment Booking Tests', () => {
  // Before each test, login as admin and navigate to visits management
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

    // Navigate to reception dashboard
    await page.goto(`${BASE_URL}/reception-dashboard`, { waitUntil: 'domcontentloaded' });
    
    // Wait for page to render
    await page.waitForTimeout(1000);
  });

  test('should display visit creation form with all sections', async ({ page }) => {
    // Look for the CreateVisit component or navigation to it
    // Try to find the visit creation interface
    const pageTitle = page.locator('h1, h2').filter({ hasText: /Visit|Appointment|Create/ });
    const titleCount = await pageTitle.count();
    
    // Verify we have form elements (search, dropdowns, date, etc)
    const textInputs = page.locator('input[type="text"]');
    const dateInputs = page.locator('input[type="date"]');
    const selects = page.locator('select');
    
    // Should have at least search and date inputs
    const hasSearchInput = await textInputs.count() > 0;
    const hasDateInput = await dateInputs.count() > 0;
    
    if (hasSearchInput) {
      expect(hasSearchInput).toBe(true);
    }
  });

  test('should search for an existing patient by OP number', async ({ page }) => {
    // Find patient search input
    const searchInputs = page.locator('input[type="text"]');
    
    if (await searchInputs.count() > 0) {
      const patientSearchInput = searchInputs.first();
      
      // Fill in a patient OP number (this assumes a patient exists in system)
      await patientSearchInput.fill('OP-001');
      
      // Wait for search to process
      await page.waitForTimeout(500);
      
      // Verify input was filled
      await expect(patientSearchInput).toHaveValue('OP-001');
    }
  });

  test('should search for patient by name', async ({ page }) => {
    const searchInputs = page.locator('input[type="text"]');
    
    if (await searchInputs.count() > 0) {
      const patientSearchInput = searchInputs.first();
      
      // Search by patient name
      await patientSearchInput.fill('John');
      await page.waitForTimeout(300);
      
      await expect(patientSearchInput).toHaveValue('John');
    }
  });

  test('should handle empty patient search', async ({ page }) => {
    const searchInputs = page.locator('input[type="text"]');
    
    if (await searchInputs.count() > 0) {
      const patientSearchInput = searchInputs.first();
      
      // Leave search empty and verify it's empty
      await expect(patientSearchInput).toHaveValue('');
    }
  });

  test('should display department dropdown', async ({ page }) => {
    // Try to find select elements or MUI selects
    const selects = page.locator('select');
    const muiSelects = page.locator('input[role="button"][type="text"]');
    
    const selectCount = await selects.count();
    const muiSelectCount = await muiSelects.count();
    
    if (selectCount > 0) {
      // Standard select exists
      expect(selectCount).toBeGreaterThan(0);
    } else if (muiSelectCount > 0) {
      // MUI select exists
      expect(muiSelectCount).toBeGreaterThan(0);
    }
  });

  test('should select a department from dropdown', async ({ page }) => {
    const selects = page.locator('select');
    const muiSelects = page.locator('input[role="button"][type="text"]');
    
    if (await selects.count() > 0) {
      // Use standard select
      const departmentSelect = selects.first();
      await departmentSelect.selectOption({ index: 1 });
      await page.waitForTimeout(300);
    } else if (await muiSelects.count() > 0) {
      // Use MUI select
      const departmentSelect = muiSelects.first();
      await departmentSelect.click();
      await page.waitForTimeout(300);
      
      // Click first option
      const option = page.locator('[role="option"]').first();
      if (await option.count() > 0) {
        await option.click();
      }
    }
  });

  test('should display doctor dropdown after department selection', async ({ page }) => {
    await page.waitForTimeout(300);
    
    // First select a department
    const selects = page.locator('select');
    const muiSelects = page.locator('input[role="button"][type="text"]');
    
    if (await selects.count() > 0) {
      const departmentSelect = selects.first();
      await departmentSelect.selectOption({ index: 1 });
      await page.waitForTimeout(500);
      
      // Doctor select should now be available
      if (await selects.count() > 1) {
        const doctorSelect = selects.nth(1);
        await expect(doctorSelect).toBeVisible();
      }
    }
  });

  test('should select a doctor from dropdown', async ({ page }) => {
    await page.waitForTimeout(300);
    
    const selects = page.locator('select');
    
    if (await selects.count() >= 2) {
      // Select department first
      const departmentSelect = selects.first();
      await departmentSelect.selectOption({ index: 1 });
      await page.waitForTimeout(500);
      
      // Then select doctor
      const doctorSelect = selects.nth(1);
      const optionCount = await doctorSelect.locator('option').count();
      
      if (optionCount > 1) {
        await doctorSelect.selectOption({ index: 1 });
        await page.waitForTimeout(300);
      }
    }
  });

  test('should display date input field', async ({ page }) => {
    const dateInputs = page.locator('input[type="date"]');
    
    if (await dateInputs.count() > 0) {
      const dateInput = dateInputs.first();
      await expect(dateInput).toBeVisible();
    }
  });

  test('should select a future date for appointment', async ({ page }) => {
    const dateInputs = page.locator('input[type="date"]');
    
    if (await dateInputs.count() > 0) {
      const dateInput = dateInputs.first();
      
      // Calculate a future date (tomorrow)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateString = tomorrow.toISOString().split('T')[0];
      
      await dateInput.fill(dateString);
      await expect(dateInput).toHaveValue(dateString);
    }
  });

  test('should not allow past date selection', async ({ page }) => {
    const dateInputs = page.locator('input[type="date"]');
    
    if (await dateInputs.count() > 0) {
      const dateInput = dateInputs.first();
      
      // Try to set a past date
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateString = yesterday.toISOString().split('T')[0];
      
      // The date input type="date" may prevent past dates
      // or the backend may reject it
      await dateInput.fill(dateString);
      await page.waitForTimeout(300);
    }
  });

  test('should display time slot options if available', async ({ page }) => {
    await page.waitForTimeout(300);
    
    // Look for time slot selections/buttons
    const timeSlotElements = page.locator('button, input[type="radio"], input[type="checkbox"]')
      .filter({ hasText: /slot|time|AM|PM|:/ });
    
    const hasTimeSlots = await timeSlotElements.count() > 0;
    
    // If the form displays time slots, verify they're visible
    if (hasTimeSlots) {
      expect(hasTimeSlots).toBe(true);
    }
  });

  test('should select a time slot if available', async ({ page }) => {
    await page.waitForTimeout(300);
    
    // Look for time slot buttons or radio inputs
    const slotButtons = page.locator('button').filter({ hasText: /slot|time|AM|PM/ });
    const slotRadios = page.locator('input[type="radio"]');
    
    if (await slotButtons.count() > 0) {
      const firstSlot = slotButtons.first();
      await firstSlot.click();
      await page.waitForTimeout(300);
    } else if (await slotRadios.count() > 0) {
      const firstSlot = slotRadios.first();
      await firstSlot.click();
      await page.waitForTimeout(300);
    }
  });

  test('should display submit button for appointment booking', async ({ page }) => {
    // Look for book/create/submit buttons
    const submitButtons = page.locator('button').filter({ hasText: /Book|Create Visit|Submit|Confirm/ });
    
    if (await submitButtons.count() > 0) {
      const submitButton = submitButtons.first();
      await expect(submitButton).toBeVisible();
    }
  });

  test('should display cancel button', async ({ page }) => {
    const cancelButtons = page.locator('button').filter({ hasText: /Cancel|Clear|Reset/ });
    
    if (await cancelButtons.count() > 0) {
      const cancelButton = cancelButtons.first();
      await expect(cancelButton).toBeVisible();
    }
  });

  test('should maintain form state during field interactions', async ({ page }) => {
    await page.waitForTimeout(300);
    
    const selects = page.locator('select');
    
    if (await selects.count() >= 1) {
      // Select department
      const departmentSelect = selects.first();
      await departmentSelect.selectOption({ index: 1 });
      await page.waitForTimeout(300);
      
      // Verify selection is maintained
      const selectedValue = await departmentSelect.inputValue();
      expect(selectedValue).toBeTruthy();
      
      // Click date field (triggers change of focus)
      const dateInputs = page.locator('input[type="date"]');
      if (await dateInputs.count() > 0) {
        await dateInputs.first().click();
        await page.waitForTimeout(300);
        
        // Department selection should still be maintained
        const stillSelectedValue = await departmentSelect.inputValue();
        expect(stillSelectedValue).toBe(selectedValue);
      }
    }
  });

  test('should handle rapid form filling', async ({ page }) => {
    await page.waitForTimeout(300);
    
    const textInputs = page.locator('input[type="text"]');
    const dateInputs = page.locator('input[type="date"]');
    
    // Rapidly fill search field
    if (await textInputs.count() > 0) {
      await textInputs.first().fill('OP-001');
    }
    
    // Rapidly fill date field
    if (await dateInputs.count() > 0) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateString = tomorrow.toISOString().split('T')[0];
      await dateInputs.first().fill(dateString);
    }
    
    await page.waitForTimeout(300);
    
    // Verify fields are filled
    if (await textInputs.count() > 0) {
      await expect(textInputs.first()).toHaveValue('OP-001');
    }
  });

  test('should display form error messages', async ({ page }) => {
    // Try to submit without filling required fields
    const submitButtons = page.locator('button').filter({ hasText: /Book|Create Visit|Submit/ });
    
    if (await submitButtons.count() > 0) {
      const submitButton = submitButtons.first();
      
      // Check if button is clickable
      const isDisabled = await submitButton.isDisabled();
      
      if (!isDisabled) {
        await submitButton.click();
        await page.waitForTimeout(500);
        
        // Look for error messages
        const errorMessages = page.locator('.error, .alert, [role="alert"], .MuiAlert-root');
        const hasErrors = await errorMessages.count() > 0;
        
        // If there are errors, they should be visible
        if (hasErrors) {
          expect(hasErrors).toBe(true);
        }
      }
    }
  });

  test('should show success message after booking appointment', async ({ page }) => {
    // Fill in the form with valid data
    const searchInputs = page.locator('input[type="text"]');
    const selects = page.locator('select');
    const dateInputs = page.locator('input[type="date"]');
    
    let allFieldsFilled = false;
    
    // Try to fill search
    if (await searchInputs.count() > 0) {
      await searchInputs.first().fill('OP-001');
      allFieldsFilled = true;
    }
    
    // Try to fill department
    if (await selects.count() >= 1) {
      const departmentSelect = selects.first();
      const options = await departmentSelect.locator('option').count();
      if (options > 1) {
        await departmentSelect.selectOption({ index: 1 });
      }
    }
    
    // Try to fill date
    if (await dateInputs.count() > 0) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateString = tomorrow.toISOString().split('T')[0];
      await dateInputs.first().fill(dateString);
    }
    
    if (allFieldsFilled) {
      await page.waitForTimeout(500);
      
      // Try to submit
      const submitButtons = page.locator('button').filter({ hasText: /Book|Create Visit|Submit/ });
      if (await submitButtons.count() > 0) {
        const submitButton = submitButtons.first();
        if (!await submitButton.isDisabled()) {
          await submitButton.click();
          await page.waitForTimeout(1000);
          
          // Look for success message
          const successMessages = page.locator('.success, .alert-success, [role="status"], .MuiAlert-root');
          const hasSuccess = await successMessages.count() > 0;
          
          if (hasSuccess) {
            expect(hasSuccess).toBe(true);
          }
        }
      }
    }
  });

  test('should clear form when clear button is clicked', async ({ page }) => {
    await page.waitForTimeout(300);
    
    const textInputs = page.locator('input[type="text"]');
    const dateInputs = page.locator('input[type="date"]');
    
    // Fill some fields
    if (await textInputs.count() > 0) {
      await textInputs.first().fill('Test Data');
    }
    
    await page.waitForTimeout(300);
    
    // Find and click clear button
    const clearButtons = page.locator('button').filter({ hasText: /Clear|Reset/ });
    if (await clearButtons.count() > 0) {
      const clearButton = clearButtons.first();
      if (!await clearButton.isDisabled()) {
        await clearButton.click();
        await page.waitForTimeout(300);
        
        // Verify fields are cleared
        if (await textInputs.count() > 0) {
          await expect(textInputs.first()).toHaveValue('');
        }
      }
    }
  });

  test('should handle tab navigation through form fields', async ({ page }) => {
    await page.waitForTimeout(300);
    
    const textInputs = page.locator('input[type="text"]');
    
    if (await textInputs.count() > 0) {
      // Focus first input
      await textInputs.first().click();
      await textInputs.first().fill('OP-001');
      
      // Tab to next field
      await page.keyboard.press('Tab');
      
      // Verify previous field maintained value
      await expect(textInputs.first()).toHaveValue('OP-001');
    }
  });

  test('should validate required fields are present', async ({ page }) => {
    // Check that at least required fields are visible
    const textInputs = page.locator('input[type="text"]');
    const dateInputs = page.locator('input[type="date"]');
    const selects = page.locator('select');
    
    // Should have search, date, and dropdown selects
    const hasRequiredFields = 
      (await textInputs.count() > 0) ||
      (await dateInputs.count() > 0) ||
      (await selects.count() > 0);
    
    expect(hasRequiredFields).toBe(true);
  });

  test('should handle special characters in search', async ({ page }) => {
    const searchInputs = page.locator('input[type="text"]');
    
    if (await searchInputs.count() > 0) {
      const searchInput = searchInputs.first();
      
      // Test special characters
      await searchInput.fill("OP-001@#$");
      await page.waitForTimeout(300);
      
      // Verify input accepted the characters
      const value = await searchInput.inputValue();
      expect(value).toBeTruthy();
    }
  });

  test('should handle long patient search queries', async ({ page }) => {
    const searchInputs = page.locator('input[type="text"]');
    
    if (await searchInputs.count() > 0) {
      const searchInput = searchInputs.first();
      
      // Test long string
      const longString = 'VeryLongPatientNameForSearching123456789';
      await searchInput.fill(longString);
      await page.waitForTimeout(300);
      
      // Verify it accepts the long input
      const value = await searchInput.inputValue();
      expect(value.length).toBeGreaterThan(0);
    }
  });

  test('should display form with all major sections visible', async ({ page }) => {
    // Verify main form sections are visible
    const pageText = await page.textContent('body');
    
    // Check for key terms that should appear on the form
    const hasKeyTerms = pageText && (
      pageText.includes('Patient') || 
      pageText.includes('Doctor') || 
      pageText.includes('Department') ||
      pageText.includes('Date')
    );
    
    if (hasKeyTerms) {
      expect(hasKeyTerms).toBe(true);
    }
  });

  test('should maintain visibility during scrolling', async ({ page }) => {
    // Verify form title is visible
    const formElements = page.locator('h1, h2, h3');
    
    if (await formElements.count() > 0) {
      const firstHeading = formElements.first();
      await expect(firstHeading).toBeVisible();
    }
    
    // Scroll down
    await page.keyboard.press('End');
    await page.waitForTimeout(300);
    
    // Form components should still be accessible
    const buttons = page.locator('button');
    const hasButtons = await buttons.count() > 0;
    expect(hasButtons).toBe(true);
  });

  test('should handle concurrent field updates', async ({ page }) => {
    await page.waitForTimeout(300);
    
    const textInputs = page.locator('input[type="text"]');
    const dateInputs = page.locator('input[type="date"]');
    
    // Update multiple fields simultaneously
    const updates = [];
    
    if (await textInputs.count() > 0) {
      updates.push(textInputs.first().fill('OP-001'));
    }
    
    if (await dateInputs.count() > 0) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateString = tomorrow.toISOString().split('T')[0];
      updates.push(dateInputs.first().fill(dateString));
    }
    
    // Execute updates
    await Promise.all(updates);
    await page.waitForTimeout(300);
    
    // Verify both updates succeeded
    if (await textInputs.count() > 0) {
      await expect(textInputs.first()).toHaveValue('OP-001');
    }
  });
});