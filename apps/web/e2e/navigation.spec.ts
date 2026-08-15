import { test, expect, Page } from '@playwright/test';

async function login(page: Page) {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 15000 });
}

test.describe('Dashboard navigation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test.describe('Quick Actions cards', () => {
    const cases: Array<[string, RegExp]> = [
      ['Browse Jobs', /\/dashboard\/jobs/],
      ['Upload Resume', /\/dashboard\/resumes/],
      ['Generate Cover Letter', /\/dashboard\/cover-letters/],
      ['Practice Interview', /\/dashboard\/interview-coach/],
    ];

    for (const [label, url] of cases) {
      test(`${label} navigates to ${url}`, async ({ page }) => {
        await page.getByText(label, { exact: true }).click();
        await page.waitForURL(url, { timeout: 10000 });
        await expect(page).toHaveURL(url);
      });
    }
  });

  test.describe('Stat cards', () => {
    const cases: Array<[string, RegExp]> = [
      ['Job Applications', /\/dashboard\/jobs/],
      ['Resumes', /\/dashboard\/resumes/],
      ['Cover Letters', /\/dashboard\/cover-letters/],
      ['Interview Questions', /\/dashboard\/interview-coach/],
    ];

    for (const [label, url] of cases) {
      test(`${label} stat card navigates to ${url}`, async ({ page }) => {
        await page.locator('main').getByText(label, { exact: true }).click();
        await page.waitForURL(url, { timeout: 10000 });
        await expect(page).toHaveURL(url);
      });
    }
  });

  test.describe('Sidebar links', () => {
    const cases: Array<[string, RegExp]> = [
      ['Dashboard', /\/dashboard$/],
      ['Jobs', /\/dashboard\/jobs/],
      ['Resumes', /\/dashboard\/resumes/],
      ['Cover Letters', /\/dashboard\/cover-letters/],
      ['Interviews', /\/dashboard\/interviews/],
      ['Interview Coach', /\/dashboard\/interview-coach/],
      ['Skills', /\/dashboard\/skills/],
      ['LinkedIn', /\/dashboard\/linkedin/],
      ['French Coach', /\/dashboard\/french/],
      ['Job Scraper', /\/dashboard\/scraper/],
      ['Analytics', /\/dashboard\/analytics/],
      ['Settings', /\/dashboard\/settings/],
    ];

    for (const [label, url] of cases) {
      test(`sidebar ${label} navigates to ${url}`, async ({ page }) => {
        await page.getByRole('navigation').getByRole('link', { name: label }).click();
        await page.waitForURL(url, { timeout: 10000 });
        await expect(page).toHaveURL(url);
      });
    }
  });

  test('Practice Interview does not land on Skills', async ({ page }) => {
    await page.getByText('Practice Interview', { exact: true }).click();
    await page.waitForURL(/\/dashboard\/interview-coach/, { timeout: 10000 });
    await expect(page).not.toHaveURL(/\/dashboard\/skills/);
  });
});

test.describe('Page rendering', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  const cases: Array<[string, RegExp, string]> = [
    ['/dashboard/jobs', /\/dashboard\/jobs/, 'Job Applications'],
    ['/dashboard/resumes', /\/dashboard\/resumes/, 'Resumes'],
    ['/dashboard/cover-letters', /\/dashboard\/cover-letters/, 'Cover Letters'],
    ['/dashboard/interviews', /\/dashboard\/interviews/, 'Interviews'],
    ['/dashboard/skills', /\/dashboard\/skills/, 'Skills Analysis'],
    ['/dashboard/scraper', /\/dashboard\/scraper/, 'Job Scraper'],
    ['/dashboard/analytics', /\/dashboard\/analytics/, 'Analytics'],
    ['/dashboard/settings', /\/dashboard\/settings/, 'Settings'],
  ];

  for (const [path, url, heading] of cases) {
    test(`${heading} page loads`, async ({ page }) => {
      await page.goto(path);
      await page.waitForURL(url, { timeout: 15000 });
      await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible({ timeout: 15000 });
    });
  }

  test('Interview Coach page loads without errors', async ({ page }) => {
    await page.goto('/dashboard/interview-coach');
    await page.waitForURL(/\/dashboard\/interview-coach/, { timeout: 10000 });
    await expect(page.getByText('New Practice Session')).toBeVisible();
  });

  test('French Coach page loads', async ({ page }) => {
    await page.goto('/dashboard/french');
    await page.waitForURL(/\/dashboard\/french/, { timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'French Coach' })).toBeVisible();
  });
});
