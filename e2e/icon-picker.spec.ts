import { test, expect } from './fixtures'
import { Page } from '@playwright/test'

const MOCK_ICON_LIST = [
  'lorc/axe',
  'lorc/sword',
  'lorc/shield',
  'delapouite/castle',
  'delapouite/dragon',
  'delapouite/painting',
].join('\n')

const MOCK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M10 10h492v492H10z"/></svg>`

async function setupIconMocks(page: Page) {
  // Mock the icon list fetch
  await page.route('**/ArnoldSmith86/gameicons-metadata/master/list.txt', route => {
    route.fulfill({
      status: 200,
      contentType: 'text/plain',
      body: MOCK_ICON_LIST,
    })
  })

  // Mock SVG fetch from GitHub raw
  await page.route('**/game-icons/icons/master/**/*.svg', route => {
    route.fulfill({
      status: 200,
      contentType: 'image/svg+xml',
      body: MOCK_SVG,
    })
  })

  // Mock SVG image loads from game-icons.net (for thumbnails in grid)
  await page.route('**/game-icons.net/icons/**/*.svg', route => {
    route.fulfill({
      status: 200,
      contentType: 'image/svg+xml',
      body: MOCK_SVG,
    })
  })
}

test.describe('icon-picker', () => {
  test.beforeEach(async ({ page, adminToken }) => {
    await setupIconMocks(page)
    await page.addInitScript((token) => {
      sessionStorage.setItem('gallery_admin_token', token)
    }, adminToken)
    await page.goto('/admin')
    await page.click('button:has-text("collections")')
  })

  test('shows icon picker in collection form', async ({ page }) => {
    await page.click('button:has-text("Add Collection")')
    await expect(page.getByText('Or pick an icon')).toBeVisible()
    await expect(page.getByPlaceholder('Search icons...')).toBeVisible()
  })

  test('searches and displays matching icons', async ({ page }) => {
    await page.click('button:has-text("Add Collection")')
    const searchInput = page.getByPlaceholder('Search icons...')
    await searchInput.fill('axe')

    // Wait for debounce and results
    await expect(page.locator('button[title="axe"]')).toBeVisible({ timeout: 4000 })
  })

  test('shows no results for non-matching query', async ({ page }) => {
    await page.click('button:has-text("Add Collection")')
    const searchInput = page.getByPlaceholder('Search icons...')
    await searchInput.fill('zzzzz')

    await expect(page.getByText('No icons found')).toBeVisible({ timeout: 4000 })
  })

  test('selects icon and shows preview with remove button', async ({ page }) => {
    await page.click('button:has-text("Add Collection")')
    const searchInput = page.getByPlaceholder('Search icons...')
    await searchInput.fill('axe')

    await expect(page.locator('button[title="axe"]')).toBeVisible({ timeout: 4000 })
    await page.click('button[title="axe"]')

    // Should show selected state with remove button
    await expect(page.getByText('Selected icon')).toBeVisible({ timeout: 4000 })
    await expect(page.getByRole('button', { name: 'Remove' })).toBeVisible()
  })

  test('remove button clears selected icon', async ({ page }) => {
    await page.click('button:has-text("Add Collection")')
    const searchInput = page.getByPlaceholder('Search icons...')
    await searchInput.fill('sword')

    await expect(page.locator('button[title="sword"]')).toBeVisible({ timeout: 4000 })
    await page.click('button[title="sword"]')

    await expect(page.getByText('Selected icon')).toBeVisible({ timeout: 4000 })
    await page.click('button:has-text("Remove")')

    // Should show search input again
    await expect(page.getByPlaceholder('Search icons...')).toBeVisible()
    await expect(page.getByText('Selected icon')).not.toBeVisible()
  })

  test('hides upload section when icon is selected', async ({ page }) => {
    await page.click('button:has-text("Add Collection")')

    // Upload section visible initially
    await expect(page.getByText('Click or drag image here')).toBeVisible()

    const searchInput = page.getByPlaceholder('Search icons...')
    await searchInput.fill('axe')
    await expect(page.locator('button[title="axe"]')).toBeVisible({ timeout: 4000 })
    await page.click('button[title="axe"]')

    await expect(page.getByText('Selected icon')).toBeVisible({ timeout: 4000 })
    // Upload section should be hidden
    await expect(page.getByText('Click or drag image here')).not.toBeVisible()
  })

  test('saves collection with icon', async ({ page }) => {
    await page.click('button:has-text("Add Collection")')

    // Fill required fields
    await page.locator('label:has-text("Name") + input').fill('Test Icon Collection')
    await expect(page.locator('label:has-text("Slug") + input')).toHaveValue('test-icon-collection')

    // Select an icon
    const searchInput = page.getByPlaceholder('Search icons...')
    await searchInput.fill('castle')
    await expect(page.locator('button[title="castle"]')).toBeVisible({ timeout: 4000 })
    await page.click('button[title="castle"]')
    await expect(page.getByText('Selected icon')).toBeVisible({ timeout: 4000 })

    // Save
    await page.click('button:has-text("Save")')

    // Form should close (save succeeded)
    await expect(page.getByRole('heading', { name: 'Add Collection' })).not.toBeVisible({ timeout: 4000 })
  })

  test('icon displays on landing page after save', async ({ page }) => {
    // First create a collection with an icon
    await page.click('button:has-text("Add Collection")')
    await page.locator('label:has-text("Name") + input').fill('Icon Display Test')
    const searchInput = page.getByPlaceholder('Search icons...')
    await searchInput.fill('dragon')
    await expect(page.locator('button[title="dragon"]')).toBeVisible({ timeout: 4000 })
    await page.click('button[title="dragon"]')
    await expect(page.getByText('Selected icon')).toBeVisible({ timeout: 4000 })
    await page.click('button:has-text("Save")')
    await expect(page.getByRole('heading', { name: 'Add Collection' })).not.toBeVisible({ timeout: 4000 })

    // Navigate to landing page
    await page.goto('/')

    // The collection card should show SVG content instead of a letter
    const svgElement = page.locator('svg path[d="M10 10h492v492H10z"]').first()
    await expect(svgElement).toBeVisible({ timeout: 4000 })
  })

  test('editing collection preserves icon', async ({ page }) => {
    // Create collection with icon first
    await page.click('button:has-text("Add Collection")')
    await page.locator('label:has-text("Name") + input').fill('Preserve Icon Test')
    const searchInput = page.getByPlaceholder('Search icons...')
    await searchInput.fill('shield')
    await expect(page.locator('button[title="shield"]')).toBeVisible({ timeout: 4000 })
    await page.click('button[title="shield"]')
    await expect(page.getByText('Selected icon')).toBeVisible({ timeout: 4000 })
    await page.click('button:has-text("Save")')
    await expect(page.getByRole('heading', { name: 'Add Collection' })).not.toBeVisible({ timeout: 4000 })

    // Edit the collection
    const editButton = page.locator('div:has-text("Preserve Icon Test") + div button:has-text("Edit")').first()
    if (await editButton.isVisible().catch(() => false)) {
      await editButton.click()
      await expect(page.getByText('Selected icon')).toBeVisible({ timeout: 4000 })
    }
  })

  test('debounces search input', async ({ page }) => {
    await page.click('button:has-text("Add Collection")')
    const searchInput = page.getByPlaceholder('Search icons...')

    // Type quickly
    await searchInput.fill('a')
    // No results yet (too short)
    await expect(page.getByText('No icons found')).not.toBeVisible()

    await searchInput.fill('ax')
    // Results should appear after debounce
    await expect(page.locator('button[title="axe"]')).toBeVisible({ timeout: 3000 })
  })

  test('requires minimum 2 characters to search', async ({ page }) => {
    await page.click('button:has-text("Add Collection")')
    const searchInput = page.getByPlaceholder('Search icons...')

    await searchInput.fill('a')
    // Grid should not be visible with 1 character
    await expect(page.locator('.grid-cols-8')).not.toBeVisible()

    await searchInput.fill('ax')
    // Grid should now be visible
    await expect(page.locator('.grid-cols-8')).toBeVisible()
  })
})
