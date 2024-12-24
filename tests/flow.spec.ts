import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const testUserEmail = process.env.TEST_USER_EMAIL!
const testUserPassword = process.env.TEST_USER_PASSWORD!

test.describe('Application Flow', () => {
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  test.beforeEach(async ({ page }) => {
    // Clear any existing sessions
    await supabase.auth.signOut()

    // Navigate to login page and wait for it to be ready
    await page.goto('http://localhost:3000/login')
    await page.waitForLoadState('networkidle')
  })

  test('should complete survey flow', async ({ page }) => {
    await test.step('Login', async () => {
      await page.getByPlaceholder('Email').fill(testUserEmail)
      await page.getByPlaceholder('Password').fill(testUserPassword)
      await page.getByRole('button', { name: 'Login' }).click()
      await expect(page).toHaveURL('http://localhost:3000/dashboard', { timeout: 10000 })
      await page.waitForLoadState('networkidle')
    })

    await test.step('Start Survey', async () => {
      await page.getByRole('button', { name: 'Generate New Toolkit' }).click()
      await expect(page).toHaveURL('http://localhost:3000/survey/1', { timeout: 10000 })
      await page.waitForLoadState('networkidle')
    })

    await test.step('Complete Survey', async () => {
      // Wait for the form to be ready
      await page.waitForSelector('textarea[placeholder*="SaaS tool"]', { timeout: 10000 })

      // Fill the first question
      await page.locator('textarea').fill('Test Product')
      await page.getByRole('button', { name: 'Next' }).click()

      // Verify we moved to the next question
      await expect(page).toHaveURL('http://localhost:3000/survey/2', { timeout: 10000 })
      await page.waitForLoadState('networkidle')
    })
  })

  test('should generate and verify assets', async ({ page }) => {
    await test.step('Login', async () => {
      await page.getByPlaceholder('Email').fill(testUserEmail)
      await page.getByPlaceholder('Password').fill(testUserPassword)
      await page.getByRole('button', { name: 'Login' }).click()
      await expect(page).toHaveURL('http://localhost:3000/dashboard', { timeout: 10000 })
      await page.waitForLoadState('networkidle')
    })

    await test.step('Generate Business Plan', async () => {
      // Wait for the dashboard to be fully loaded
      await page.waitForSelector('text=Business Plan', { timeout: 10000 })
      await page.getByRole('button', { name: 'Generate' }).first().click()

      // Wait for generation to complete and view button to appear
      await page.waitForSelector('text=View', { timeout: 120000 })

      // Verify business plan exists
      const businessPlanExists = await page.getByText('Business Plan').isVisible()
      expect(businessPlanExists).toBeTruthy()
    })

    await test.step('Generate Roadmap', async () => {
      // Generate roadmap
      await page.getByRole('button', { name: 'Generate' }).last().click()

      // Wait for generation to complete
      await page.waitForSelector('text=View', { timeout: 120000 })

      // Verify roadmap exists
      const roadmapExists = await page.getByText('Launch Roadmap').isVisible()
      expect(roadmapExists).toBeTruthy()
    })

    await test.step('View and Download Assets', async () => {
      const viewButton = page.getByRole('link', { name: 'View' }).first()
      await viewButton.click()
      const newPage = await page.context().waitForEvent('page', { timeout: 10000 })
      await newPage.waitForLoadState('networkidle')
      await newPage.close()

      const downloadPromise = page.waitForEvent('download', { timeout: 10000 })
      await page.getByRole('button', { name: 'Download' }).first().click()
      const download = await downloadPromise
      expect(download.suggestedFilename()).toContain('business-plan')
    })
  })
})
