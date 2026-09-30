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
  for (const group of ['primary', 'gray', 'accent', 'gold']) {
    for (const [k, v] of Object.entries(m[group])) map[`${group}-${k}`] = v;
  }
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
  // 主色浅底组合：覆盖 .btn-ghost:hover / .tag-primary / .avatar.primary /
  // .sidenav-link.active / .topnav-link.active / .step.active .step-index —— 这些
  // 全部是「primary-subtle 作背景 + primary 作前景」。此前无检查，导致深色下
  // primary-subtle 误取 primary-950(近白) 长期未被发现。
  { name: '主色文字 / 主色浅底(幽灵悬停·标签·头像·激活项)', fg: 'color-primary', bg: 'color-primary-subtle' },
  // 【上界守卫·防档位映射反转】主色浅底是柔和的状态反馈底色，设计上应与页面背景
  // 同色系近邻（低反差属预期，故不设下界）。但若其与页面背景反差「过大」，说明色阶
  // 档位取反了 —— 深色模式色阶是倒序的（50 最暗、950 最亮），一旦误取 950 就会在
  // 近黑页面上砸出一块近白，同时使其上的主色文字跌破 AA。
  // 历史事故：dark 的 color-primary-subtle 曾误设为 #eef4ff(=primary-950)，
  // 与 #0a0a0a 背景反差高达 17:1，幽灵按钮 hover 显示为刺眼白块。
  { name: '主色浅底 / 页面背景（同色系近邻·上界守卫）', fg: 'color-primary-subtle', bg: 'color-background', maxRatio: 2.5 },
  { name: '正文文字 / 悬浮表面（模态·抽屉·下拉）', fg: 'color-text', bg: 'color-surface-elevated' },
  { name: '错误文字 / 错误背景', fg: 'error', bg: 'error-bg' },
  { name: '成功文字 / 成功背景', fg: 'success', bg: 'success-bg' },
  { name: '警告文字 / 警告背景', fg: 'warning', bg: 'warning-bg' },
  { name: '信息文字 / 信息背景', fg: 'info', bg: 'info-bg' },
  { name: '表格文字 / 表格背景', fg: 'color-text', bg: 'color-surface' },
  { name: '表头文字 / 表头背景', fg: 'color-text-secondary', bg: 'color-surface-muted' },
  { name: '辅助色文字 / 辅助色浅底', fg: 'color-accent', bg: 'color-accent-subtle' },
  { name: '暖金文字 / 暖金浅底', fg: 'color-gold', bg: 'color-gold-subtle' },
  { name: '辅助色按钮文字 / 辅助色按钮背景', fg: 'color-on-accent', bg: 'color-accent' },
  { name: '暖金按钮文字 / 暖金按钮背景', fg: 'color-on-gold', bg: 'color-gold' },
  { name: '辅助色浅底 / 页面背景（同色系近邻·上界守卫）', fg: 'color-accent-subtle', bg: 'color-background', maxRatio: 2.5 },
  { name: '暖金浅底 / 页面背景（同色系近邻·上界守卫）', fg: 'color-gold-subtle', bg: 'color-background', maxRatio: 2.5 },
];

function buildMode(mode) {
  const resolved = buildResolved(mode);
  return SPECS.map((s) => {
    const fg = resolved[s.fg];
    const bg = resolved[s.bg];
    const ratio = +contrast(fg, bg).toFixed(2);
    // 三类判定：① 上界守卫（反差过大 = 色阶档位取反）；
    // ② 非文本 UI 元素按 WCAG 2.1 §1.4.11 用 3:1；③ 文本按 AA 4.5:1
    const threshold = s.maxRatio ?? (s.uiComponent ? 3 : 4.5);
    let status;
    if (s.exempt) status = 'exempt';
    else if (s.maxRatio) status = ratio <= s.maxRatio ? 'pass' : 'fail';
    else status = ratio >= threshold ? 'pass' : 'fail';
    return {
      name: s.name,
      fg: `--${s.fg}`,
      bg: `--${s.bg}`,
      ...(s.exempt ? { exempt: true, reason: s.reason } : {}),
      ...(s.uiComponent ? { uiComponent: true, threshold } : {}),
      ...(s.maxRatio ? { guard: 'max', maxRatio: s.maxRatio } : {}),
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

// 门禁：任一检查未通过即以非零码退出，使其可直接串进 `npm run audit`。
// 历史教训：此脚本此前只生成报告、从不失败退出，深色 color-primary-subtle 误取
// 近白色导致幽灵按钮 hover 不可读，长期无人察觉。
if (fail > 0) {
  console.error(`\n✗ 对比度校验未通过（${fail} 项）：`);
  for (const c of checks.filter((x) => x.status === 'fail')) {
    const bound = c.maxRatio ? `应 ≤${c.maxRatio}` : `应 ≥${c.uiComponent ? 3 : 4.5}`;
    console.error(`  [${c.mode}] ${c.name}  ${c.ratio}:1（${bound}）  ${c.fg} on ${c.bg}`);
  }
  process.exit(1);
}
console.log('✓ 对比度校验通过');
