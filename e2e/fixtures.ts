import { test as base } from '@playwright/test'

export const test = base.extend<{}, { adminToken: string }>({
  adminToken: [async ({ browser }, use) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.goto('/admin')
    await page.fill('input[type="password"]', 'admin')
    await page.click('button[type="submit"]')
    await page.getByRole('button', { name: 'Logout' }).waitFor()
    const token = await page.evaluate(() => sessionStorage.getItem('gallery_admin_token'))
    await context.close()
    await use(token!)
  }, { scope: 'worker' }],
})

export { expect } from '@playwright/test'
