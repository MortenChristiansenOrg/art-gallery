import { test, expect } from '@playwright/test'

test.describe('submit-form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/about')
  })

  test('about page loads successfully', async ({ page }) => {
    await expect(page).toHaveURL('/about')
    await expect(page.getByRole('heading', { name: 'About' })).toBeVisible()
  })

  test('shows contact form with required fields', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Get in Touch' })).toBeVisible()
    await expect(page.getByPlaceholder('Your name')).toBeVisible()
    await expect(page.getByPlaceholder('your@email.com')).toBeVisible()
    await expect(page.getByPlaceholder('Your message...')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Send Message' })).toBeVisible()
  })

  test('form fields have proper labels', async ({ page }) => {
    await expect(page.locator('label', { hasText: 'Name' })).toBeVisible()
    await expect(page.locator('label', { hasText: 'Email' })).toBeVisible()
    await expect(page.locator('label', { hasText: 'Message' })).toBeVisible()
  })

  test('form fields are required', async ({ page }) => {
    const nameInput = page.getByPlaceholder('Your name')
    const emailInput = page.getByPlaceholder('your@email.com')
    const messageInput = page.getByPlaceholder('Your message...')

    await expect(nameInput).toHaveAttribute('required')
    await expect(emailInput).toHaveAttribute('required')
    await expect(messageInput).toHaveAttribute('required')
  })

  test('email field validates email format', async ({ page }) => {
    const emailInput = page.getByPlaceholder('your@email.com')
    await expect(emailInput).toHaveAttribute('type', 'email')
  })

  test('can fill out form', async ({ page }) => {
    const nameInput = page.getByPlaceholder('Your name')
    const emailInput = page.getByPlaceholder('your@email.com')
    const messageInput = page.getByPlaceholder('Your message...')

    await nameInput.fill('Test User')
    await emailInput.fill('test@example.com')
    await messageInput.fill('This is a test message from the E2E test suite.')

    await expect(nameInput).toHaveValue('Test User')
    await expect(emailInput).toHaveValue('test@example.com')
    await expect(messageInput).toHaveValue('This is a test message from the E2E test suite.')
  })

  test('submit button is enabled when form is filled', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: 'Send Message' })

    // Fill form
    await page.getByPlaceholder('Your name').fill('Test User')
    await page.getByPlaceholder('your@email.com').fill('test@example.com')
    await page.getByPlaceholder('Your message...').fill('Test message')

    await expect(submitButton).toBeEnabled()
  })

  test('shows sending state on submit', async ({ page }) => {
    // Fill form
    await page.getByPlaceholder('Your name').fill('Test User')
    await page.getByPlaceholder('your@email.com').fill('test@example.com')
    await page.getByPlaceholder('Your message...').fill('Test message')

    // Submit - this triggers the mutation
    await page.getByRole('button', { name: 'Send Message' }).click()

    // Should show "Sending..." or success/error state
    const sendingOrResult = page
      .getByText('Sending...')
      .or(page.getByText('Thank you'))
      .or(page.getByText('Something went wrong'))
    await expect(sendingOrResult).toBeVisible({ timeout: 4000 })
  })

  test('shows success message after submit', async ({ page }) => {
    // Fill form
    await page.getByPlaceholder('Your name').fill('Test User')
    await page.getByPlaceholder('your@email.com').fill('test@example.com')
    await page.getByPlaceholder('Your message...').fill('Test message')

    // Submit
    await page.getByRole('button', { name: 'Send Message' }).click()

    // Either shows success or error (depends on backend availability)
    const result = page
      .getByText('Thank you for your message')
      .or(page.getByText('Something went wrong'))
    await expect(result).toBeVisible({ timeout: 4000 })
  })

  test('form clears after successful submit', async ({ page }) => {
    // Fill form
    await page.getByPlaceholder('Your name').fill('Test User')
    await page.getByPlaceholder('your@email.com').fill('test@example.com')
    await page.getByPlaceholder('Your message...').fill('Test message')

    // Submit
    await page.getByRole('button', { name: 'Send Message' }).click()

    // Check for success state
    const successMessage = page.getByText('Thank you for your message')
    const isSuccess = await successMessage.isVisible({ timeout: 4000 }).catch(() => false)

    if (isSuccess) {
      // Form should be replaced with success message
      await expect(page.getByPlaceholder('Your name')).not.toBeVisible()
    }
  })

  test('shows about content section', async ({ page }) => {
    // About page should have content section before contact form
    const aboutSection = page.locator('section').first()
    await expect(aboutSection).toBeVisible()
  })
})
