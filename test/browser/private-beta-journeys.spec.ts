import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const memberId = '00000000-0000-4000-8000-000000000015';
const jwt = [
  Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url'),
  Buffer.from(JSON.stringify({ sub: memberId, role: 'authenticated', exp: 4_102_444_800 })).toString('base64url'),
  'e2e-signature',
].join('.');

interface BackendState {
  online: boolean;
  memberStateWrites?: unknown[];
}

async function mockPrivateMemberBackend(page: Page, backend: BackendState) {
  await page.route('**/*', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (!url.pathname.startsWith('/e2e-supabase/')) {
      await route.continue();
      return;
    }
    if (!backend.online) {
      await route.abort('internetdisconnected');
      return;
    }
    const corsHeaders = {
      'access-control-allow-origin': '*',
      'access-control-allow-headers': 'authorization, apikey, content-type, x-client-info',
      'access-control-allow-methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    };
    if (request.method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: corsHeaders });
      return;
    }
    if (url.pathname.endsWith('/auth/v1/token')) {
      await route.fulfill({
        headers: corsHeaders,
        json: {
          access_token: jwt,
          refresh_token: 'e2e-refresh-token',
          expires_in: 3600,
          expires_at: 4_102_444_800,
          token_type: 'bearer',
          user: { id: memberId, aud: 'authenticated', role: 'authenticated', email: 'member@example.com' },
        },
      });
      return;
    }
    if (url.pathname.endsWith('/auth/v1/user')) {
      await route.fulfill({ headers: corsHeaders, json: { id: memberId, aud: 'authenticated', role: 'authenticated', email: 'member@example.com' } });
      return;
    }
    if (url.pathname.includes('/rest/v1/rpc/assert_authorized_member')) {
      await route.fulfill({ headers: corsHeaders, json: null });
      return;
    }
    if (url.pathname.includes('/rest/v1/member_state') && request.method() === 'GET') {
      await route.fulfill({ headers: corsHeaders, json: [] });
      return;
    }
    if (url.pathname.includes('/rest/v1/member_state')) {
      backend.memberStateWrites ??= [];
      const payload = request.postDataJSON();
      backend.memberStateWrites.push(payload);
      await route.fulfill({ headers: corsHeaders, json: payload });
      return;
    }
    await route.fulfill({ headers: corsHeaders, json: [] });
  });
}

async function signInPrivateMember(page: Page, backend: BackendState = { online: true }) {
  page.on('pageerror', (error) => console.error(`Browser page error: ${error.message}`));
  await mockPrivateMemberBackend(page, backend);
  const response = await page.goto('/barely-fit/');
  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'Your training stays private.' })).toBeVisible();
  await expect(page.getByText('No public signup')).toBeVisible();
  await page.getByLabel('Email').fill('member@example.com');
  await page.getByLabel('Password').fill('private-password');
  await page.getByRole('button', { name: 'Sign in privately' }).click();
  await expect(page.getByRole('heading', { name: 'Today', exact: true })).toBeVisible({ timeout: 15_000 });
}

test('private Member can traverse every primary beta journey', async ({ page }) => {
  await signInPrivateMember(page);

  const journeys = [
    ['Today', 'Today'],
    ['Schedule', 'Workout Schedule'],
    ['History', 'Workout History'],
    ['Progress', 'Progress'],
    ['Settings', 'Settings'],
  ] as const;
  for (const [destination, heading] of journeys) {
    await page.getByRole('link', { name: destination, exact: true }).click();
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
  }

  const bodyWidth = await page.locator('body').evaluate((body) => body.scrollWidth);
  const viewportWidth = await page.evaluate(() => document.documentElement.clientWidth);
  expect(bodyWidth).toBeLessThanOrEqual(viewportWidth);

  await page.waitForTimeout(300);
  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);
});

test('private Member can plan a recurring week', async ({ page }) => {
  await signInPrivateMember(page);
  await page.getByRole('link', { name: 'Schedule', exact: true }).click();
  await page.getByRole('button', { name: 'Plan workout' }).click();
  await expect(page.getByRole('heading', { name: 'Plan a workout' })).toBeVisible();
  await page.getByLabel('Repeat weekly').check();
  await page.getByRole('button', { name: 'Add to Workout Schedule' }).click();
  await page.getByRole('button', { name: 'Next week' }).click();
  await expect(page.getByRole('button', { name: /Heavy Legs.*Repeats weekly/ }).first()).toBeVisible();
});

test('offline Active Workout survives PWA reopen and synchronizes into History and Progress', async ({ page, context, browserName }) => {
  test.skip(browserName !== 'chromium', 'Playwright service-worker automation is Chromium-only.');
  const backend: BackendState = { online: true, memberStateWrites: [] };
  await signInPrivateMember(page, backend);
  await page.getByRole('button', { name: 'Resume workout' }).click();
  await expect(page.getByRole('heading', { name: 'Upper Strength B' })).toBeVisible();
  await expect.poll(() => page.evaluate(async () => (
    (await navigator.serviceWorker.getRegistrations()).some((registration) => registration.active)
  ))).toBe(true);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);

  backend.online = false;
  await page.evaluate(() => window.dispatchEvent(new Event('offline')));
  await expect(page.getByText('Offline.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Complete Set' }).first().click();
  await expect(page.getByRole('button', { name: /Rest timer/ })).toBeVisible();
  await expect(page.getByText('Saved locally.', { exact: true })).toBeVisible();

  const reopenedPage = await context.newPage();
  const serviceWorkerResponses: string[] = [];
  reopenedPage.on('response', (response) => {
    if (response.fromServiceWorker()) serviceWorkerResponses.push(response.url());
  });
  await mockPrivateMemberBackend(reopenedPage, backend);
  await reopenedPage.goto('/barely-fit/workout/active');
  await expect(reopenedPage.getByText('Recovered workout.', { exact: true })).toBeVisible({ timeout: 15_000 });
  await expect(reopenedPage.getByText('Upper Strength B', { exact: true }).first()).toBeVisible();
  await expect(reopenedPage.getByText('Saved', { exact: true }).first()).toBeVisible();
  expect(serviceWorkerResponses.some((url) => url.includes('/assets/'))).toBe(true);

  backend.online = true;
  await reopenedPage.evaluate(() => window.dispatchEvent(new Event('online')));
  await expect(reopenedPage.getByText('Saved', { exact: true }).first()).toBeVisible();
  await expect.poll(() => backend.memberStateWrites?.length ?? 0).toBeGreaterThan(0);
  await reopenedPage.getByRole('button', { name: 'Finish', exact: true }).click();
  await reopenedPage.getByRole('button', { name: 'Finish and save' }).click();
  await expect(reopenedPage.getByRole('heading', { name: 'Workout History' })).toBeVisible();
  await expect(reopenedPage.getByRole('heading', { name: 'Upper Strength B' }).first()).toBeVisible();

  await reopenedPage.getByRole('link', { name: 'Progress', exact: true }).click();
  await expect(reopenedPage.getByRole('heading', { name: 'Progress' })).toBeVisible();
  await expect(reopenedPage.getByText('Working Sets build Progress')).toBeVisible();
});
