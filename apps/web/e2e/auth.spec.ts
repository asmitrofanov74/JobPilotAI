import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('login page loads with demo credentials', async ({ page }) => {
    await expect(page.getByText('Welcome back')).toBeVisible();
    await expect(page.getByText('Sign in to your account')).toBeVisible();
    await expect(page.getByText('demo@jobpilot.ai')).toBeVisible();
    await expect(page.getByLabel('Email')).toHaveValue('demo@jobpilot.ai');
    await expect(page.getByLabel('Password')).toHaveValue('demo1234');
  });

  test('shows error for invalid credentials', async ({ page }) => {
    await page.getByLabel('Email').fill('wrong@email.com');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByText('Invalid credentials')).toBeVisible();
  });

  test('successful login redirects to dashboard', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByRole('banner').getByText('Demo User')).toBeVisible();
  });

  test('password visibility toggle works', async ({ page }) => {
    const passwordInput = page.getByLabel('Password');
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await page.getByRole('button', { name: '' }).first().click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
  });
});

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
  });

  test('dashboard shows user info in header', async ({ page }) => {
    await expect(page.getByRole('banner').getByText('Demo User')).toBeVisible();
    await expect(page.getByRole('banner').getByText('demo@jobpilot.ai')).toBeVisible();
  });

  test('navigation links are visible in sidebar', async ({ page }) => {
    const nav = page.getByRole('navigation');
    await expect(nav.getByRole('link', { name: 'Jobs' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Resumes' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Cover Letters' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Interviews' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Skills' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Analytics' })).toBeVisible();
    await expect(nav.getByRole('link', { name: 'Settings' })).toBeVisible();
  });

  test('sign out works', async ({ page }) => {
    await page.getByTitle('Sign out').click();
    await page.waitForURL('/login', { timeout: 5000 });
    await expect(page.getByText('Welcome back')).toBeVisible();
  });

  test('settings page loads', async ({ page }) => {
    await page.getByRole('link', { name: 'Settings' }).click();
    await page.waitForURL(/\/dashboard\/settings/, { timeout: 5000 });
    await expect(page.getByText('Manage your profile')).toBeVisible();
  });
});
