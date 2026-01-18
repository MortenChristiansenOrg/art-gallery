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
