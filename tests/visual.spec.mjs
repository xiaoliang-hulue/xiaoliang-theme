import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = path.resolve(import.meta.dirname, '..');
const fileUrl = (...parts) => pathToFileURL(path.join(root, ...parts)).href;

function durationToMs(value) {
  const amount = Number.parseFloat(value);
  return value.trim().endsWith('ms') ? amount : amount * 1000;
}

async function computedTimes(locator, property) {
  return locator.evaluate((element, cssProperty) => {
    return getComputedStyle(element)[cssProperty].split(',').map((part) => part.trim());
  }, property);
}

test('core previews have no horizontal overflow at desktop and mobile widths', async ({ page }) => {
  const pages = [
    'component-button.html',
    'component-card.html',
    'component-table.html',
    'page-dashboard.html',
    'page-list.html',
    'page-form.html',
    'page-detail.html',
  ];

  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    for (const name of pages) {
      await page.goto(fileUrl('preview', name));
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      const offenders = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('*'))
          .map((element) => {
            const rect = element.getBoundingClientRect();
            return { tag: element.tagName, cls: element.className, left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width) };
          })
          .filter((item) => item.left < -1 || item.right > window.innerWidth + 1)
          .slice(0, 8);
      });
      expect(overflow, `${name} overflow at ${viewport.width}px: ${JSON.stringify(offenders)}`).toBeLessThanOrEqual(1);
    }
  }
});

test('theme and motion controls switch visible states without reload', async ({ page }) => {
  await page.goto(fileUrl('preview', 'index.html'));
  const root = page.locator('html');
  const body = page.locator('body');

  const lightBackground = await body.evaluate((element) => getComputedStyle(element).backgroundColor);
  await page.getByRole('button', { name: '切换深色' }).click();
  await expect(root).toHaveAttribute('data-theme', 'dark');
  expect(await body.evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe(lightBackground);

  await page.getByRole('button', { name: '轻柔' }).click();
  await expect(root).toHaveAttribute('data-motion', 'subtle');
  await page.getByRole('button', { name: '关闭' }).click();
  await expect(root).toHaveAttribute('data-motion', 'off');
});

test('full motion is active and off mode removes delays', async ({ page }) => {
  await page.goto(fileUrl('preview', 'component-button.html'));
  const button = page.locator('.btn-primary').first();
  const fullDurations = await computedTimes(button, 'transitionDuration');
  expect(fullDurations.some((value) => durationToMs(value) > 10)).toBeTruthy();

  await page.locator('html').evaluate((element) => element.setAttribute('data-motion', 'off'));
  const offDurations = await computedTimes(button, 'transitionDuration');
  const offDelays = await computedTimes(button, 'transitionDelay');
  expect(offDurations.every((value) => durationToMs(value) <= 0.01)).toBeTruthy();
  expect(offDelays.every((value) => durationToMs(value) <= 0.01)).toBeTruthy();
});

test('modal, drawer and toast exit cleanly', async ({ page }) => {
  await page.goto(fileUrl('preview', 'component-modal.html'));
  await page.locator('[data-modal-open]').click();
  await expect(page.locator('#demo-modal')).toBeVisible();
  expect(await page.locator('body').evaluate((body) => body.style.overflow)).toBe('hidden');
  await page.locator('[data-modal-close]').first().click();
  await expect(page.locator('#demo-modal')).toBeHidden({ timeout: 1000 });
  expect(await page.locator('body').evaluate((body) => body.style.overflow)).toBe('');

  await page.goto(fileUrl('preview', 'component-drawer.html'));
  await page.getByRole('button', { name: '右侧抽屉' }).click();
  await expect(page.locator('#drawer-right')).toBeVisible();
  await page.locator('#drawer-right [data-drawer-close]').first().click();
  await expect(page.locator('#drawer-right')).toBeHidden({ timeout: 1000 });

  await page.goto(fileUrl('preview', 'component-toast.html'));
  await expect(page.locator('.toast').first()).toBeVisible();
});

test('tabs and accordion remain keyboard and state accessible', async ({ page }) => {
  await page.goto(fileUrl('preview', 'component-tabs.html'));
  const firstTab = page.getByRole('tab', { name: '概览' });
  await firstTab.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: '详情' })).toHaveAttribute('aria-selected', 'true');

  await page.goto(fileUrl('preview', 'component-accordion.html'));
  const secondSummary = page.locator('summary').nth(1);
  await secondSummary.click();
  await expect(page.locator('details').nth(1)).toHaveAttribute('open', '');
  await secondSummary.click();
  await expect(page.locator('details').nth(1)).not.toHaveAttribute('open', '', { timeout: 1000 });
});

test('reduced motion closes overlays immediately', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(fileUrl('preview', 'component-modal.html'));
  await page.locator('[data-modal-open]').click();
  const start = Date.now();
  await page.locator('[data-modal-close]').first().click();
  await expect(page.locator('#demo-modal')).toBeHidden({ timeout: 100 });
  expect(Date.now() - start).toBeLessThan(250);
});
