import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { surveyQuestions } from '../data/surveyQuestions'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Use your actual email for testing
const testUserEmail = process.env.NEXT_PUBLIC_TEST_EMAIL || 'jamesedpares@gmail.com'
const testUserPassword = process.env.NEXT_PUBLIC_TEST_PASSWORD || 'testuser123'

const TEST_RESPONSES = {
  product:
    "I'm building a SaaS tool that helps freelancers automate their time tracking and expense management. It uses Next.js for the frontend and Stripe for payments. The goal is to help freelancers save 5+ hours per month on admin work.",
  motivation:
    "Freelancers waste 5+ hours per month on manual time tracking and expense management. Current solutions are complex and disconnected, requiring them to juggle multiple tools. I've experienced this pain firsthand and believe there's a big opportunity to solve it.",
  progress:
    "I've created wireframes in Figma and validated the idea with 10 potential customers. I've also started learning Next.js and have a basic landing page set up. Two freelancers have offered to be beta testers.",
  challenges:
    'The payment integration is complex and might take longer than planned. I also have limited experience with Next.js, which could slow down development. Finding early adopters willing to switch from their current tools could be challenging.',
  deadline: '01/03/2025',
  budget: '$500',
}

test.describe('Application Flow', () => {
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  let userId: string

  test.beforeEach(async ({ page }) => {
    console.log('Starting test with user:', testUserEmail)

    // Clear any existing sessions
    await supabase.auth.signOut()
    console.log('Cleared existing sessions')

    // Navigate to login page and wait for it to be ready
    await page.goto('http://localhost:3000/login')
    await page.waitForLoadState('networkidle')
    console.log('Navigated to login page')
  })

  test('should complete full survey flow and generate business plan', async ({ page }) => {
    await test.step('Login', async () => {
      console.log('Attempting login...')
      await page.getByPlaceholder('Email').fill(testUserEmail)
      await page.getByPlaceholder('Password').fill(testUserPassword)
      await page.getByRole('button', { name: 'Login' }).click()
      await expect(page).toHaveURL('http://localhost:3000/dashboard', { timeout: 10000 })
      await page.waitForLoadState('networkidle')

      // Get user ID for database checks
      const {
        data: { user },
      } = await supabase.auth.getUser()
      userId = user!.id
      console.log('Successfully logged in. User ID:', userId)
    })

    await test.step('Start Survey', async () => {
      console.log('Starting survey...')
      await page.getByRole('button', { name: 'Generate New Plan' }).click()
      await expect(page).toHaveURL('http://localhost:3000/survey/1', { timeout: 10000 })
      await page.waitForLoadState('networkidle')
      console.log('Navigated to first survey question')
    })

    await test.step('Complete All Survey Questions', async () => {
      for (const question of surveyQuestions) {
        console.log(`Answering question ${question.id}: ${question.fieldName}`)

        // Wait for the form to be ready
        await page.waitForSelector('textarea', { timeout: 10000 })

        // Fill the current question
        const answer = TEST_RESPONSES[question.fieldName as keyof typeof TEST_RESPONSES]
        await page.locator('textarea').fill(answer)
        console.log('Filled answer:', answer.substring(0, 50) + '...')

        // Click continue
        await page.getByRole('button', { name: /Continue|Complete/ }).click()

        // If this is the last question, we should go to payment
        if (question.id === surveyQuestions.length) {
          await expect(page).toHaveURL('http://localhost:3000/payment', { timeout: 10000 })
          console.log('Completed survey, navigated to payment')
        } else {
          await expect(page).toHaveURL(`http://localhost:3000/survey/${question.id + 1}`, {
            timeout: 10000,
          })
          console.log(`Moved to question ${question.id + 1}`)
        }

        await page.waitForLoadState('networkidle')

        // Verify database entry after each submission
        const { data: responses, error } = await supabase
          .from('survey_responses')
          .select('*')
          .eq('user_id', userId)
          .eq('is_latest', true)
          .single()

        if (error) {
          console.error('Error checking survey response:', error)
        } else {
          console.log('Verified database entry for', question.fieldName)
        }

        expect(error).toBeNull()
        expect(responses).not.toBeNull()
        expect(responses![question.fieldName]).toBe(answer)
      }
    })

    await test.step('Complete Payment', async () => {
      console.log('Starting payment process...')
      // Fill test card details
      await page
        .frameLocator('iframe[name*="card"]')
        .getByPlaceholder('Card number')
        .fill('4242424242424242')
      await page.frameLocator('iframe[name*="exp-date"]').getByPlaceholder('MM / YY').fill('1234')
      await page.frameLocator('iframe[name*="cvc"]').getByPlaceholder('CVC').fill('123')

      await page.getByRole('button', { name: /Pay/ }).click()
      console.log('Submitted payment form')

      // Wait for redirect to success page
      await expect(page).toHaveURL('http://localhost:3000/payment/success', { timeout: 20000 })
      await page.waitForLoadState('networkidle')
      console.log('Reached payment success page')
    })

    await test.step('Verify Business Plan Generation', async () => {
      console.log('Waiting for business plan generation...')
      // Should redirect to dashboard after successful payment
      await expect(page).toHaveURL('http://localhost:3000/dashboard', { timeout: 60000 })

      // Wait for business plan to be generated
      await page.waitForSelector('text=View', { timeout: 120000 })
      console.log('Found View button, checking database...')

      // Verify business plan exists in database
      const { data: assets, error } = await supabase
        .from('user_assets')
        .select('*')
        .eq('user_id', userId)
        .eq('asset_type', 'business_plan')
        .eq('status', 'completed')
        .single()

      if (error) {
        console.error('Error checking business plan:', error)
      } else {
        console.log('Business plan generated successfully')
      }

      expect(error).toBeNull()
      expect(assets).not.toBeNull()
      expect(assets!.content).not.toBeNull()
      expect(assets!.file_path).not.toBeNull()
    })
  })
})
