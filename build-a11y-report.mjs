// build-a11y-report.mjs — 重新生成 accessibility-report.json
//
// 解析 css.json 中的 var() 别名（如 --info -> var(--primary-600)），计算浅色/深色下
// 关键「文字 vs 背景」对比度，按 WCAG 2.1 AA 判定，输出沿用既有 schema 的报告。
// 相比旧报告，新增「次级正文(可读) / 页面背景」检查，验证 text-subtle 拆分后 ≥4.5:1。
//
// 运行：`node build-a11y-report.mjs`（也可 `npm run build:a11y`）。

import { readFileSync, writeFileSync } from 'node:fs';

const css = JSON.parse(readFileSync(new URL('./css.json', import.meta.url), 'utf8'));

// 把 primary/gray/semantic/aliases 拍平，并展开一层 var() 别名
function buildResolved(mode) {
  const m = css[mode];
  const map = {};
  for (const [k, v] of Object.entries(m.primary)) map[`primary-${k}`] = v;
  for (const [k, v] of Object.entries(m.gray)) map[`gray-${k}`] = v;
  for (const [k, v] of Object.entries(m.semantic)) map[k] = v;
  for (const [k, v] of Object.entries(m.aliases)) map[k] = v;
  const resolved = {};
  for (const [k, v] of Object.entries(map)) {
    resolved[k] = typeof v === 'string' && v.startsWith('var(')
      ? (map[v.slice(4, -1).replace(/^--/, '')] ?? v)
      : v;
  }
  return resolved;
}

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.substr(i, 2), 16) / 255);
}
function relLum(rgb) {
  const a = rgb.map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}
function contrast(fg, bg) {
  const l1 = relLum(hexToRgb(fg));
  const l2 = relLum(hexToRgb(bg));
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

// 每个模式的检查规格（fg/bg 为不带 -- 前缀的 Token 键）
const SPECS = [
  { name: '正文文字 / 页面背景', fg: 'color-text', bg: 'color-background' },
  { name: '次要文字 / 页面背景', fg: 'color-text-secondary', bg: 'color-background' },
  { name: '禁用文字 / 页面背景', fg: 'color-text-muted', bg: 'color-background', exempt: true, reason: '禁用元素按 WCAG 规范不强制要求对比度' },
  { name: '次级正文(可读) / 页面背景', fg: 'color-text-subtle', bg: 'color-background' },
  { name: '主按钮文字 / 主按钮背景', fg: 'color-on-primary', bg: 'color-primary' },
  { name: '主按钮悬停文字 / 悬停背景', fg: 'color-on-primary', bg: 'color-primary-hover' },
  { name: '链接文字 / 页面背景', fg: 'color-primary', bg: 'color-background' },
  { name: '错误文字 / 错误背景', fg: 'error', bg: 'error-bg' },
  { name: '成功文字 / 成功背景', fg: 'success', bg: 'success-bg' },
  { name: '警告文字 / 警告背景', fg: 'warning', bg: 'warning-bg' },
  { name: '信息文字 / 信息背景', fg: 'info', bg: 'info-bg' },
  { name: '表格文字 / 表格背景', fg: 'color-text', bg: 'color-surface' },
  { name: '表头文字 / 表头背景', fg: 'color-text-secondary', bg: 'color-surface-muted' },
];

function buildMode(mode) {
  const resolved = buildResolved(mode);
  return SPECS.map((s) => {
    const fg = resolved[s.fg];
    const bg = resolved[s.bg];
    const ratio = +contrast(fg, bg).toFixed(2);
    const status = s.exempt ? 'exempt' : ratio >= 4.5 ? 'pass' : 'fail';
    return {
      name: s.name,
      fg: `--${s.fg}`,
      bg: `--${s.bg}`,
      ...(s.exempt ? { exempt: true, reason: s.reason } : {}),
      mode,
      ratio,
      aaNormal: ratio >= 4.5,
      aaLarge: ratio >= 3,
      aaaNormal: ratio >= 7,
      status,
    };
  });
}

const light = buildMode('light');
const dark = buildMode('dark');
const checks = [...light, ...dark];

const pass = checks.filter((c) => c.status === 'pass').length;
const exempt = checks.filter((c) => c.status === 'exempt').length;
const fail = checks.filter((c) => c.status === 'fail').length;

const report = {
  generatedAt: new Date().toISOString(),
  standard: 'WCAG 2.1 AA',
  thresholdNormal: 4.5,
  thresholdLarge: 3,
  summary: {
    total: checks.length,
    pass,
    fail,
    exempt,
    missing: 0,
    allPass: fail === 0,
  },
  lightMode: {
    total: light.length,
    pass: light.filter((c) => c.status === 'pass').length,
    fail: light.filter((c) => c.status === 'fail').length,
  },
  darkMode: {
    total: dark.length,
    pass: dark.filter((c) => c.status === 'pass').length,
    fail: dark.filter((c) => c.status === 'fail').length,
  },
  checks,
  exemptions: checks
    .filter((c) => c.exempt)
    .map((c) => `[${c.mode}] ${c.name}: ${c.ratio}:1 (${c.reason})`),
  failures: checks.filter((c) => c.status === 'fail').map((c) => c.name),
};

writeFileSync(new URL('./accessibility-report.json', import.meta.url), JSON.stringify(report, null, 2) + '\n', 'utf8');
console.log(`accessibility-report.json regenerated: ${checks.length} checks, pass=${pass}, exempt=${exempt}, fail=${fail}`);
