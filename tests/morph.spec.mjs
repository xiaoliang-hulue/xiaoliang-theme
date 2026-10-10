import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/* 图标形变（Icon Morph）回归测试
 * 全程走 file://，与主题既有验收方式（tests/visual.spec.mjs）保持一致，
 * 以此持续守住「无打包器 / 无网络请求 / 可自包含分发」这条底线。 */

const root = path.resolve(import.meta.dirname, '..');
const pageUrl = pathToFileURL(path.join(root, 'preview', 'component-morph-icon.html')).href;

/* 白名单配对数。**改动白名单时必须同步这里**，否则下面的断言会在「注册表 / 预览页
 * 格子 / 网格」三者数量不一致时报错——这正是这道守卫的用途：
 * 2026-10-10 开放 copy-check 后由 22 改为 23。 */
const WHITELIST_SIZE = 23;

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
  expect(stats.cells).toBe(WHITELIST_SIZE);
  expect(stats.grid).toBe(WHITELIST_SIZE);
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
  expect(await page.evaluate(() => Object.keys(window.XLMorph.pairs).length)).toBe(WHITELIST_SIZE);

  const gridKeys = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.grid [data-morph-icon]')).map((el) => el.getAttribute('data-morph-icon'))
  );
  expect(gridKeys.filter((key) => !gridKeys.includes(key))).toEqual([]);
  expect(new Set(gridKeys).size).toBe(WHITELIST_SIZE);

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

/* ===== 换图标过渡（Icon Swap）=====
   与形变共用 Lucide / 触发器 / 无障碍基建，但走的是「换 SVG」而非「补间 path」。 */

test('swap: 全部换图标元素挂载出多子路径 SVG，且无控制台错误', async ({ page }) => {
  const errors = await open(page);
  const stats = await page.evaluate(() => {
    const hosts = Array.from(document.querySelectorAll('[data-icon-swap]'));
    return {
      hosts: hosts.length,
      withSvg: hosts.filter((el) => el.querySelector('svg')).length,
      // 多子路径图标（如 BellOff 有 4 条）必须整体换掉，不能只换第一条
      multiChild: Array.from(document.querySelectorAll('[data-icon-swap="Bell|BellOff"] svg'))
        .every((svg) => svg.children.length > 1),
      counts: window.XLMorph.counts,
    };
  });
  expect(stats.hosts).toBeGreaterThanOrEqual(12);
  expect(stats.withSvg).toBe(stats.hosts);
  expect(stats.multiChild).toBe(true);
  expect(stats.counts.swap).toBe(stats.hosts);
  expect(errors).toEqual([]);
});

test('swap: click 触发在两个图标间过渡', async ({ page }) => {
  const errors = await open(page);
  const btn = page.locator('[data-icon-swap="Bell|BellOff"]').first();
  const before = await btn.innerHTML();
  await btn.click();
  // 过渡中途应先淡出（.is-out），结束后换上新图标并淡入（.is-in）
  await page.waitForFunction(
    () => document.querySelector('[data-icon-swap="Bell|BellOff"]').classList.contains('is-in'),
    undefined,
    { timeout: 5000 }
  );
  await page.waitForTimeout(300);
  const after = await btn.innerHTML();
  expect(after).not.toBe(before);
  expect(errors).toEqual([]);
});

test('swap: state 触发与 aria-pressed 双向同步', async ({ page }) => {
  const errors = await open(page);
  const btn = page.locator('[data-icon-swap="Star|Heart"]').first();
  await expect(btn).toHaveAttribute('aria-pressed', 'false');
  const before = await btn.innerHTML();
  await btn.click();
  await expect(btn).toHaveAttribute('aria-pressed', 'true');
  await page.waitForTimeout(400);
  expect(await btn.innerHTML()).not.toBe(before);
  // 外部改属性也要跟上
  await page.evaluate(() => document.querySelector('[data-icon-swap="Star|Heart"]').setAttribute('aria-pressed', 'false'));
  await page.waitForTimeout(400);
  expect(await btn.innerHTML()).toBe(before);
  expect(errors).toEqual([]);
});

test('swap: prefers-reduced-motion: reduce 时立即换，不播过渡', async ({ page }) => {
  const errors = await open(page, { reducedMotion: 'reduce' });
  const btn = page.locator('[data-icon-swap="Bell|BellOff"]').first();
  const before = await btn.innerHTML();
  await btn.click();
  // 立即完成：既没进入 is-out，也没有动画类残留
  expect(await btn.getAttribute('class')).not.toContain('is-out');
  await page.waitForTimeout(250);
  expect(await btn.innerHTML()).not.toBe(before);
  expect(errors).toEqual([]);
});

test('swap: data-motion="off" 时立即换，且切换后无需重载页面', async ({ page }) => {
  const errors = await open(page);
  const btn = page.locator('[data-icon-swap="Bell|BellOff"]').first();
  await page.evaluate(() => document.documentElement.setAttribute('data-motion', 'off'));
  const before = await btn.innerHTML();
  await btn.click();
  await page.waitForTimeout(250);
  expect(await btn.innerHTML()).not.toBe(before);
  expect(await btn.getAttribute('class')).not.toContain('is-out');
  expect(errors).toEqual([]);
});

test('swap: 配对非法时拒绝挂载并告警', async ({ page }) => {
  const errors = [];
  const warns = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
    if (m.type() === 'warning' && m.text().includes('[XLMorph]')) warns.push(m.text());
  });
  await page.goto(pageUrl);
  await page.waitForFunction(() => window.XLMorph);
  const rejected = await page.evaluate(() => {
    const el = document.createElement('span');
    el.setAttribute('data-icon-swap', 'Bell|NotARealIconName');
    document.body.appendChild(el);
    const n = window.XLMorph.refresh();
    return { mounted: !!el.querySelector('svg'), total: n };
  });
  expect(rejected.mounted).toBe(false);
  expect(warns.some((w) => w.includes('data-icon-swap'))).toBe(true);
  expect(errors).toEqual([]);
});

/* ===== 动画图标（Icon Animation · lucide-animated 提取转 CSS）=====
   关键不变量：动画规格只存在于 CSS，运行时 JS 只负责建 SVG 与设 pathLength="1"。 */

test('anim: 全部动画图标挂载出 SVG 且描边元素带 pathLength="1"', async ({ page }) => {
  const errors = await open(page);
  const stats = await page.evaluate(() => {
    const hosts = Array.from(document.querySelectorAll('[data-anim]'));
    const strokes = hosts.flatMap((el) => Array.from(el.querySelectorAll('svg > *')));
    return {
      hosts: hosts.length,
      withSvg: hosts.filter((el) => el.querySelector('svg')).length,
      strokes: strokes.length,
      withPathLength: strokes.filter((n) => n.getAttribute('pathLength') === '1').length,
      hasApi: typeof window.XLAnim === 'object',
    };
  });
  expect(stats.hosts).toBeGreaterThanOrEqual(10);
  expect(stats.withSvg).toBe(stats.hosts);
  expect(stats.hasApi).toBe(true);
  // pathLength 归一化是画线类动画成立的前提，少一个就会画不出
  expect(stats.strokes).toBeGreaterThan(0);
  expect(stats.withPathLength).toBe(stats.strokes);
  expect(errors).toEqual([]);
});

test('anim: 悬停触发 CSS 动画，animation-name 来自生成的 keyframes', async ({ page }) => {
  const errors = await open(page);
  const el = page.locator('[data-anim="CircleCheck"]').first();
  const idle = await el.evaluate((n) => getComputedStyle(n.querySelector('svg > *')).animationName);
  expect(idle).toBe('none');

  await el.hover();
  await page.waitForTimeout(120);
  const playing = await el.evaluate((n) => getComputedStyle(n.querySelector('svg > *')).animationName);
  expect(playing).toBe('la-circle-check');
  expect(errors).toEqual([]);
});

test('anim: aria-pressed="true" 也能触发（无脚本介入动画）', async ({ page }) => {
  const errors = await open(page);
  const el = page.locator('[data-anim="Heart"]').first();
  await el.evaluate((n) => n.setAttribute('aria-pressed', 'true'));
  await page.waitForTimeout(120);
  const name = await el.evaluate((n) => getComputedStyle(n.querySelector('svg > *')).animationName);
  expect(name).toBe('la-heart');
  expect(errors).toEqual([]);
});

test('anim: prefers-reduced-motion: reduce 时动画时长被压到 0', async ({ page }) => {
  const errors = await open(page, { reducedMotion: 'reduce' });
  const el = page.locator('[data-anim="CircleCheck"]').first();
  await el.hover();
  await page.waitForTimeout(120);
  const dur = await el.evaluate((n) => parseFloat(getComputedStyle(n.querySelector('svg > *')).animationDuration));
  // 全局兜底用 animation-duration: 0.001ms !important，这里断言「被压到极短」
  expect(dur).toBeLessThan(0.01);
  expect(errors).toEqual([]);
});

test('anim: XLAnim.play() 可主动重播一次', async ({ page }) => {
  const errors = await open(page);
  const ok = await page.evaluate(() => {
    const el = document.querySelector('#anim-play-btn [data-anim]');
    window.XLAnim.play(el);
    return el.classList.contains('is-playing');
  });
  expect(ok).toBe(true);
  expect(errors).toEqual([]);
});

test('anim: 图标名非法时拒绝挂载并告警', async ({ page }) => {
  const errors = [];
  const warns = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
    if (m.type() === 'warning' && m.text().includes('[XLAnim]')) warns.push(m.text());
  });
  await page.goto(pageUrl);
  await page.waitForFunction(() => window.XLAnim);
  const mounted = await page.evaluate(() => {
    const el = document.createElement('span');
    el.setAttribute('data-anim', 'NotARealIconName');
    document.body.appendChild(el);
    window.XLAnim.init();
    return !!el.querySelector('svg');
  });
  expect(mounted).toBe(false);
  expect(warns.some((w) => w.includes('data-anim'))).toBe(true);
  expect(errors).toEqual([]);
});
