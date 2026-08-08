#!/usr/bin/env node
/**
 * 小亮主题 — 组件级 / 页面级 ARIA 审计
 * ----------------------------------------------------------------------------
 * 启发式静态扫描 preview/component-*.html 与 preview/page-*.html，
 * 检查常见可访问性问题：可访问名、role 结构、地标、装饰性图标隐藏、标题层级等。
 * 输出 component-a11y-report.json 并打印摘要。
 *
 * 说明：本脚本为静态启发式检查，能快速暴露系统性问题，但无法替代真实屏幕阅读器实测。
 *       error 必须修复；warning / info 为质量提示，不阻断。
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PREVIEW = path.join(__dirname, 'preview');
const OUT = path.join(__dirname, 'component-a11y-report.json');

const componentFiles = fs.readdirSync(PREVIEW).filter(f => /^component-.*\.html$/.test(f)).sort();
const pageFiles = fs.readdirSync(PREVIEW).filter(f => /^page-.*\.html$/.test(f)).sort();
const targets = [
  ...componentFiles.map(f => ({ file: f, kind: 'component' })),
  ...pageFiles.map(f => ({ file: f, kind: 'page' })),
];

function lineOf(text, idx) {
  let line = 1;
  for (let i = 0; i < idx && i < text.length; i++) if (text[i] === '\n') line++;
  return line;
}
function attr(attrs, name) {
  const m = attrs.match(new RegExp(name + "\\s*=\\s*[\\x22\\x27]([^\\x22\\x27]*)[\\x22\\x27]", 'i'));
  return m ? m[1] : null;
}
function has(attrs, name) {
  return new RegExp('(?:\\s|^)' + name + '(?:\\s|=|/|>|$)', 'i').test(attrs);
}
function textContent(inner) {
  return inner.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

const findingsByFile = [];
const total = { error: 0, warning: 0, info: 0 };

for (const { file, kind } of targets) {
  const html = fs.readFileSync(path.join(PREVIEW, file), 'utf8');
  const findings = [];
  const add = (rule, severity, message, line) => {
    findings.push({ rule, severity, message, line: line || null });
    total[severity]++;
  };

  // 1. <html lang>
  const htmlTag = html.match(/<html\b[^>]*>/i);
  if (htmlTag && !has(htmlTag[0], 'lang')) add('html-lang', 'error', '<html> 缺少 lang 属性', lineOf(html, htmlTag.index));

  // 2. 装饰性图标应 aria-hidden
  const iconRe = /<i\b[^>]*\bdata-lucide\b[^>]*>|<svg\b[^>]*>/gi;
  let m;
  while ((m = iconRe.exec(html))) {
    const tag = m[0];
    const isImg = /role\s*=\s*[\\x22\\x27]?img/i.test(tag);
    if (has(tag, 'aria-hidden') || isImg) continue;
    add('icon-aria-hidden', 'warning', '装饰性图标建议加 aria-hidden="true"', lineOf(html, m.index));
  }

  // 3. 按钮可访问名
  const btnRe = /<button\b([^>]*)>([\s\S]*?)<\/button>/gi;
  while ((m = btnRe.exec(html))) {
    const attrs = m[1];
    const inner = m[2];
    if (has(attrs, 'aria-label') || has(attrs, 'aria-labelledby')) continue;
    const txt = textContent(inner);
    const onlyIcon = !txt && /<i\b[^>]*\bdata-lucide\b|<svg\b/i.test(inner);
    if (onlyIcon) add('button-name', 'warning', '图标按钮缺少可访问名（aria-label）', lineOf(html, m.index));
    else if (!txt) add('button-name', 'warning', '按钮无可见文本且无 aria-label', lineOf(html, m.index));
  }

  // 4. 链接可访问名
  const aRe = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  while ((m = aRe.exec(html))) {
    const attrs = m[1];
    const inner = m[2];
    if (has(attrs, 'aria-label') || has(attrs, 'aria-labelledby')) continue;
    const txt = textContent(inner);
    const onlyIcon = !txt && /<i\b[^>]*\bdata-lucide\b|<svg\b/i.test(inner);
    if (onlyIcon) add('link-name', 'warning', '图标链接缺少可访问名（aria-label）', lineOf(html, m.index));
  }

  // 5. <img alt>
  const imgRe = /<img\b([^>]*)\/?>/gi;
  while ((m = imgRe.exec(html))) {
    if (!has(m[1], 'alt')) add('img-alt', 'error', '<img> 缺少 alt 属性', lineOf(html, m.index));
  }

  // 6. <input> 可访问名（支持 label[for] 与隐式 <label> 包裹两种关联）
  const labelFors = new Set();
  const labelRanges = [];
  const labelRe = /<label\b([^>]*)>/gi;
  let lm;
  while ((lm = labelRe.exec(html))) {
    const f = attr(lm[1], 'for');
    if (f) labelFors.add(f);
    const close = html.indexOf('</label>', lm.index);
    if (close > lm.index) labelRanges.push([lm.index, close]);
  }
  const inputRe = /<input\b([^>]*)\/?>/gi;
  while ((m = inputRe.exec(html))) {
    const attrs = m[1];
    const type = (attr(attrs, 'type') || '').toLowerCase();
    if (['hidden', 'submit', 'button', 'reset'].includes(type)) continue;
    if (has(attrs, 'aria-label') || has(attrs, 'aria-labelledby')) continue;
    const id = attr(attrs, 'id');
    if (id && labelFors.has(id)) continue;
    if (labelRanges.some(([s, e]) => m.index >= s && m.index <= e)) continue;
    add('input-label', 'warning', '<input> 缺少可访问名（label[for] / 隐式 label / aria-label）', lineOf(html, m.index));
  }

  // 7. dialog a11y
  if (/role\s*=\s*[\\x22\\x27]?dialog/i.test(html)) {
    if (!/aria-modal\s*=/.test(html)) add('dialog-a11y', 'warning', 'role="dialog" 建议加 aria-modal="true"', null);
    if (!/aria-labelledby\s*=/.test(html)) add('dialog-a11y', 'warning', 'role="dialog" 建议加 aria-labelledby 指向标题', null);
  }

  // 8. progressbar value
  if (/role\s*=\s*[\\x22\\x27]?progressbar/i.test(html) && !/aria-valuenow\s*=/.test(html))
    add('progressbar-value', 'error', 'role="progressbar" 缺少 aria-valuenow', null);

  // 9. <nav> 地标标签
  const navMatches = [...html.matchAll(/<nav\b([^>]*)>/gi)];
  if (navMatches.length) {
    const unlabeled = navMatches.filter(n => !has(n[1], 'aria-label') && !has(n[1], 'aria-labelledby'));
    if (unlabeled.length) {
      const sev = navMatches.length >= 2 ? 'warning' : 'info';
      add('nav-label', sev, `存在 ${navMatches.length} 个 <nav>，其中 ${unlabeled.length} 个缺少 aria-label 以区分地标`, lineOf(html, unlabeled[0].index));
    }
  }

  // 10. <table> caption
  const tableRe = /<table\b([^>]*)>/gi;
  while ((m = tableRe.exec(html))) {
    const attrs = m[1];
    if (has(attrs, 'aria-label') || has(attrs, 'aria-labelledby')) continue;
    if (!/<caption\b/i.test(html.slice(m.index, m.index + 2000)))
      add('table-caption', 'info', '<table> 缺少 <caption> 或 aria-label', lineOf(html, m.index));
  }

  // 11. 标题层级
  const hMatches = [...html.matchAll(/<h([1-6])\b/gi)];
  const levels = hMatches.map(h => parseInt(h[1], 10));
  if (levels.length) {
    if (levels[0] !== 1) add('heading-order', 'info', `页面首个标题为 h${levels[0]}，建议从 h1 开始`, lineOf(html, hMatches[0].index));
    for (let i = 1; i < levels.length; i++) {
      if (levels[i] - levels[i - 1] > 1) add('heading-order', 'info', `标题层级从 h${levels[i - 1]} 跳到 h${levels[i]}`, lineOf(html, hMatches[i].index));
    }
  }

  if (findings.length) findingsByFile.push({ file, kind, findings });
}

findingsByFile.sort((a, b) => a.file.localeCompare(b.file));
const report = {
  generatedAt: new Date().toISOString(),
  scope: 'preview/component-*.html + preview/page-*.html',
  summary: {
    filesScanned: targets.length,
    findings: total,
    allPass: total.error === 0,
    note: 'warning/info 为质量提示不阻断；error 需修复。启发式静态检查，不替代屏幕阅读器实测。'
  },
  files: findingsByFile,
};
fs.writeFileSync(OUT, JSON.stringify(report, null, 2));

console.log('\n=== ARIA 审计完成 ===');
console.log(`扫描 ${targets.length} 个预览页`);
console.log(`error=${total.error}  warning=${total.warning}  info=${total.info}`);
console.log(`allPass=${report.summary.allPass}`);
console.log(`报告已写入 ${path.basename(OUT)}`);
if (total.error) {
  console.log('\n--- error 明细 ---');
  for (const f of findingsByFile) for (const x of f.findings) if (x.severity === 'error')
    console.log(`  ${f.file}:${x.line ?? ''} [${x.rule}] ${x.message}`);
}
