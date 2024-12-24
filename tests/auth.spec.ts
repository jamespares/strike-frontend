import { test, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const testUserEmail = process.env.TEST_USER_EMAIL!
const testUserPassword = process.env.TEST_USER_PASSWORD!

test.describe('Authentication Flow', () => {
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  test.beforeEach(async ({ page }) => {
    // Clear any existing sessions
    await supabase.auth.signOut()

    // Navigate to login page and wait for it to be ready
    await page.goto('http://localhost:3000/login')
    await page.waitForLoadState('networkidle')

    // Log network requests and responses
    page.on('request', request => {
      if (request.url().includes('/auth/v1/')) {
        console.log(`\nAuth Request: ${request.method()} ${request.url()}`)
        console.log('Headers:', request.headers())
        console.log('Post Data:', request.postData())
      }
    })

    page.on('response', async response => {
      if (response.url().includes('/auth/v1/')) {
        console.log(`\nAuth Response: ${response.status()} ${response.url()}`)
        try {
          const body = await response.json()
          console.log('Response Body:', body)
        } catch (e) {
          console.log('Could not parse response body')
        }
      }
    })
  })

  test('should allow new user registration', async ({ page }) => {
    // Click sign up link and wait for navigation
    const signUpLink = page.getByRole('link', { name: 'Sign up' })
    await expect(signUpLink).toBeVisible()
    await signUpLink.click()
    await expect(page).toHaveURL('http://localhost:3000/signup')
    await page.waitForLoadState('networkidle')

    // Fill registration form
    await page.getByPlaceholder('Email').fill(testUserEmail)
    await page.getByPlaceholder('Password').fill(testUserPassword)

    // Submit form and wait for auth request
    const signUpPromise = page.waitForResponse(
      response => response.url().includes('/auth/v1/signup'),
      { timeout: 10000 }
    )
    await page.getByRole('button', { name: 'Sign Up', exact: true }).click()
    const signUpResponse = await signUpPromise
    console.log('Sign up response status:', signUpResponse.status())

    // Verify successful signup
    expect(signUpResponse.status()).toBe(200)

    // Verify we stay on signup page or are redirected to a confirmation page
    const currentUrl = page.url()
    expect(currentUrl).toMatch(/signup|confirm|verify/)
  })

  test('should allow existing user login', async ({ page }) => {
    // Fill login form
    await page.getByPlaceholder('Email').fill(testUserEmail)
    await page.getByPlaceholder('Password').fill(testUserPassword)
    await page.getByRole('button', { name: 'Login' }).click()

    // Verify successful login
    await expect(page).toHaveURL('http://localhost:3000/dashboard', { timeout: 10000 })

    // Verify session exists
    const {
      data: { session },
    } = await supabase.auth.getSession()
    expect(session).not.toBeNull()
    expect(session?.user?.email).toBe(testUserEmail)
  })

  test('should handle invalid login credentials', async ({ page }) => {
    // Fill login form with invalid credentials
    await page.getByPlaceholder('Email').fill('invalid@example.com')
    await page.getByPlaceholder('Password').fill('wrongpassword')

    // Submit form
    await page.getByRole('button', { name: 'Login' }).click()

    // Verify error message appears
    await expect(page.getByText('Invalid login credentials')).toBeVisible({ timeout: 10000 })

    // Verify we stay on login page
    await expect(page).toHaveURL('http://localhost:3000/login')
  })

  test('should handle Google OAuth signup/login', async ({ page }) => {
    // Click Google sign in button
    const googleButton = page.getByRole('button', { name: /Sign in with Google/i })
    await expect(googleButton).toBeVisible()

    // Get the button's onclick handler URL
    const onClick = await googleButton.evaluate(el => (el as HTMLButtonElement).onclick?.toString())
    expect(onClick).toBeTruthy()
  })

  test('should allow user logout', async ({ page }) => {
    // First login
    await page.getByPlaceholder('Email').fill(testUserEmail)
    await page.getByPlaceholder('Password').fill(testUserPassword)
    await page.getByRole('button', { name: 'Login' }).click()

    // Wait for dashboard and navigation
    await expect(page).toHaveURL('http://localhost:3000/dashboard', { timeout: 10000 })
    await page.waitForLoadState('networkidle')

    // Find and click logout button (using a more specific selector)
    const logoutButton = page.getByRole('button', { name: /logout|sign out|log out/i })
    await expect(logoutButton).toBeVisible({ timeout: 5000 })
    await logoutButton.click()

    // Verify redirect to home page
    await expect(page).toHaveURL('http://localhost:3000/', { timeout: 5000 })

    // Verify session is cleared
    const {
      data: { session },
    } = await supabase.auth.getSession()
    expect(session).toBeNull()
  })
})
