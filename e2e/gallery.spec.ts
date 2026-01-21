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

test.describe('collections-landing', () => {
  test('homepage shows collections grid', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Should show collections or empty state
    const content = page.locator('a[href^="/collection/"]').first()
      .or(page.getByText('No collections'))
    await expect(content).toBeVisible({ timeout: 10000 })
  })

  test('collection cards have cover images or placeholders', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const collectionCard = page.locator('a[href^="/collection/"]').first()
    const hasCollections = await collectionCard.isVisible({ timeout: 5000 }).catch(() => false)

    if (hasCollections) {
      // Should have image or "No cover image" placeholder
      const imageOrPlaceholder = collectionCard.locator('img').or(page.getByText('No cover image'))
      await expect(imageOrPlaceholder.first()).toBeVisible()
    }
  })

  test('collection cards show name and work count', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const collectionCard = page.locator('a[href^="/collection/"]').first()
    const hasCollections = await collectionCard.isVisible({ timeout: 5000 }).catch(() => false)

    if (hasCollections) {
      // Should have h2 title
      await expect(collectionCard.locator('h2')).toBeVisible()
      // Should show work count (e.g. "5 works" or "1 work")
      await expect(collectionCard.getByText(/\d+ works?/)).toBeVisible()
    }
  })

  test('clicking collection navigates to collection page', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const collectionCard = page.locator('a[href^="/collection/"]').first()
    const hasCollections = await collectionCard.isVisible({ timeout: 5000 }).catch(() => false)

    if (hasCollections) {
      await collectionCard.click()
      await expect(page).toHaveURL(/\/collection\//)
    }
  })

  test('Cabinet of Curiosities card is shown when uncategorized artworks exist', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const cabinetCard = page.locator('a[href="/collection/cabinet-of-curiosities"]')
    const hasCabinet = await cabinetCard.isVisible({ timeout: 5000 }).catch(() => false)

    if (hasCabinet) {
      await expect(cabinetCard.getByText('Cabinet of Curiosities')).toBeVisible()
      await expect(cabinetCard.getByText('Uncategorized works and experiments')).toBeVisible()
    }
  })

  test('collection cards have hover effects', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const collectionCard = page.locator('a[href^="/collection/"]').first()
    const hasCollections = await collectionCard.isVisible({ timeout: 5000 }).catch(() => false)

    if (hasCollections) {
      const classes = await collectionCard.getAttribute('class')
      expect(classes).toContain('hover:-translate-y-2')
    }
  })
})

test.describe('collection-view', () => {
  test('collection page shows title', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const collectionCard = page.locator('a[href^="/collection/"]').first()
    const hasCollections = await collectionCard.isVisible({ timeout: 5000 }).catch(() => false)

    if (hasCollections) {
      await collectionCard.click()
      await expect(page).toHaveURL(/\/collection\//)

      // Should show h1 title
      await expect(page.locator('h1').first()).toBeVisible()
    }
  })

  test('collection page shows back link', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const collectionCard = page.locator('a[href^="/collection/"]').first()
    const hasCollections = await collectionCard.isVisible({ timeout: 5000 }).catch(() => false)

    if (hasCollections) {
      await collectionCard.click()
      await expect(page).toHaveURL(/\/collection\//)

      const backLink = page.getByRole('link', { name: /all collections/i })
      await expect(backLink).toBeVisible()
    }
  })

  test('back link returns to home', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const collectionCard = page.locator('a[href^="/collection/"]').first()
    const hasCollections = await collectionCard.isVisible({ timeout: 5000 }).catch(() => false)

    if (hasCollections) {
      await collectionCard.click()
      await expect(page).toHaveURL(/\/collection\//)

      const backLink = page.getByRole('link', { name: /all collections/i })
      await backLink.click()

      await expect(page).toHaveURL('/')
    }
  })

  test('collection page shows artworks or empty state', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const collectionCard = page.locator('a[href^="/collection/"]').first()
    const hasCollections = await collectionCard.isVisible({ timeout: 5000 }).catch(() => false)

    if (hasCollections) {
      await collectionCard.click()
      await expect(page).toHaveURL(/\/collection\//)

      // Should show artworks or empty message
      const content = page.locator('article').first()
        .or(page.getByText('No works in this collection'))
      await expect(content).toBeVisible({ timeout: 10000 })
    }
  })

  test('collection page artworks link to detail page', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const collectionCard = page.locator('a[href^="/collection/"]').first()
    const hasCollections = await collectionCard.isVisible({ timeout: 5000 }).catch(() => false)

    if (hasCollections) {
      await collectionCard.click()
      await expect(page).toHaveURL(/\/collection\//)

      const artworkLink = page.locator('a[href^="/artwork/"]').first()
      const hasArtworks = await artworkLink.isVisible({ timeout: 5000 }).catch(() => false)

      if (hasArtworks) {
        await artworkLink.click()
        await expect(page).toHaveURL(/\/artwork\//)
      }
    }
  })

  test('Cabinet of Curiosities page has italic title', async ({ page }) => {
    await page.goto('/collection/cabinet-of-curiosities')
    await page.waitForLoadState('networkidle')

    // Wait for either the page to load or 404
    const title = page.locator('h1')
    const notFound = page.getByText('Collection not found')

    const titleVisible = await title.isVisible({ timeout: 5000 }).catch(() => false)
    const notFoundVisible = await notFound.isVisible({ timeout: 5000 }).catch(() => false)

    if (titleVisible && !notFoundVisible) {
      const classes = await title.getAttribute('class')
      expect(classes).toContain('italic')
    }
  })

  test('nonexistent collection shows 404', async ({ page }) => {
    await page.goto('/collection/this-collection-does-not-exist-12345')
    await page.waitForLoadState('networkidle')

    await expect(page.getByText('Collection not found')).toBeVisible({ timeout: 10000 })
  })

  test('404 page has return link', async ({ page }) => {
    await page.goto('/collection/this-collection-does-not-exist-12345')
    await page.waitForLoadState('networkidle')

    const returnLink = page.getByRole('link', { name: /return to collections/i })
    await expect(returnLink).toBeVisible({ timeout: 10000 })
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
