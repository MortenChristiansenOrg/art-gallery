import { test, expect } from '@playwright/test'

test.describe('browse-artworks', () => {
  test('homepage loads and shows gallery content', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL('/')
    const content = page
      .locator('article')
      .first()
      .or(page.getByText('No works to display'))
    await expect(content).toBeVisible({ timeout: 4000 })
  })

  test('artwork cards have images, titles, and link to detail', async ({ page }) => {
    await page.goto('/')

    const artworkCard = page.locator('article').first()
    const hasArtworks = await artworkCard.isVisible({ timeout: 4000 }).catch(() => false)

    if (hasArtworks) {
      // Should have image or placeholder
      const imageOrPlaceholder = page.locator('img').first().or(page.getByText('No image'))
      await expect(imageOrPlaceholder).toBeVisible()

      // Should have title
      await expect(artworkCard.locator('h3')).toBeVisible()

      // Cards link to /artwork/:id
      const artworkLink = page.locator('a[href^="/artwork/"]').first()
      await artworkLink.click()
      await expect(page).toHaveURL(/\/artwork\//)

      // Detail page shows title
      await expect(page.locator('h1, h2').first()).toBeVisible()

      // Can navigate back
      await page.goBack()
      await expect(page).toHaveURL('/')
    }
  })
})

test.describe('collections-landing', () => {
  test('collection cards have expected structure', async ({ page }) => {
    await page.goto('/')
    const collectionCard = page.locator('a[href^="/collection/"]').first()
    const hasCollections = await collectionCard.isVisible({ timeout: 4000 }).catch(() => false)

    if (hasCollections) {
      // Cover image or placeholder
      const imageOrPlaceholder = collectionCard.locator('img').or(page.getByText('No cover image'))
      await expect(imageOrPlaceholder.first()).toBeVisible()

      // Name
      await expect(collectionCard.locator('h2')).toBeVisible()

      // Work count
      await expect(collectionCard.getByText(/\d+ works?/)).toBeVisible()

      // Hover effect class
      const classes = await collectionCard.getAttribute('class')
      expect(classes).toContain('hover:-translate-y-2')
    }
  })

  test('clicking collection navigates to collection page', async ({ page }) => {
    await page.goto('/')
    const collectionCard = page.locator('a[href^="/collection/"]').first()
    const hasCollections = await collectionCard.isVisible({ timeout: 4000 }).catch(() => false)

    if (hasCollections) {
      await collectionCard.click()
      await expect(page).toHaveURL(/\/collection\//)
    }
  })

  test('Cabinet of Curiosities card shown for uncategorized artworks', async ({ page }) => {
    await page.goto('/')
    const cabinetCard = page.locator('a[href="/collection/cabinet-of-curiosities"]')
    const hasCabinet = await cabinetCard.isVisible({ timeout: 4000 }).catch(() => false)

    if (hasCabinet) {
      await expect(cabinetCard.getByText('Cabinet of Curiosities')).toBeVisible()
      await expect(cabinetCard.getByText('Uncategorized works and experiments')).toBeVisible()
    }
  })
})

test.describe('collection-view', () => {
  test('collection page shows title, back link, and navigation works', async ({ page }) => {
    await page.goto('/')
    const collectionCard = page.locator('a[href^="/collection/"]').first()
    const hasCollections = await collectionCard.isVisible({ timeout: 4000 }).catch(() => false)

    if (hasCollections) {
      await collectionCard.click()
      await expect(page).toHaveURL(/\/collection\//)

      // Title
      await expect(page.locator('h1').first()).toBeVisible()

      // Back link
      const backLink = page.getByRole('link', { name: /all collections/i })
      await expect(backLink).toBeVisible()

      // Back link works
      await backLink.click()
      await expect(page).toHaveURL('/')
    }
  })

  test('collection page shows artworks with links to detail', async ({ page }) => {
    await page.goto('/')
    const collectionCard = page.locator('a[href^="/collection/"]').first()
    const hasCollections = await collectionCard.isVisible({ timeout: 4000 }).catch(() => false)

    if (hasCollections) {
      await collectionCard.click()
      await expect(page).toHaveURL(/\/collection\//)

      const content = page.locator('article').first()
        .or(page.getByText('No works in this collection'))
      await expect(content).toBeVisible({ timeout: 4000 })

      const artworkLink = page.locator('a[href^="/artwork/"]').first()
      const hasArtworks = await artworkLink.isVisible({ timeout: 3000 }).catch(() => false)
      if (hasArtworks) {
        await artworkLink.click()
        await expect(page).toHaveURL(/\/artwork\//)
      }
    }
  })

  test('Cabinet of Curiosities page has italic title', async ({ page }) => {
    await page.goto('/collection/cabinet-of-curiosities')
    const title = page.locator('h1')
    const notFound = page.getByText('Collection not found')

    const titleVisible = await title.isVisible({ timeout: 4000 }).catch(() => false)
    const notFoundVisible = await notFound.isVisible({ timeout: 1000 }).catch(() => false)

    if (titleVisible && !notFoundVisible) {
      const classes = await title.getAttribute('class')
      expect(classes).toContain('italic')
    }
  })

  test('nonexistent collection shows 404 with return link', async ({ page }) => {
    await page.goto('/collection/this-collection-does-not-exist-12345')
    await expect(page.getByText('Collection not found')).toBeVisible({ timeout: 4000 })
    const returnLink = page.getByRole('link', { name: /return to collections/i })
    await expect(returnLink).toBeVisible()
  })
})

test.describe('filter-by-series', () => {
  test('filter UI shows when series exist', async ({ page }) => {
    await page.goto('/')

    const filterNav = page.locator('nav[aria-label="Filter artworks by series"]')
    const hasFilter = await filterNav.isVisible({ timeout: 4000 }).catch(() => false)

    if (hasFilter) {
      // "All Works" link visible
      const allWorksLink = page.getByRole('link', { name: 'All Works' })
      await expect(allWorksLink).toBeVisible()

      // Active filter has visual indicator
      const classes = await allWorksLink.getAttribute('class')
      expect(classes).toContain('text-[var(--color-gallery-text)]')
    }
  })

  test('clicking series filters and "All Works" resets', async ({ page }) => {
    await page.goto('/')
    const filterNav = page.locator('nav[aria-label="Filter artworks by series"]')
    const hasFilter = await filterNav.isVisible({ timeout: 4000 }).catch(() => false)

    if (hasFilter) {
      const seriesLink = filterNav.locator('a[href*="?series="]').first()
      const hasSeriesLink = await seriesLink.isVisible().catch(() => false)

      if (hasSeriesLink) {
        await seriesLink.click()
        await expect(page).toHaveURL(/\?series=/)

        // Shows filtered content
        const content = page
          .locator('article')
          .first()
          .or(page.getByText('No works to display'))
        await expect(content).toBeVisible({ timeout: 4000 })

        // "All Works" resets filter
        const allWorksLink = page.getByRole('link', { name: 'All Works' })
        await allWorksLink.click()
        await expect(page).toHaveURL('/')
      }
    }
  })
})
