import { expect, test } from '@playwright/test';

function uniqueEmail(): string {
  return `e2e_${Date.now()}_${Math.floor(Math.random() * 1e6)}@example.com`;
}

test('register, then log in and reach the dashboard', async ({ page }) => {
  const email = uniqueEmail();
  const password = 'Password1';

  await page.goto('/auth/register');
  await page.getByLabel('Full name').fill('E2E Teacher');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByLabel('Confirm password').fill(password);
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Create account' }).click();

  await expect(page).toHaveURL(/\/auth\/login/);

  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Log in', exact: true }).click();

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole('heading', { name: /Welcome/ })).toBeVisible();
});

test('password reset request shows a confirmation message', async ({ page }) => {
  await page.goto('/auth/reset-password');
  await page.getByLabel('Email').fill(uniqueEmail());
  await page.getByRole('button', { name: 'Send reset link' }).click();
  await expect(page.getByText('Check your email')).toBeVisible();
});

test('login page offers Google sign-in', async ({ page }) => {
  await page.goto('/auth/login');
  await expect(page.getByRole('button', { name: /Google/ })).toBeVisible();
});

test('protected route redirects to login when unauthenticated', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/auth\/login/);
});
