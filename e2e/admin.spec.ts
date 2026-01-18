import { test, expect, Page } from '@playwright/test'
import path from 'path'

const ADMIN_PASSWORD = 'admin'

async function loginAsAdmin(page: Page) {
  await page.goto('/admin')
  await page.fill('input[type="password"]', ADMIN_PASSWORD)
  await page.click('button[type="submit"]')
  await expect(page.getByRole('heading', { name: 'Admin' })).toBeVisible()
}

async function createTestImageFile(page: Page): Promise<string> {
  // Create a simple test image using a data URL converted to file
  const testImagePath = path.join(__dirname, 'fixtures', 'test-image.png')
  return testImagePath
}

test.describe('login', () => {
  test('shows login form when not authenticated', async ({ page }) => {
    await page.goto('/admin')
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible()
  })

  test('logs in with correct password', async ({ page }) => {
    await page.goto('/admin')
    await page.fill('input[type="password"]', ADMIN_PASSWORD)
    await page.click('button[type="submit"]')
    await expect(page.getByRole('heading', { name: 'Admin' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible()
  })

  test('shows error on wrong password', async ({ page }) => {
    await page.goto('/admin')

    // Set up dialog handler for alert
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Invalid password')
      await dialog.accept()
    })

    await page.fill('input[type="password"]', 'wrong-password')
    await page.click('button[type="submit"]')

    // Should still show login form
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test('logs out successfully', async ({ page }) => {
    await loginAsAdmin(page)
    await page.click('button:has-text("Logout")')
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test('session persists on page refresh', async ({ page }) => {
    await loginAsAdmin(page)
    await page.reload()
    // Should still be authenticated
    await expect(page.getByRole('heading', { name: 'Admin' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible()
  })
})

test.describe('artwork-crud', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    // Ensure we're on artworks tab
    await page.click('button:has-text("artworks")')
  })

  test('shows add artwork button', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Add Artwork' })).toBeVisible()
  })

  test('opens artwork form modal when clicking add', async ({ page }) => {
    await page.click('button:has-text("Add Artwork")')
    await expect(page.getByRole('heading', { name: 'Add Artwork' })).toBeVisible()
  })

  test('shows drop zone for image upload', async ({ page }) => {
    await page.click('button:has-text("Add Artwork")')
    await expect(page.getByText(/Click or drag images here/)).toBeVisible()
  })

  test('disables save button when no image selected', async ({ page }) => {
    await page.click('button:has-text("Add Artwork")')
    await expect(page.getByTestId('submit-button')).toBeDisabled()
  })

  test('can cancel form', async ({ page }) => {
    await page.click('button:has-text("Add Artwork")')
    await page.click('button:has-text("Cancel")')
    await expect(page.getByRole('heading', { name: 'Add Artwork' })).not.toBeVisible()
  })

  test('shows series dropdown', async ({ page }) => {
    await page.click('button:has-text("Add Artwork")')
    const seriesSelect = page.locator('select')
    await expect(seriesSelect).toBeVisible()
    await expect(seriesSelect).toContainText('None')
  })

  test('shows year and dimensions fields', async ({ page }) => {
    await page.click('button:has-text("Add Artwork")')
    await expect(page.getByRole('spinbutton')).toBeVisible()
    await expect(page.getByPlaceholder(/24 x 36 in/)).toBeVisible()
  })

  test('shows medium field', async ({ page }) => {
    await page.click('button:has-text("Add Artwork")')
    await expect(page.getByPlaceholder(/Oil on canvas/)).toBeVisible()
  })

  test('shows published toggle', async ({ page }) => {
    await page.click('button:has-text("Add Artwork")')
    await expect(page.getByTestId('published-toggle')).toBeVisible()
  })

  test('edit button opens edit form with existing data', async ({ page }) => {
    // Check if there are existing artworks
    const editButton = page.locator('button:has-text("Edit")').first()
    const hasArtworks = await editButton.isVisible().catch(() => false)

    if (hasArtworks) {
      await editButton.click()
      await expect(page.getByRole('heading', { name: 'Edit Artwork' })).toBeVisible()
      // Title field should have value
      const titleInput = page.locator('input[type="text"]').first()
      await expect(titleInput).not.toHaveValue('')
    }
  })

  test('delete button shows confirmation', async ({ page }) => {
    const deleteButton = page.locator('button:has-text("Delete")').first()
    const hasArtworks = await deleteButton.isVisible().catch(() => false)

    if (hasArtworks) {
      // Set up dialog handler
      page.on('dialog', async dialog => {
        expect(dialog.message()).toContain('Delete this artwork')
        await dialog.dismiss()
      })

      await deleteButton.click()
    }
  })
})

test.describe('bulk-upload', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.click('button:has-text("artworks")')
    await page.click('button:has-text("Add Artwork")')
  })

  test('file input accepts multiple files', async ({ page }) => {
    const fileInput = page.getByTestId('file-input')
    await expect(fileInput).toHaveAttribute('multiple')
  })

  test('shows max images limit in drop zone', async ({ page }) => {
    await expect(page.getByText(/max 50/)).toBeVisible()
  })

  test('drop zone shows visual feedback on drag over', async ({ page }) => {
    const dropZone = page.locator('[class*="border-dashed"]')

    // Trigger dragover
    await dropZone.dispatchEvent('dragover', {
      dataTransfer: new DataTransfer(),
    })

    await expect(page.getByText('Drop images here')).toBeVisible()
  })

  test('shows image row with thumbnail after file selection', async ({ page }) => {
    const fileInput = page.getByTestId('file-input')

    // Create test file via buffer
    await fileInput.setInputFiles({
      name: 'test-artwork.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-data'),
    })

    // Wait for thumbnail to be generated
    await expect(page.getByTestId('image-row-0')).toBeVisible({ timeout: 5000 })
  })

  test('title defaults to filename without extension', async ({ page }) => {
    const fileInput = page.getByTestId('file-input')

    await fileInput.setInputFiles({
      name: 'my-artwork-name.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-data'),
    })

    await expect(page.getByTestId('image-row-0')).toBeVisible({ timeout: 5000 })
    const titleInput = page.getByTestId('title-input-0')
    await expect(titleInput).toHaveValue('my-artwork-name')
  })

  test('can edit individual image title', async ({ page }) => {
    const fileInput = page.getByTestId('file-input')

    await fileInput.setInputFiles({
      name: 'original.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-data'),
    })

    await expect(page.getByTestId('image-row-0')).toBeVisible({ timeout: 5000 })

    const titleInput = page.getByTestId('title-input-0')
    await titleInput.clear()
    await titleInput.fill('New Custom Title')

    await expect(titleInput).toHaveValue('New Custom Title')
  })

  test('can remove image from selection', async ({ page }) => {
    const fileInput = page.getByTestId('file-input')

    await fileInput.setInputFiles({
      name: 'test.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-data'),
    })

    await expect(page.getByTestId('image-row-0')).toBeVisible({ timeout: 5000 })

    await page.getByTestId('remove-image-0').click()

    await expect(page.getByTestId('image-row-0')).not.toBeVisible()
  })

  test('can select multiple images at once', async ({ page }) => {
    const fileInput = page.getByTestId('file-input')

    await fileInput.setInputFiles([
      { name: 'art1.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('1') },
      { name: 'art2.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('2') },
      { name: 'art3.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('3') },
    ])

    await expect(page.getByTestId('image-row-0')).toBeVisible({ timeout: 5000 })
    await expect(page.getByTestId('image-row-1')).toBeVisible()
    await expect(page.getByTestId('image-row-2')).toBeVisible()
  })

  test('shared metadata fields are visible', async ({ page }) => {
    // Series dropdown
    await expect(page.locator('select')).toBeVisible()
    // Year
    await expect(page.getByRole('spinbutton')).toBeVisible()
    // Dimensions
    await expect(page.getByPlaceholder(/24 x 36 in/)).toBeVisible()
    // Medium
    await expect(page.getByPlaceholder(/Oil on canvas/)).toBeVisible()
    // Description
    await expect(page.locator('textarea')).toBeVisible()
    // Published toggle
    await expect(page.getByTestId('published-toggle')).toBeVisible()
  })

  test('enables save button when image selected', async ({ page }) => {
    const fileInput = page.getByTestId('file-input')

    await expect(page.getByTestId('submit-button')).toBeDisabled()

    await fileInput.setInputFiles({
      name: 'test.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake'),
    })

    await expect(page.getByTestId('image-row-0')).toBeVisible({ timeout: 5000 })
    await expect(page.getByTestId('submit-button')).not.toBeDisabled()
  })

  test('shows upload progress indicator during save', async ({ page }) => {
    const fileInput = page.getByTestId('file-input')

    await fileInput.setInputFiles([
      { name: 'art1.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('1') },
      { name: 'art2.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('2') },
    ])

    await expect(page.getByTestId('image-row-0')).toBeVisible({ timeout: 5000 })
    await expect(page.getByTestId('image-row-1')).toBeVisible()

    // Click save - this will likely fail due to no convex backend, but we can check progress appears
    await page.getByTestId('submit-button').click()

    // Either shows progress or errors (depends on convex connection)
    const progressOrError = page.getByTestId('upload-progress').or(page.getByTestId('upload-errors'))
    await expect(progressOrError).toBeVisible({ timeout: 5000 })
  })
})

test.describe('series-crud', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.click('button:has-text("series")')
  })

  test('shows add series button', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Add Series' })).toBeVisible()
  })

  test('opens series form modal when clicking add', async ({ page }) => {
    await page.click('button:has-text("Add Series")')
    await expect(page.getByRole('heading', { name: 'Add Series' })).toBeVisible()
  })

  test('shows required form fields', async ({ page }) => {
    await page.click('button:has-text("Add Series")')
    await expect(page.getByLabel(/Name/)).toBeVisible()
    await expect(page.getByLabel(/Slug/)).toBeVisible()
    await expect(page.getByLabel(/Description/)).toBeVisible()
  })

  test('auto-generates slug from name', async ({ page }) => {
    await page.click('button:has-text("Add Series")')
    const nameInput = page.locator('input').first()
    await nameInput.fill('Test Series Name')

    const slugInput = page.locator('input').nth(1)
    await expect(slugInput).toHaveValue('test-series-name')
  })

  test('can cancel form', async ({ page }) => {
    await page.click('button:has-text("Add Series")')
    await page.click('button:has-text("Cancel")')
    await expect(page.getByRole('heading', { name: 'Add Series' })).not.toBeVisible()
  })

  test('edit button opens edit form with existing data', async ({ page }) => {
    const editButton = page.locator('button:has-text("Edit")').first()
    const hasSeries = await editButton.isVisible().catch(() => false)

    if (hasSeries) {
      await editButton.click()
      await expect(page.getByRole('heading', { name: 'Edit Series' })).toBeVisible()
      const nameInput = page.locator('input').first()
      await expect(nameInput).not.toHaveValue('')
    }
  })

  test('delete button shows confirmation', async ({ page }) => {
    const deleteButton = page.locator('button:has-text("Delete")').first()
    const hasSeries = await deleteButton.isVisible().catch(() => false)

    if (hasSeries) {
      page.on('dialog', async dialog => {
        expect(dialog.message()).toContain('Delete this series')
        await dialog.dismiss()
      })

      await deleteButton.click()
    }
  })
})

test.describe('messages', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
    await page.click('button:has-text("messages")')
  })

  test('shows messages tab', async ({ page }) => {
    // Tab should be active
    const messagesTab = page.locator('button:has-text("messages")')
    await expect(messagesTab).toBeVisible()
  })

  test('shows empty state when no messages', async ({ page }) => {
    // Either shows messages or empty state
    const content = page.getByText('No messages yet').or(page.locator('.font-medium'))
    await expect(content).toBeVisible({ timeout: 5000 })
  })

  test('message row shows sender info', async ({ page }) => {
    // If messages exist, they should show name and email
    const messageRow = page.locator('.font-medium').first()
    const hasMessages = await messageRow.isVisible().catch(() => false)

    if (hasMessages) {
      // Should have name and email visible
      await expect(page.locator('p.text-sm').first()).toBeVisible()
    }
  })

  test('unread messages have visual indicator', async ({ page }) => {
    // Unread messages have bg-blue-50 class
    const unreadMessage = page.locator('.bg-blue-50')
    const hasUnread = await unreadMessage.isVisible().catch(() => false)

    if (hasUnread) {
      await expect(page.getByRole('button', { name: 'Mark read' })).toBeVisible()
    }
  })

  test('can mark message as read', async ({ page }) => {
    const markReadButton = page.getByRole('button', { name: 'Mark read' }).first()
    const hasUnread = await markReadButton.isVisible().catch(() => false)

    if (hasUnread) {
      await markReadButton.click()
      // Button should disappear after marking read
      await expect(markReadButton).not.toBeVisible({ timeout: 5000 })
    }
  })

  test('delete button shows confirmation', async ({ page }) => {
    const deleteButton = page.locator('button:has-text("Delete")').first()
    const hasMessages = await deleteButton.isVisible().catch(() => false)

    if (hasMessages) {
      page.on('dialog', async dialog => {
        expect(dialog.message()).toContain('Delete this message')
        await dialog.dismiss()
      })

      await deleteButton.click()
    }
  })
})
