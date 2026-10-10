import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/* 图标形变（Icon Morph）回归测试
 * 全程走 file://，与主题既有验收方式（tests/visual.spec.mjs）保持一致，
 * 以此持续守住「无打包器 / 无网络请求 / 可自包含分发」这条底线。 */

const root = path.resolve(import.meta.dirname, '..');
const pageUrl = pathToFileURL(path.join(root, 'preview', 'component-morph-icon.html')).href;

async function open(page, options = {}) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  if (options.reducedMotion) await page.emulateMedia({ reducedMotion: options.reducedMotion });
  await page.goto(pageUrl);
  await page.waitForFunction(
    () => window.XLMorph && document.querySelectorAll('[data-morph-icon] > svg').length > 0
  );
  return errors;
}

function canonical(page, iconName) {
  return page.evaluate((name) => window.MorphIcons.canonicalD(window.lucide[name]), iconName);
}

function dOf(page, selector) {
  return page.evaluate((sel) => document.querySelector(sel).querySelector('path').getAttribute('d'), selector);
}

export function startSampling(page, selector) {
  return page.evaluate((sel) => {
    const pathEl = document.querySelector(sel).querySelector('path');
    window.__morphSamples = [];
    const tick = () => {
      window.__morphSamples.push(pathEl.getAttribute('d'));
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, selector);
}

function distinctSamples(page) {
  return page.evaluate(() => new Set(window.__morphSamples).size);
}

test('file:// 下所有形变图标全部挂载，且无控制台错误', async ({ page }) => {
  const errors = await open(page);
  const stats = await page.evaluate(() => ({
    hosts: document.querySelectorAll('[data-morph-icon]').length,
    mounted: document.querySelectorAll('[data-morph-icon] > svg').length,
    cells: document.querySelectorAll('.grid [data-morph-icon]').length,
    grid: document.querySelectorAll('.grid > .cell').length,
    version: window.XLMorph.version,
    engine: typeof window.MorphIcons.createMorph,
  }));

  expect(stats.hosts).toBeGreaterThanOrEqual(30);
  expect(stats.mounted).toBe(stats.hosts);
  expect(stats.cells).toBe(22);
  expect(stats.grid).toBe(22);
  expect(stats.version).toBe('morphicons@1.7.1');
  expect(stats.engine).toBe('function');
  expect(errors).toEqual([]);
});

test('click 触发：menu 与 x 之间真实补间并精确收敛', async ({ page }) => {
  const errors = await open(page);
  const [menuD, xD] = [await canonical(page, 'Menu'), await canonical(page, 'X')];

  expect(await dOf(page, '#morph-demo-click')).toBe(menuD);

  await startSampling(page, '#morph-demo-click');
  await page.click('#morph-demo-click');
  await page.waitForFunction(
    (target) => document.querySelector('#morph-demo-click path').getAttribute('d') === target,
    xD,
    { timeout: 5000 }
  );

  // 真实形变应当经过多个互不相同的中间形状，而不是瞬间跳变
  expect(await distinctSamples(page)).toBeGreaterThan(4);

  // 再点一次应逐字回到起始图标
  await page.click('#morph-demo-click');
  await page.waitForFunction(
    (target) => document.querySelector('#morph-demo-click path').getAttribute('d') === target,
    menuD,
    { timeout: 5000 }
  );
  expect(errors).toEqual([]);
});

test('hover 触发：悬停进入目标图标，移出回到起始图标', async ({ page }) => {
  const errors = await open(page);
  const [bellD, bellOffD] = [await canonical(page, 'Bell'), await canonical(page, 'BellOff')];

  expect(await dOf(page, '#morph-demo-hover')).toBe(bellD);
  await page.hover('#morph-demo-hover');
  await page.waitForFunction(
    (target) => document.querySelector('#morph-demo-hover path').getAttribute('d') === target,
    bellOffD,
    { timeout: 5000 }
  );
  await page.mouse.move(0, 0);
  await page.waitForFunction(
    (target) => document.querySelector('#morph-demo-hover path').getAttribute('d') === target,
    bellD,
    { timeout: 5000 }
  );
  expect(errors).toEqual([]);
});

test('state 触发：与 aria-pressed 双向同步', async ({ page }) => {
  const errors = await open(page);
  const button = page.locator('#morph-demo-state');
  const [volumeD, mutedD] = [await canonical(page, 'Volume2'), await canonical(page, 'VolumeX')];

  await expect(button).toHaveAttribute('aria-pressed', 'false');
  expect(await dOf(page, '#morph-demo-state')).toBe(volumeD);

  await button.click();
  await expect(button).toHaveAttribute('aria-pressed', 'true');
  await page.waitForFunction(
    (target) => document.querySelector('#morph-demo-state path').getAttribute('d') === target,
    mutedD,
    { timeout: 5000 }
  );

  // 外部直接改属性，形变也要跟上
  await page.evaluate(() => document.querySelector('#morph-demo-state').setAttribute('aria-pressed', 'false'));
  await page.waitForFunction(
    (target) => document.querySelector('#morph-demo-state path').getAttribute('d') === target,
    volumeD,
    { timeout: 5000 }
  );
  expect(errors).toEqual([]);
});

test('白名单：图标全部来自 Lucide v1.8.0，表外配对会被拒绝并告警', async ({ page }) => {
  const errors = await open(page);

  const unknownIcons = await page.evaluate(() => {
    const bad = [];
    Object.entries(window.XLMorph.pairs).forEach(([key, pair]) => {
      ['from', 'to'].forEach((side) => {
        if (!window.lucide[pair[side]]) bad.push(key + '.' + side + '=' + pair[side]);
      });
    });
    return bad;
  });
  expect(unknownIcons).toEqual([]);
  expect(await page.evaluate(() => Object.keys(window.XLMorph.pairs).length)).toBe(22);

  const gridKeys = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.grid [data-morph-icon]')).map((el) => el.getAttribute('data-morph-icon'))
  );
  expect(gridKeys.filter((key) => !gridKeys.includes(key))).toEqual([]);
  expect(new Set(gridKeys).size).toBe(22);

  // sun-moon 是实测会塌陷的组合，必须被拒绝挂载而不是悄悄渲染
  const rejected = await page.evaluate(() => {
    const host = document.createElement('span');
    host.setAttribute('data-morph-icon', 'sun-moon');
    document.body.appendChild(host);
    const warnings = [];
    const original = console.warn;
    console.warn = (...args) => warnings.push(args.join(' '));
    window.XLMorph.refresh();
    console.warn = original;
    const result = { mounted: host.querySelectorAll('svg').length, warned: warnings.length };
    host.remove();
    return result;
  });
  expect(rejected.mounted).toBe(0);
  expect(rejected.warned).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test('prefers-reduced-motion: reduce 时立即跳到目标，不播放补间', async ({ page }) => {
  const errors = await open(page, { reducedMotion: 'reduce' });
  const xD = await canonical(page, 'X');

  await startSampling(page, '#morph-demo-click');
  await page.click('#morph-demo-click');
  await page.waitForFunction(
    (target) => document.querySelector('#morph-demo-click path').getAttribute('d') === target,
    xD,
    { timeout: 5000 }
  );
  await page.waitForTimeout(300);
  expect(await distinctSamples(page)).toBeLessThanOrEqual(2);
  expect(errors).toEqual([]);
});

test('data-motion="off" 时立即跳到目标，且切换后无需重载页面', async ({ page }) => {
  const errors = await open(page);
  const xD = await canonical(page, 'X');

  await page.evaluate(() => document.documentElement.setAttribute('data-motion', 'off'));
  await startSampling(page, '#morph-demo-click');
  await page.click('#morph-demo-click');
  await page.waitForFunction(
    (target) => document.querySelector('#morph-demo-click path').getAttribute('d') === target,
    xD,
    { timeout: 5000 }
  );
  await page.waitForTimeout(300);
  expect(await distinctSamples(page)).toBeLessThanOrEqual(2);
  expect(errors).toEqual([]);
});
