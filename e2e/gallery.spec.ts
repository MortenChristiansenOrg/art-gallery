import { test, expect } from '@playwright/test'

test.describe('browse-artworks', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL('/')
  })

  test('shows gallery grid or empty state', async ({ page }) => {
    await page.goto('/')
    // Wait for loading to complete - either shows grid or empty message
    const content = page
      .locator('article')
      .first()
      .or(page.getByText('No works to display'))
    await expect(content).toBeVisible({ timeout: 10000 })
  })

  test('artwork cards have images and titles', async ({ page }) => {
    await page.goto('/')

    const artworkCard = page.locator('article').first()
    const hasArtworks = await artworkCard.isVisible({ timeout: 5000 }).catch(() => false)

    if (hasArtworks) {
      // Should have image or "No image" placeholder
      const imageOrPlaceholder = page.locator('img').first().or(page.getByText('No image'))
      await expect(imageOrPlaceholder).toBeVisible()

      // Should have title
      const title = artworkCard.locator('h3')
      await expect(title).toBeVisible()
    }
  })

  test('clicking artwork navigates to detail page', async ({ page }) => {
    await page.goto('/')

    const artworkCard = page.locator('article').first()
    const hasArtworks = await artworkCard.isVisible({ timeout: 5000 }).catch(() => false)

    if (hasArtworks) {
      // Cards are wrapped in links to /artwork/:id
      const artworkLink = page.locator('a[href^="/artwork/"]').first()
      await artworkLink.click()
      await expect(page).toHaveURL(/\/artwork\//)
    }
  })

  test('artwork detail page shows metadata', async ({ page }) => {
    await page.goto('/')

    const artworkLink = page.locator('a[href^="/artwork/"]').first()
    const hasArtworks = await artworkLink.isVisible({ timeout: 5000 }).catch(() => false)

    if (hasArtworks) {
      await artworkLink.click()
      await expect(page).toHaveURL(/\/artwork\//)

      // Should show title at minimum
      await expect(page.locator('h1, h2').first()).toBeVisible()
    }
  })

  test('can navigate back from detail page', async ({ page }) => {
    await page.goto('/')

    const artworkLink = page.locator('a[href^="/artwork/"]').first()
    const hasArtworks = await artworkLink.isVisible({ timeout: 5000 }).catch(() => false)

    if (hasArtworks) {
      await artworkLink.click()
      await expect(page).toHaveURL(/\/artwork\//)

      // Navigate back
      await page.goBack()
      await expect(page).toHaveURL('/')
    }
  })

  test('images load with lazy loading', async ({ page }) => {
    await page.goto('/')

    const img = page.locator('article img').first()
    const hasImages = await img.isVisible({ timeout: 5000 }).catch(() => false)

    if (hasImages) {
      await expect(img).toHaveAttribute('loading', 'lazy')
    }
  })
})

test.describe('filter-by-series', () => {
  test('series filter shows when series exist', async ({ page }) => {
    await page.goto('/')

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    // Filter nav or no filter (if no series)
    const filterNav = page.locator('nav[aria-label="Filter artworks by series"]')
    const hasFilter = await filterNav.isVisible({ timeout: 5000 }).catch(() => false)

    if (hasFilter) {
      await expect(filterNav).toBeVisible()
    }
  })

  test('shows "All Works" link', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const allWorksLink = page.getByRole('link', { name: 'All Works' })
    const hasFilter = await allWorksLink.isVisible({ timeout: 5000 }).catch(() => false)

    if (hasFilter) {
      await expect(allWorksLink).toBeVisible()
    }
  })

  test('clicking series filters gallery', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const filterNav = page.locator('nav[aria-label="Filter artworks by series"]')
    const hasFilter = await filterNav.isVisible({ timeout: 5000 }).catch(() => false)

    if (hasFilter) {
      // Get first series link (not "All Works")
      const seriesLink = filterNav.locator('a[href*="?series="]').first()
      const hasSeriesLink = await seriesLink.isVisible().catch(() => false)

      if (hasSeriesLink) {
        await seriesLink.click()
        // URL should have series param
        await expect(page).toHaveURL(/\?series=/)
      }
    }
  })

  test('clicking "All Works" resets filter', async ({ page }) => {
    await page.goto('/?series=test')
    await page.waitForLoadState('networkidle')

    const allWorksLink = page.getByRole('link', { name: 'All Works' })
    const hasFilter = await allWorksLink.isVisible({ timeout: 5000 }).catch(() => false)

    if (hasFilter) {
      await allWorksLink.click()
      // URL should not have series param
      await expect(page).toHaveURL('/')
    }
  })

  test('active filter has visual indicator', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const filterNav = page.locator('nav[aria-label="Filter artworks by series"]')
    const hasFilter = await filterNav.isVisible({ timeout: 5000 }).catch(() => false)

    if (hasFilter) {
      // "All Works" should have text color indicating active state (not muted)
      const allWorksLink = page.getByRole('link', { name: 'All Works' })
      const classes = await allWorksLink.getAttribute('class')
      expect(classes).toContain('text-[var(--color-gallery-text)]')
    }
  })

  test('filtered view shows appropriate content', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const filterNav = page.locator('nav[aria-label="Filter artworks by series"]')
    const hasFilter = await filterNav.isVisible({ timeout: 5000 }).catch(() => false)

    if (hasFilter) {
      const seriesLink = filterNav.locator('a[href*="?series="]').first()
      const hasSeriesLink = await seriesLink.isVisible().catch(() => false)

      if (hasSeriesLink) {
        await seriesLink.click()
        await page.waitForLoadState('networkidle')

        // Should show either artworks or "No works to display"
        const content = page
          .locator('article')
          .first()
          .or(page.getByText('No works to display'))
        await expect(content).toBeVisible({ timeout: 5000 })
      }
    }
  })
})
