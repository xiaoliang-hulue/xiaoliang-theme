# 小亮主题 v1.5 动效与视觉升级 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在保持现有 Token、class 和交互 API 兼容的前提下，为小亮主题加入统一动效体系、海蓝与青绿暖金配色、组件状态增强、在线预览和 GitHub 发布流程。

**Architecture:** `css.json` 继续作为 Token 唯一真值，构建脚本生成全部 CSS 变量；全局动效控制与基础关键帧进入 `colors_and_type.css`，组件专属状态进入各 `preview/component-*.html` 的标记区并由 `extract-components-css.mjs` 聚合；`theme.js` 只负责浮层退出时序和统一动效控制，不引入运行时框架。

**Tech Stack:** Node.js 24、原生 ESM 脚本、CSS Custom Properties、原生 JavaScript、Playwright Test、GitHub Actions、GitHub Pages。

---

## 文件结构

- `css.json`：颜色、动效、字体、间距等 Token 真值。
- `build-tokens.mjs`：把 `css.json` 投影为 `colors_and_type.css`。
- `build-a11y-report.mjs`：颜色对比度门禁。
- `extract-components-css.mjs`：聚合组件 CSS，必须支持 `@keyframes` 与 `@media`。
- `colors_and_type.css`：生成 Token、排版工具、全局动效控制和无障碍兜底。
- `preview/component-*.html`：组件源码真值和独立预览。
- `theme.js`：Modal、Drawer、Toast、Tabs 的零依赖交互。
- `preview/index.html`：主题总览和动效实验台。
- `preview/tokens.html`：Token 参考页。
- `audit-motion.mjs`：新动效契约静态门禁。
- `tests/visual.spec.mjs`：Playwright 视觉与交互回归。
- `.github/workflows/audit.yml`：GitHub 自动构建、审计和视觉测试。
- `index.html`、`.nojekyll`：GitHub Pages 根入口。
- `docs/motion-system.md`、`docs/migration-1.5.md`：动效规范与迁移说明。

### Task 1: 建立动效契约测试与 Token

**Files:**
- Create: `audit-motion.mjs`
- Modify: `package.json`
- Modify: `css.json`
- Modify: `build-tokens.mjs`
- Test: `npm run audit:motion`

- [ ] **Step 1: 写入失败的动效契约测试**

创建 `audit-motion.mjs`：

```js
#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const json = JSON.parse(read('css.json'));
const css = read('colors_and_type.css');
const themeJs = read('theme.js');

const errors = [];
const requireText = (text, expected, label) => {
  if (!text.includes(expected)) errors.push(`${label}: 缺少 ${expected}`);
};

const requiredMotionKeys = [
  'duration-fast',
  'duration-base',
  'duration-slow',
  'duration-emphasis',
  'ease-standard',
  'ease-emphasized',
  'ease-spring',
  'distance-sm',
  'distance-md',
  'distance-lg',
  'scale-press',
  'scale-hover',
  'stagger-step',
];

if (!json.motion || typeof json.motion !== 'object') {
  errors.push('css.json: 缺少 motion 对象');
} else {
  for (const key of requiredMotionKeys) {
    if (!json.motion[key]) errors.push(`css.json: motion.${key} 缺失`);
  }
}

for (const key of requiredMotionKeys) {
  requireText(css, `--motion-${key}:`, 'colors_and_type.css');
}

if (errors.length) {
  console.error(`动效契约未通过，共 ${errors.length} 项：`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log('动效契约通过：Token 已接入。');
```

- [ ] **Step 2: 运行测试并确认因功能缺失而失败**

Run:

```powershell
npm run audit:motion
```

Expected: `Missing script: "audit:motion"`。

- [ ] **Step 3: 在 package.json 接入测试脚本**

在 `scripts` 中加入：

```json
"audit:motion": "node audit-motion.mjs",
"audit": "npm run audit:contrast && npm run audit:a11y && npm run audit:icons && npm run audit:motion"
```

- [ ] **Step 4: 在 css.json 增加动效 Token**

在 `css.json` 顶层 `"shadow"` 前加入：

```json
"motion": {
  "duration-fast": "120ms",
  "duration-base": "180ms",
  "duration-slow": "280ms",
  "duration-emphasis": "420ms",
  "ease-standard": "cubic-bezier(0.2, 0, 0, 1)",
  "ease-emphasized": "cubic-bezier(0.16, 1, 0.3, 1)",
  "ease-spring": "cubic-bezier(0.34, 1.56, 0.64, 1)",
  "distance-sm": "4px",
  "distance-md": "8px",
  "distance-lg": "16px",
  "scale-press": "0.98",
  "scale-hover": "1.015",
  "stagger-step": "45ms"
},
```

- [ ] **Step 5: 让 build-tokens.mjs 输出动效 Token**

在 `for (const [k, v] of Object.entries(json.shadow))` 之前加入：

```js
for (const [k, v] of Object.entries(json.motion)) light.push(decl(`motion-${k}`, v));
```

- [ ] **Step 6: 运行测试并确认仍因控制样式和 theme.js 未完成而失败**

Run:

```powershell
npm run build:tokens
npm run audit:motion
```

Expected: `动效契约通过：Token 已接入。`

- [ ] **Step 7: 提交 Token 与契约测试**

```powershell
git add audit-motion.mjs package.json css.json build-tokens.mjs colors_and_type.css
git commit -m "feat(motion): add motion token contract"
```

### Task 2: 增加海蓝、青绿、暖金与暖中性色

**Files:**
- Modify: `css.json`
- Modify: `build-tokens.mjs`
- Modify: `build-a11y-report.mjs`
- Modify: `colors_and_type.css`
- Test: `accessibility-report.json`

- [ ] **Step 1: 扩展对比度失败测试**

在 `build-a11y-report.mjs` 的 `SPECS` 数组尾部加入：

```js
{ name: '辅助色文字 / 辅助色浅底', fg: 'color-accent', bg: 'color-accent-subtle' },
{ name: '暖金文字 / 暖金浅底', fg: 'color-gold', bg: 'color-gold-subtle' },
{ name: '辅助色按钮文字 / 辅助色按钮背景', fg: 'color-on-accent', bg: 'color-accent' },
{ name: '暖金按钮文字 / 暖金按钮背景', fg: 'color-on-gold', bg: 'color-gold' },
{ name: '辅助色浅底 / 页面背景（同色系近邻·上界守卫）', fg: 'color-accent-subtle', bg: 'color-background', maxRatio: 2.5 },
{ name: '暖金浅底 / 页面背景（同色系近邻·上界守卫）', fg: 'color-gold-subtle', bg: 'color-background', maxRatio: 2.5 },
```

Run:

```powershell
npm run audit:contrast
```

Expected: FAIL，提示 `color-accent`、`color-accent-subtle` 等 Token 不存在。

- [ ] **Step 2: 在 css.json 的 light 中加入辅助色阶**

在 `light.gray` 后加入：

```json
"accent": {
  "50": "#ecfdf8",
  "100": "#d0f7ed",
  "200": "#a7eedc",
  "300": "#72dfc8",
  "400": "#3dc7ad",
  "500": "#14a895",
  "600": "#0f766e",
  "700": "#115e59",
  "800": "#134e4a",
  "900": "#123a38",
  "950": "#062a28"
},
"gold": {
  "50": "#fffbeb",
  "100": "#fef3c7",
  "200": "#fde68a",
  "300": "#fcd34d",
  "400": "#fbbf24",
  "500": "#f59e0b",
  "600": "#d97706",
  "700": "#a16207",
  "800": "#854d0e",
  "900": "#713f12",
  "950": "#422006"
},
```

在 `dark.gray` 后加入：

```json
"accent": {
  "50": "#123b35",
  "100": "#155044",
  "200": "#176657",
  "300": "#178a74",
  "400": "#20ad93",
  "500": "#35c9ad",
  "600": "#5eead4",
  "700": "#7dd3c0",
  "800": "#a8eadb",
  "900": "#d1f7ec",
  "950": "#ecfdf8"
},
"gold": {
  "50": "#3d3115",
  "100": "#5a4519",
  "200": "#7a5c1c",
  "300": "#a8781f",
  "400": "#d19a2d",
  "500": "#e7b64f",
  "600": "#f0c86b",
  "700": "#f7d98f",
  "800": "#fae7b3",
  "900": "#fdf3d4",
  "950": "#fffbeb"
},
```

- [ ] **Step 3: 更新浅色语义别名**

把 `light.aliases` 中对应项替换为：

```json
"color-background": "#fdfcfb",
"color-surface": "#fffefd",
"color-surface-elevated": "#ffffff",
"color-surface-muted": "#f7f5f2",
"color-border": "#e5dfd9",
"color-border-subtle": "#f0ebe6",
"color-accent": "#0f766e",
"color-accent-hover": "#115e59",
"color-accent-subtle": "#ecfdf8",
"color-on-accent": "#ffffff",
"color-gold": "#a16207",
"color-gold-hover": "#854d0e",
"color-gold-subtle": "#fffbeb",
"color-on-gold": "#ffffff",
```

保留所有原有 `color-primary`、`color-text`、`color-surface-*` 之外未列出的 Token。

- [ ] **Step 4: 更新深色语义别名**

在 `dark.aliases` 中加入：

```json
"color-accent": "#5eead4",
"color-accent-hover": "#7dd3c0",
"color-accent-subtle": "#123b35",
"color-on-accent": "#071713",
"color-gold": "#f0c86b",
"color-gold-hover": "#f7d98f",
"color-gold-subtle": "#3d3115",
"color-on-gold": "#241a05",
```

同时把深色表面调整为目标值：

```json
"color-background": "#101315",
"color-surface": "#1a2024",
"color-surface-elevated": "#232b30",
"color-surface-muted": "#1d252a",
"color-border": "#65717a",
"color-border-subtle": "#48545d",
```

- [ ] **Step 5: 让构建与对比度脚本识别新色阶**

把 `build-tokens.mjs` 两组色阶循环改为：

```js
for (const group of ['primary', 'gray', 'accent', 'gold']) {
  for (const [k, v] of Object.entries(json.light[group])) light.push(decl(`${group}-${k}`, v));
}
for (const group of ['primary', 'gray', 'accent', 'gold']) {
  for (const [k, v] of Object.entries(json.dark[group])) dark.push(decl(`${group}-${k}`, v));
}
```

把 `build-a11y-report.mjs` 的 `buildResolved` 两组循环改为：

```js
for (const group of ['primary', 'gray', 'accent', 'gold']) {
  for (const [k, v] of Object.entries(m[group])) map[`${group}-${k}`] = v;
}
```

- [ ] **Step 6: 重新生成并验证**

Run:

```powershell
npm run build:tokens
npm run audit:contrast
```

Expected:

```text
accessibility-report.json regenerated: 44 checks, pass=42, exempt=2, fail=0
✓ 对比度校验通过
```

- [ ] **Step 7: 提交配色升级**

```powershell
git add css.json build-tokens.mjs build-a11y-report.mjs colors_and_type.css accessibility-report.json
git commit -m "feat(color): add accent and warm emphasis palette"
```

### Task 3: 修复组件 CSS 聚合对关键帧和媒体查询的支持

**Files:**
- Modify: `extract-components-css.mjs`
- Modify: `components.css`
- Test: `npm run audit:motion`

- [ ] **Step 1: 在动效契约中加入构建产物断言**

在 `audit-motion.mjs` 读取组件产物：

```js
const components = read('components.css');
requireText(components, '@keyframes btn-spin', 'components.css');
requireText(components, '@keyframes drawer-in-right', 'components.css');
requireText(components, '@media (prefers-reduced-motion: reduce)', 'components.css');
```

Run:

```powershell
npm run audit:motion
```

Expected: FAIL，提示 `components.css` 缺少关键帧或减少动效媒体查询。

- [ ] **Step 2: 用支持顶层 at-rule 的解析器替换旧解析器**

在 `extract-components-css.mjs` 中，用以下函数替换 `parseRules` 和 `dedupe` 中依赖旧 `parseRules` 的部分：

```js
function findClosingBrace(text, openIndex) {
  let depth = 0;
  for (let i = openIndex; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  throw new Error(`未闭合的 CSS 块: ${text.slice(0, openIndex + 40)}`);
}

function normalizeDecls(block) {
  return block
    .split(';')
    .map((d) => d.trim().replace(/\s+/g, ' '))
    .filter(Boolean)
    .sort()
    .join(';');
}

function extractTopLevel(cssText) {
  const cleaned = cssText.replace(/\/\*[\s\S]*?\*\//g, '');
  const rules = [];
  let cursor = 0;
  while (cursor < cleaned.length) {
    const open = cleaned.indexOf('{', cursor);
    if (open === -1) break;
    const prelude = cleaned.slice(cursor, open).trim();
    if (!prelude) {
      cursor = open + 1;
      continue;
    }
    const close = findClosingBrace(cleaned, open);
    const rawBlock = cleaned.slice(open + 1, close);
    if (prelude.startsWith('@')) {
      const text = `${prelude}{${rawBlock.trim()}}`;
      rules.push({ kind: 'at', sel: prelude, key: text.replace(/\s+/g, ' '), text });
    } else {
      const decls = normalizeDecls(rawBlock);
      rules.push({ kind: 'rule', sel: prelude, decls, key: `${prelude}|${decls}` });
    }
    cursor = close + 1;
  }
  return rules;
}

function dedupe(blocks) {
  const seen = new Map();
  const order = [];
  let removed = 0;

  for (const { css } of blocks) {
    for (const rule of extractTopLevel(css)) {
      if (seen.has(rule.key)) {
        removed++;
        continue;
      }
      seen.set(rule.key, rule);
      order.push(rule.key);
    }
  }

  const out = order
    .map((key) => {
      const rule = seen.get(key);
      return rule.kind === 'at'
        ? `${rule.text}\n`
        : `${rule.sel} { ${rule.decls.split(';').filter(Boolean).join('; ')} }\n`;
    })
    .join('');

  return { out, removed, total: order.length };
}
```

- [ ] **Step 3: 重新构建并验证关键帧与媒体查询已保留**

Run:

```powershell
npm run build:components
npm run audit:motion
```

Expected:

```text
已生成 components.css
动效契约通过
```

- [ ] **Step 4: 运行图标和 ARIA 回归**

Run:

```powershell
npm run audit:a11y
npm run audit:icons
```

Expected: ARIA 无 error；图标问题数为 0。

- [ ] **Step 5: 提交聚合器修复**

```powershell
git add extract-components-css.mjs components.css audit-motion.mjs
git commit -m "fix(build): preserve keyframes and media rules"
```

### Task 4: 增加全局动效控制、基础关键帧与工具类

**Files:**
- Modify: `colors_and_type.css`
- Modify: `README.md`
- Modify: `docs/motion-system.md`
- Test: `npm run audit:motion`

- [ ] **Step 1: 在 colors_and_type.css 的 Tokens 区块之后加入动效层**

先在 `audit-motion.mjs` 中加入控制契约断言：

```js
requireText(css, '[data-motion="off"]', 'colors_and_type.css');
requireText(css, '[data-motion="subtle"]', 'colors_and_type.css');
requireText(css, '@media (prefers-reduced-motion: reduce)', 'colors_and_type.css');
```

Run:

```powershell
npm run audit:motion
```

Expected: FAIL，提示缺少 `data-motion` 与减少动效控制。

然后在 `colors_and_type.css` 的 Tokens 区块之后加入动效层：

```css
/* Motion system */
@media (prefers-reduced-motion: no-preference) {
  .motion-fade {
    animation: xl-fade-in var(--motion-duration-slow) var(--motion-ease-emphasized) both;
  }
  .motion-rise {
    animation: xl-rise-in var(--motion-duration-emphasis) var(--motion-ease-emphasized) both;
  }
  .motion-pop {
    animation: xl-pop-in var(--motion-duration-slow) var(--motion-ease-spring) both;
  }
  [data-reveal] {
    animation: xl-rise-in var(--motion-duration-emphasis) var(--motion-ease-emphasized) both;
    animation-delay: calc(var(--reveal-index, 0) * var(--motion-stagger-step));
  }
}

[data-motion="subtle"] {
  --motion-duration-fast: 90ms;
  --motion-duration-base: 130ms;
  --motion-duration-slow: 180ms;
  --motion-duration-emphasis: 240ms;
  --motion-distance-sm: 2px;
  --motion-distance-md: 4px;
  --motion-distance-lg: 8px;
  --motion-scale-hover: 1.006;
}

[data-motion="off"] *,
[data-motion="off"] *::before,
[data-motion="off"] *::after {
  animation-duration: 0.001ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.001ms !important;
  scroll-behavior: auto !important;
}

@keyframes xl-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes xl-rise-in {
  from { opacity: 0; transform: translateY(var(--motion-distance-lg)); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes xl-pop-in {
  from { opacity: 0; transform: scale(var(--motion-scale-press)); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes xl-shimmer {
  from { transform: translateX(-140%); }
  to { transform: translateX(140%); }
}
```

- [ ] **Step 2: 增加动效使用文档**

创建 `docs/motion-system.md`，写入：

```markdown
# 动效系统

## 默认节奏

- 快速反馈：120ms
- 常规交互：180ms
- 状态过渡：280ms
- 重点入场：420ms
- 错峰步长：45ms

## 控制方式

```html
<html>
<html data-motion="subtle">
<html data-motion="off">
```

系统 `prefers-reduced-motion: reduce` 始终优先于页面设置。

## 基础类

- `.motion-fade`：透明度渐入。
- `.motion-rise`：向上渐入。
- `.motion-pop`：轻微缩放渐入。
- `[data-reveal]`：自动入场，`--reveal-index` 控制错峰。

## 原则

- 只动画 `transform` 和 `opacity`，避免高频布局抖动。
- 动效用于反馈因果，不用持续闪烁和大面积装饰。
- 焦点、错误和状态不能只靠动画表达。
```

- [ ] **Step 3: 更新 README 控制说明**

在“切换深色模式”之后增加：

```markdown
## 控制动效

默认启用完整动效。需要更轻或完全关闭时：

```html
<html data-motion="subtle">
<html data-motion="off">
```

系统开启“减少动态效果”时，主题会自动降级。详见 `docs/motion-system.md`。
```

- [ ] **Step 4: 运行测试**

Run:

```powershell
npm run build:tokens
npm run audit:motion
```

Expected: 动效契约通过。

- [ ] **Step 5: 提交全局动效层**

```powershell
git add colors_and_type.css README.md docs/motion-system.md
git commit -m "feat(motion): add global motion controls"
```

### Task 5: 增强表单与反馈组件的动效

**Files:**
- Modify: `preview/component-button.html`
- Modify: `preview/component-input.html`
- Modify: `preview/component-textarea.html`
- Modify: `preview/component-select.html`
- Modify: `preview/component-checkbox.html`
- Modify: `preview/component-switch.html`
- Modify: `preview/component-alert.html`
- Modify: `preview/component-progress.html`
- Modify: `components.css`

- [ ] **Step 1: 为 Button 加入抬升、压缩与扫光**

在 `preview/component-button.html` 的 `@component-css-start` 区加入：

```css
.btn {
  position: relative;
  overflow: hidden;
  transition:
    transform var(--motion-duration-base) var(--motion-ease-standard),
    background-color var(--motion-duration-fast) var(--motion-ease-standard),
    border-color var(--motion-duration-fast) var(--motion-ease-standard),
    box-shadow var(--motion-duration-base) var(--motion-ease-standard);
}
.btn:hover:not(:disabled) {
  transform: translateY(calc(-1 * var(--motion-distance-sm)));
  box-shadow: var(--shadow-sm);
}
.btn:active:not(:disabled) {
  transform: translateY(0) scale(var(--motion-scale-press));
  box-shadow: none;
}
.btn-loading::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(110deg, transparent 25%, rgba(255, 255, 255, .2) 50%, transparent 75%);
  animation: xl-shimmer 1.2s linear infinite;
  pointer-events: none;
}
```

- [ ] **Step 2: 为 Input、Textarea、Select 加入焦点光圈与状态过渡**

在三个文件中分别找到 `.input`、`.textarea`、`.select`，统一加入：

```css
transition:
  border-color var(--motion-duration-fast) var(--motion-ease-standard),
  box-shadow var(--motion-duration-slow) var(--motion-ease-emphasized),
  background-color var(--motion-duration-fast) var(--motion-ease-standard);
```

焦点规则统一使用：

```css
box-shadow: 0 0 0 3px var(--color-primary-subtle);
```

错误状态使用：

```css
box-shadow: 0 0 0 3px var(--color-gold-subtle);
```

- [ ] **Step 3: 为 Checkbox、Switch 加入连续状态**

在 `preview/component-checkbox.html` 加入：

```css
.check input {
  accent-color: var(--color-primary);
  transition: transform var(--motion-duration-base) var(--motion-ease-spring);
}
.check input:checked {
  transform: scale(1.08);
}
```

在 `preview/component-switch.html` 加入：

```css
.switch-track {
  transition:
    background-color var(--motion-duration-base) var(--motion-ease-standard),
    box-shadow var(--motion-duration-base) var(--motion-ease-standard);
}
.switch-track::after {
  transition: transform var(--motion-duration-slow) var(--motion-ease-spring);
}
```

- [ ] **Step 4: 为 Alert 与 Progress 加入进入和生长效果**

在 `preview/component-alert.html` 加入：

```css
.alert {
  animation: xl-rise-in var(--motion-duration-slow) var(--motion-ease-emphasized) both;
}
```

在 `preview/component-progress.html` 加入：

```css
.progress-bar {
  transition: width var(--motion-duration-emphasis) var(--motion-ease-emphasized);
}
```

- [ ] **Step 5: 构建并检查关键帧仍被保留**

Run:

```powershell
npm run build:components
npm run audit:motion
npm run audit:a11y
```

Expected: 构建成功，动效契约通过，ARIA error 为 0。

- [ ] **Step 6: 提交表单与反馈动效**

```powershell
git add preview/component-button.html preview/component-input.html preview/component-textarea.html preview/component-select.html preview/component-checkbox.html preview/component-switch.html preview/component-alert.html preview/component-progress.html components.css
git commit -m "feat(motion): animate form and feedback components"
```

### Task 6: 增强卡片、表格、导航与数据组件的层级动效

**Files:**
- Modify: `preview/component-card.html`
- Modify: `preview/component-table.html`
- Modify: `preview/component-topnav.html`
- Modify: `preview/component-sidenav.html`
- Modify: `preview/component-tabs.html`
- Modify: `preview/component-accordion.html`
- Modify: `preview/component-stepper.html`
- Modify: `preview/page-dashboard.html`
- Modify: `preview/page-list.html`
- Modify: `components.css`

- [ ] **Step 1: 为卡片和表格加入悬浮层级**

在 `preview/component-card.html` 加入：

```css
.card-interactive {
  transition:
    transform var(--motion-duration-slow) var(--motion-ease-emphasized),
    border-color var(--motion-duration-base) var(--motion-ease-standard),
    box-shadow var(--motion-duration-slow) var(--motion-ease-emphasized);
}
.card-interactive:hover,
.card-interactive:focus-visible {
  transform: translateY(calc(-1 * var(--motion-distance-md)));
  border-color: var(--color-primary);
  box-shadow: var(--shadow-md);
}
```

在 `preview/component-table.html` 加入：

```css
.table tbody tr {
  transition:
    background-color var(--motion-duration-fast) var(--motion-ease-standard),
    box-shadow var(--motion-duration-base) var(--motion-ease-standard);
}
.table tbody tr:hover {
  box-shadow: inset 3px 0 0 var(--color-primary);
}
```

- [ ] **Step 2: 为导航加入激活迁移**

在 `preview/component-topnav.html`、`preview/component-sidenav.html` 中加入：

```css
.topnav-link,
.sidenav-link {
  transition:
    background-color var(--motion-duration-base) var(--motion-ease-standard),
    color var(--motion-duration-base) var(--motion-ease-standard),
    transform var(--motion-duration-base) var(--motion-ease-standard);
}
.topnav-link:hover,
.sidenav-link:hover {
  transform: translateX(var(--motion-distance-sm));
}
.topnav-link.active,
.sidenav-link.active {
  background: var(--color-primary-subtle);
  box-shadow: inset 3px 0 0 var(--color-primary);
}
```

- [ ] **Step 3: 为 Tabs 与 Accordion 加入方向感**

在 `preview/component-tabs.html` 加入：

```css
.tab {
  transition:
    background-color var(--motion-duration-base) var(--motion-ease-standard),
    color var(--motion-duration-base) var(--motion-ease-standard);
}
```

Class 名必须使用现有的 `.tabpanel`，不是 `.tab-panel`：

```css
.tabpanel:not([hidden]) {
  animation: xl-fade-in var(--motion-duration-slow) var(--motion-ease-emphasized) both;
}
```

在 `preview/component-accordion.html` 加入：

```css
.accordion-content {
  animation: xl-fade-in var(--motion-duration-slow) var(--motion-ease-standard) both;
}
summary {
  transition: color var(--motion-duration-fast) var(--motion-ease-standard);
}
```

- [ ] **Step 4: 为 Stepper 和仪表盘加入错峰入场**

在 `preview/component-stepper.html` 加入：

```css
.step {
  animation: xl-rise-in var(--motion-duration-emphasis) var(--motion-ease-emphasized) both;
}
.step:nth-child(1) { --reveal-index: 0; }
.step:nth-child(2) { --reveal-index: 1; }
.step:nth-child(3) { --reveal-index: 2; }
.step:nth-child(4) { --reveal-index: 3; }
```

在 `preview/page-dashboard.html` 与 `preview/page-list.html` 中给 KPI、列表项与表格容器加入：

```html
data-reveal
```

重复元素依次设置：

```html
style="--reveal-index: 0"
style="--reveal-index: 1"
style="--reveal-index: 2"
style="--reveal-index: 3"
```

- [ ] **Step 5: 构建并执行回归**

Run:

```powershell
npm run build:components
npm run audit:a11y
npm run audit:icons
```

Expected: 构建成功，ARIA error 为 0，图标问题数为 0。

- [ ] **Step 6: 提交内容与导航动效**

```powershell
git add preview/component-card.html preview/component-table.html preview/component-topnav.html preview/component-sidenav.html preview/component-tabs.html preview/component-accordion.html preview/component-stepper.html preview/page-dashboard.html preview/page-list.html components.css
git commit -m "feat(motion): add hierarchy and navigation motion"
```

### Task 7: 增加浮层进入与退出动画

**Files:**
- Modify: `theme.js`
- Modify: `preview/component-modal.html`
- Modify: `preview/component-drawer.html`
- Modify: `preview/component-toast.html`
- Modify: `preview/component-dropdown.html`
- Modify: `preview/component-tooltip.html`
- Modify: `components.css`

- [ ] **Step 1: 让关闭逻辑等待退出动画**

在 `theme.js` 顶部加入：

```js
var OVERLAY_EXIT_MS = 280;
function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
```

把 `closeOverlay` 替换为：

```js
function closeOverlay(target) {
  var overlay = resolveOverlay(target);
  if (!overlay || overlay.classList.contains('is-closing')) return;
  var finished = false;

  function finishClose() {
    if (finished) return;
    finished = true;
    overlay.classList.remove('is-closing');
    overlay.hidden = true;
    overlay.setAttribute('aria-hidden', 'true');
    if (!topOverlay()) {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKeydown, true);
      document.removeEventListener('mousedown', onOutside, true);
    }
    if (overlay._trigger && typeof overlay._trigger.focus === 'function') overlay._trigger.focus();
  }

  if (prefersReducedMotion()) {
    finishClose();
    return;
  }

  overlay.classList.add('is-closing');
  var panel = overlay.querySelector(PANEL_SELECTOR);
  if (panel) panel.addEventListener('animationend', finishClose, { once: true });
  setTimeout(finishClose, OVERLAY_EXIT_MS + 80);
}
```

加入 Toast 退出函数：

```js
function removeToast(el) {
  if (!el.parentNode || el.classList.contains('is-toast-closing')) return;
  if (prefersReducedMotion()) {
    el.parentNode.removeChild(el);
    return;
  }
  el.classList.add('is-toast-closing');
  el.addEventListener('animationend', function () {
    if (el.parentNode) el.parentNode.removeChild(el);
  }, { once: true });
  setTimeout(function () {
    if (el.parentNode) el.parentNode.removeChild(el);
  }, OVERLAY_EXIT_MS + 80);
}
```

把 `showToast` 中关闭按钮回调和自动消失定时器改为调用 `removeToast(el)`。

在 `audit-motion.mjs` 中加入：

```js
requireText(themeJs, 'OVERLAY_EXIT_MS', 'theme.js');
requireText(themeJs, 'is-closing', 'theme.js');
requireText(themeJs, 'prefersReducedMotion', 'theme.js');
requireText(themeJs, 'is-toast-closing', 'theme.js');
```

Run:

```powershell
npm run audit:motion
```

Expected: 完成本步骤后通过。

- [ ] **Step 2: 为 Modal 和 Drawer 添加 CSS 动画**

在 `preview/component-modal.html` 加入：

```css
.modal-overlay:not([hidden]) {
  animation: xl-fade-in var(--motion-duration-base) var(--motion-ease-standard) both;
}
.modal-overlay:not([hidden]) .modal {
  animation: xl-pop-in var(--motion-duration-slow) var(--motion-ease-emphasized) both;
}
.modal-overlay.is-closing {
  animation: xl-fade-in var(--motion-duration-base) var(--motion-ease-standard) reverse both;
}
.modal-overlay.is-closing .modal {
  animation: xl-pop-in var(--motion-duration-base) var(--motion-ease-standard) reverse both;
}
```

在 `preview/component-drawer.html` 保留现有 `drawer-in-*`，并增加：

```css
.drawer-overlay:not([hidden]) {
  animation: xl-fade-in var(--motion-duration-base) var(--motion-ease-standard) both;
}
.drawer-overlay.is-closing {
  animation: xl-fade-in var(--motion-duration-base) var(--motion-ease-standard) reverse both;
}
```

- [ ] **Step 3: 为 Toast、Dropdown、Tooltip 增加状态进入**

在对应预览文件加入：

```css
.toast,
.dropdown-menu,
.tooltip {
  animation: xl-rise-in var(--motion-duration-slow) var(--motion-ease-emphasized) both;
}
.toast.is-toast-closing {
  animation: xl-rise-in var(--motion-duration-slow) var(--motion-ease-standard) reverse both;
}
```

- [ ] **Step 4: 测试浮层时序**

Run:

```powershell
npm run build:components
npm run audit:motion
npm run audit:a11y
```

Expected: 构建通过，动效契约通过，ARIA 无 error。

- [ ] **Step 5: 提交浮层动效**

```powershell
git add theme.js preview/component-modal.html preview/component-drawer.html preview/component-toast.html preview/component-dropdown.html preview/component-tooltip.html components.css
git commit -m "feat(overlay): animate open and close states"
```

### Task 8: 重做总览页并接入动效控制

**Files:**
- Modify: `preview/index.html`
- Modify: `preview/tokens.html`
- Modify: `preview/_theme.js`
- Modify: `README.md`

- [ ] **Step 1: 在总览页头部增加动效模式控制**

在 `preview/index.html` 的 theme button 后加入：

```html
<div class="motion-controls" role="group" aria-label="动效模式">
  <button class="motion-toggle is-active" type="button" data-motion-value="full">完整</button>
  <button class="motion-toggle" type="button" data-motion-value="subtle">轻柔</button>
  <button class="motion-toggle" type="button" data-motion-value="off">关闭</button>
</div>
```

加入对应 CSS：

```css
.motion-controls {
  display: inline-flex;
  gap: 2px;
  padding: 2px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface-muted);
}
.motion-toggle {
  min-height: 32px;
  padding: 0 var(--space-3);
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--color-text-secondary);
  font: inherit;
  font-size: var(--text-xs);
  cursor: pointer;
  transition: background-color var(--motion-duration-fast) var(--motion-ease-standard), color var(--motion-duration-fast) var(--motion-ease-standard);
}
.motion-toggle.is-active {
  background: var(--color-surface-elevated);
  color: var(--color-primary);
  box-shadow: var(--shadow-xs);
}
```

- [ ] **Step 2: 接入状态切换脚本**

在 `preview/index.html` 的脚本中加入：

```js
const motionButtons = document.querySelectorAll('[data-motion-value]');
function applyMotion(value) {
  if (value === 'full') root.removeAttribute('data-motion');
  else root.setAttribute('data-motion', value);
  localStorage.setItem('xl-motion', value);
  motionButtons.forEach((button) => {
    button.classList.toggle('is-active', button.dataset.motionValue === value);
  });
}
applyMotion(localStorage.getItem('xl-motion') || 'full');
motionButtons.forEach((button) => {
  button.addEventListener('click', () => applyMotion(button.dataset.motionValue));
});
```

- [ ] **Step 3: 增加配色与动效展示区**

在主色阶前加入：

```html
<section class="section">
  <h2 class="section-title">视觉语言</h2>
  <p class="section-desc">海蓝负责主操作，青绿承接数据与成功，暖金只用于收藏、提醒和关键强调</p>
  <div class="language-grid">
    <article class="language-card motion-rise"><span class="language-swatch primary"></span><h3>海蓝</h3><p>品牌与关键操作</p></article>
    <article class="language-card motion-rise" style="animation-delay:80ms"><span class="language-swatch accent"></span><h3>青绿</h3><p>数据、成功与辅助操作</p></article>
    <article class="language-card motion-rise" style="animation-delay:160ms"><span class="language-swatch gold"></span><h3>暖金</h3><p>收藏、提醒与有限强调</p></article>
  </div>
</section>
```

- [ ] **Step 4: 让 tokens.html 展示动效变量**

在 `preview/tokens.html` 增加：

```html
<section class="token-section">
  <h2>动效</h2>
  <div class="token-grid">
    <div><code>--motion-duration-fast</code><span>120ms</span></div>
    <div><code>--motion-duration-base</code><span>180ms</span></div>
    <div><code>--motion-duration-slow</code><span>280ms</span></div>
    <div><code>--motion-ease-emphasized</code><span>cubic-bezier(0.16, 1, 0.3, 1)</span></div>
    <div><code>--motion-distance-md</code><span>8px</span></div>
    <div><code>--motion-stagger-step</code><span>45ms</span></div>
  </div>
</section>
```

- [ ] **Step 5: 手动打开页面检查**

Run:

```powershell
Test-Path preview/index.html
Select-String -Path preview/index.html -Pattern 'data-motion-value'
```

Expected: 第一项输出 `True`；第二项能找到三个 `data-motion-value` 按钮。真实浏览器视觉检查由 Task 9 的 Playwright 完成。

- [ ] **Step 6: 提交预览站**

```powershell
git add preview/index.html preview/tokens.html preview/_theme.js README.md
git commit -m "feat(preview): add motion and palette lab"
```

### Task 9: 增加 Playwright 视觉与交互回归

**Files:**
- Create: `playwright.config.mjs`
- Create: `tests/visual.spec.mjs`
- Modify: `package.json`
- Modify: `.gitignore`
- Create: `package-lock.json`
- Test: `npm run test:visual`

- [ ] **Step 1: 安装 Playwright 测试依赖**

Run:

```powershell
npm install --save-dev @playwright/test
npx playwright install chromium
```

Expected: `package.json` 出现 `devDependencies`，`package-lock.json` 生成。

- [ ] **Step 2: 创建 Playwright 配置**

创建 `playwright.config.mjs`：

```js
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  expect: { timeout: 5000 },
  use: {
    headless: true,
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'no-preference',
  },
  reporter: [['list']],
});
```

- [ ] **Step 3: 写入视觉与交互测试**

创建 `tests/visual.spec.mjs`：

```js
import { test, expect } from '@playwright/test';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = path.resolve(import.meta.dirname, '..');
const fileUrl = (...parts) => pathToFileURL(path.join(root, ...parts)).href;

test('button motion switches between full and off', async ({ page }) => {
  await page.goto(fileUrl('preview', 'component-button.html'));
  const button = page.locator('.btn-primary').first();
  await expect(button).toBeVisible();
  expect(await button.evaluate((el) => getComputedStyle(el).transitionDuration)).not.toBe('0s');
  await page.locator('html').evaluate((el) => el.setAttribute('data-motion', 'off'));
  expect(await button.evaluate((el) => getComputedStyle(el).transitionDuration)).toBe('0.001ms');
});

test('modal opens and finishes exit animation', async ({ page }) => {
  await page.goto(fileUrl('preview', 'component-modal.html'));
  await page.locator('[data-modal-open]').click();
  await expect(page.locator('#demo-modal')).toBeVisible();
  await page.locator('[data-modal-close]').first().click();
  await expect(page.locator('#demo-modal')).toBeHidden({ timeout: 1000 });
});

test('core previews do not overflow horizontally', async ({ page }) => {
  const pages = [
    'component-button.html',
    'component-card.html',
    'component-table.html',
    'page-dashboard.html',
    'page-list.html',
    'page-form.html',
    'page-detail.html',
  ];
  for (const name of pages) {
    await page.goto(fileUrl('preview', name));
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `${name} horizontal overflow`).toBeLessThanOrEqual(1);
  }
});

test('mobile dashboard has no clipped primary content', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(fileUrl('preview', 'page-dashboard.html'));
  await expect(page.locator('h1').first()).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
```

- [ ] **Step 4: 接入测试脚本并提交锁文件**

在 `package.json` 加入：

```json
"test:visual": "playwright test"
```

从 `.gitignore` 删除：

```text
package-lock.json
```

Run:

```powershell
npm run build
npm run test:visual
```

Expected: 4 passed。

- [ ] **Step 5: 提交测试与依赖**

```powershell
git add package.json package-lock.json playwright.config.mjs tests/visual.spec.mjs .gitignore
git commit -m "test: add browser visual regression"
```

### Task 10: 增加 GitHub Actions 自动审计

**Files:**
- Create: `.github/workflows/audit.yml`
- Modify: `README.md`
- Modify: `PUBLISH.md`

- [ ] **Step 1: 创建审计工作流**

创建 `.github/workflows/audit.yml`：

```yaml
name: Audit

on:
  push:
  pull_request:

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - run: git diff --exit-code -- colors_and_type.css components.css utilities.css
      - run: npm run audit
      - run: npx playwright install --with-deps chromium
      - run: npm run test:visual
```

- [ ] **Step 2: 更新公开文档中的质量说明**

在 README 的“可访问性”章节加入：

```markdown
GitHub Actions 会在每次 push 和 pull request 时运行构建、颜色对比度、ARIA、图标、动效契约和 Playwright 视觉回归。任一检查失败都会阻断合并。
```

在 `PUBLISH.md` 增加：

```markdown
## 自动检查

推送后打开 GitHub 仓库的 Actions 页面。`Audit` 工作流全部通过后，再创建版本标签或发布 Release。
```

- [ ] **Step 3: 本地验证工作流中的命令**

Run:

```powershell
npm ci
npm run build
git diff --exit-code -- colors_and_type.css components.css utilities.css
npm run audit
npm run test:visual
```

Expected: 全部通过，且构建后三个产物无差异。

- [ ] **Step 4: 提交工作流**

```powershell
git add .github/workflows/audit.yml README.md PUBLISH.md
git commit -m "ci: audit build, a11y, icons and motion"
```

### Task 11: 更新版本、迁移文档与 GitHub Pages 入口

**Files:**
- Modify: `package.json`
- Modify: `CHANGELOG.md`
- Modify: `README.md`
- Modify: `PUBLISH.md`
- Create: `docs/migration-1.5.md`
- Create: `index.html`
- Create: `.nojekyll`

- [ ] **Step 1: 创建迁移文档**

创建 `docs/migration-1.5.md`：

```markdown
# 从 1.x 升级到 1.5

## 无破坏变更

现有 Token、组件 class、`window.XL` API 和交互属性全部保留。原有项目替换以下文件即可升级：

```text
colors_and_type.css
components.css
utilities.css
theme.js
```

## 默认视觉变化

1. 页面与卡片表面加入轻微暖度。
2. 新增青绿与暖金语义色，主色仍为海蓝。
3. 按钮、卡片、表格、导航、表单与浮层默认启用动效。
4. Modal、Drawer、Toast 的退出动作会等待动画完成。

## 控制动效

```html
<html data-motion="subtle">
<html data-motion="off">
```

系统“减少动态效果”设置始终优先。

## 回退

如果项目暂时不希望接受新视觉，继续使用 v1.4.10 的四个文件即可。不要只回退其中一个文件，以免 Token 与组件样式版本不一致。
```

- [ ] **Step 2: 更新 package.json 版本与描述**

把：

```json
"version": "1.4.10",
"description": "小亮主题 — 个人极简干净设计系统，含浅色/深色双模式、纯 CSS 变量 Token 与 26 个基础组件",
```

替换为：

```json
"version": "1.5.0",
"description": "小亮主题 — 兼容旧项目的高级设计系统，含海蓝青绿暖金配色、完整动效、浅色/深色双模式与 26 个基础组件",
```

- [ ] **Step 3: 在 CHANGELOG.md 顶部加入 1.5.0**

```markdown
## [1.5.0] - 2026-09-30

### 新增

- 海蓝主色、青绿辅助色与暖金强调色，浅色加入轻微暖中性表面。
- 统一动效 Token、完整动效与轻柔动效控制。
- Button、表单、Card、Table、导航、Tabs、Accordion、Progress 与浮层动效。
- Modal、Drawer、Toast 进入和退出动画。
- 动效契约审计与 Playwright 浏览器回归。
- GitHub Actions 自动构建、无障碍、图标和动效检查。
- GitHub Pages 在线预览入口与首次 GitHub 发布指南。

### 兼容

- 不删除、不重命名现有 Token 与组件 class。
- `window.XL` 与所有数据属性交互 API 保持兼容。
- 系统 `prefers-reduced-motion: reduce` 继续强制降级。
```

- [ ] **Step 4: 创建 GitHub Pages 根入口**

创建 `index.html`：

```html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="refresh" content="0; url=./preview/index.html">
  <title>小亮主题</title>
</head>
<body>
  <p><a href="./preview/index.html">打开小亮主题预览</a></p>
</body>
</html>
```

创建空文件 `.nojekyll`。

- [ ] **Step 5: 写入 GitHub 首次发布指南**

在 `PUBLISH.md` 顶部替换 Gitee 专属内容为：

```markdown
# 发布到 GitHub 指南

## 1. 创建账号与仓库

1. 打开 `https://github.com/signup` 注册账号。
2. 登录后打开 `https://github.com/new`。
3. Repository name 填 `xiaoliang-theme`。
4. 选择 Public。
5. 不要勾选 Add a README、.gitignore 或 license，因为本地仓库已经包含这些文件。
6. 点击 Create repository。

## 2. 添加远端并推送

在项目目录执行，把 `YOUR_GITHUB_USERNAME` 换成你的 GitHub 用户名：

```powershell
git remote add github https://github.com/YOUR_GITHUB_USERNAME/xiaoliang-theme.git
git push -u github main
```

Git Credential Manager 会打开浏览器登录。登录后再推送同一命令。

## 3. 开启 GitHub Pages

1. 打开仓库 Settings。
2. 左侧选择 Pages。
3. Source 选择 Deploy from a branch。
4. Branch 选择 main，目录选择 / (root)。
5. 保存后等待 1 到 2 分钟。
6. 访问 `https://YOUR_GITHUB_USERNAME.github.io/xiaoliang-theme/`。

## 4. 查看自动审计

打开仓库 Actions，确认 `Audit` 工作流为绿色。
```

- [ ] **Step 6: 本地验证**

Run:

```powershell
npm run build
npm run audit
npm run test:visual
git diff --check
```

Expected: 全部通过，无空白错误。

- [ ] **Step 7: 提交发布准备**

```powershell
git add package.json CHANGELOG.md README.md PUBLISH.md docs/migration-1.5.md index.html .nojekyll
git commit -m "docs: prepare v1.5 github release"
```

### Task 12: 推送到 GitHub 并开启 Pages

**Files:**
- Modify: `package.json`
- Modify: `README.md`
- Remote: `github`

- [ ] **Step 1: 请求用户创建 GitHub 账号和空仓库**

在对话中暂停，要求用户提供：

```text
GitHub 用户名
仓库网页地址
确认仓库为 Public 且未初始化 README
```

- [ ] **Step 2: 更新仓库元数据**

把 `package.json` 的 `repository` 替换为：

```json
"repository": {
  "type": "git",
  "url": "git+https://github.com/GITHUB_USERNAME/xiaoliang-theme.git"
},
"homepage": "https://GITHUB_USERNAME.github.io/xiaoliang-theme/",
"bugs": {
  "url": "https://github.com/GITHUB_USERNAME/xiaoliang-theme/issues"
},
```

把三个 `GITHUB_USERNAME` 替换为用户提供的真实用户名，并执行：

```powershell
npm run build
npm run audit
git add package.json
git commit -m "docs: point package metadata to github"
```

- [ ] **Step 3: 添加 GitHub 远端并推送**

```powershell
git remote add github https://github.com/GITHUB_USERNAME/xiaoliang-theme.git
git push -u github main
```

如果 `github` remote 已存在，先执行：

```powershell
git remote set-url github https://github.com/GITHUB_USERNAME/xiaoliang-theme.git
```

- [ ] **Step 4: 等待用户完成认证**

如果终端等待浏览器认证，在对话中告诉用户完成 GitHub 登录，认证成功后继续。不要输入或保存用户的密码、令牌或验证码。

- [ ] **Step 5: 验证远端和 Actions**

Run:

```powershell
git remote -v
git ls-remote --heads github
```

Expected: 同时看到 Gitee `origin` 和 GitHub `github`；`github` 的 `refs/heads/main` 指向本地最新提交。

- [ ] **Step 6: 指导用户开启 Pages**

让用户在 GitHub 仓库完成：

```text
Settings -> Pages -> Source: Deploy from a branch -> Branch: main -> Folder: / (root) -> Save
```

- [ ] **Step 7: 最终验证**

Run:

```powershell
git status --short --branch
git log --oneline -5
```

Expected: 工作区干净，最近提交包含 v1.5 功能、测试、文档和 GitHub 元数据。

## 计划自检

- 规格中的兼容性由 Task 1 至 Task 12 的“不删除旧 Token/class”约束覆盖。
- 海蓝、青绿、暖金和暖中性色由 Task 2 覆盖。
- 动效 Token、全局控制和减少动效由 Task 1、4 覆盖。
- 核心组件、导航、内容、浮层动效由 Task 5、6、7 覆盖。
- 预览站和 Token 参考由 Task 8 覆盖。
- 构建聚合、ARIA、图标、对比度和动效审计由 Task 1、2、3、10 覆盖。
- 桌面、手机、明暗、动效控制和浮层时序由 Task 9 覆盖。
- 文档、版本、GitHub Actions、Pages 和首次推送由 Task 10、11、12 覆盖。
- 所有代码步骤均给出具体文件、命令和预期结果，没有未定义的实现细节。
