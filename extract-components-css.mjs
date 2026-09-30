// extract-components-css.mjs
// 从 preview/component-*.html 的 <style> 块中，只提取 @component-css-start / @component-css-end
// 标记之间的组件样式，聚合为 components.css。标记之外的预览页脚手架（body / .specimen / .story
// 等）不会被打包，避免污染使用者页面。
// 用法：node extract-components-css.mjs
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const previewDir = join(__dirname, 'preview');

const files = readdirSync(previewDir)
  .filter((f) => /^component-.*\.html$/.test(f))
  .sort();

const START = '/* @component-css-start */';
const END = '/* @component-css-end */';

const blocks = [];
const unmarked = [];

for (const file of files) {
  const html = readFileSync(join(previewDir, file), 'utf8');
  const styleRe = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let m;
  let found = false;
  while ((m = styleRe.exec(html)) !== null) {
    const styleCss = m[1];
    const start = styleCss.indexOf(START);
    const end = styleCss.indexOf(END, start + START.length);
    if (start === -1 || end === -1) continue;
    const css = styleCss.slice(start + START.length, end).trim();
    if (css) {
      blocks.push({ file, css });
      found = true;
    }
  }
  if (!found) unmarked.push(file);
}

if (unmarked.length > 0) {
  console.error(
    `以下预览页缺少 ${START} / ${END} 标记，组件样式无法提取：\n  - ` + unmarked.join('\n  - ')
  );
  process.exit(1);
}

if (blocks.length === 0) {
  console.error('未在任何 component-*.html 中找到标记区间内的组件样式。');
  process.exit(1);
}

// ── 聚合去重 ──
// 多个 component-*.html 会各自携带同一段基础样式（如 .btn 在 button/sidenav/topnav
// 等页重复定义），直接拼接会产生完全相同的重复规则。这里按「选择器 + 规范化声明块」
// 去重：同一选择器的完全相同声明只保留首次出现；同一选择器出现不同声明时，
// 保留声明条数最多的「完整版」（如 .btn 的 flex-shrink:0 版本优先于旧版）。
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

function parseDeclarations(block) {
  // 引号感知拆分：url("data:...;utf8,...") 里的分号属于字符串内容，
  // 不能当作声明分隔符（否则会拦腰截断 data URI，产生未闭合字符串，
  // 进而在浏览器里吞掉后续所有规则 —— 2026-09-30 .btn 全军覆没的根因）。
  const parts = [];
  let current = '';
  let quote = null;
  for (const ch of block) {
    if (quote) {
      current += ch;
      if (ch === quote && current[current.length - 2] !== '\\') quote = null;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
      current += ch;
    } else if (ch === ';') {
      parts.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) parts.push(current);
  return parts
    .map((declaration) => declaration.trim().replace(/\s+/g, ' '))
    .filter(Boolean);
}

function normalizeText(text) {
  return text.replace(/\s+/g, ' ').trim();
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
    const body = cleaned.slice(open + 1, close);
    if (prelude.startsWith('@')) {
      const text = `${normalizeText(prelude)} {${body.trim()}}`;
      rules.push({ kind: 'at', key: `at|${text}`, text });
    } else {
      const sel = normalizeText(prelude);
      const declarations = parseDeclarations(body);
      const signature = [...declarations].sort().join(';');
      rules.push({ kind: 'rule', sel, declarations, key: `rule|${sel}|${signature}` });
    }
    cursor = close + 1;
  }
  return rules;
}

function dedupe(blocks) {
  const normalBySelector = new Map();
  const exactAtRules = new Map();
  const order = [];
  let removed = 0;

  for (const { css } of blocks) {
    for (const rule of extractTopLevel(css)) {
      if (rule.kind === 'at') {
        if (exactAtRules.has(rule.key)) {
          removed++;
          continue;
        }
        exactAtRules.set(rule.key, rule);
        order.push(rule.key);
        continue;
      }

      let existing = normalBySelector.get(rule.sel);
      if (!existing) {
        existing = { sel: rule.sel, declarations: new Map() };
        normalBySelector.set(rule.sel, existing);
        order.push(`rule|${rule.sel}`);
      } else {
        removed++;
      }
      for (const declaration of rule.declarations) {
        const colon = declaration.indexOf(':');
        const property = colon === -1 ? declaration : declaration.slice(0, colon).trim();
        existing.declarations.set(property, declaration);
      }
    }
  }

  const out = order.map((key) => {
    if (key.startsWith('at|')) return `${exactAtRules.get(key).text}\n`;
    const selector = key.slice('rule|'.length);
    const rule = normalBySelector.get(selector);
    return `${rule.sel} { ${Array.from(rule.declarations.values()).join('; ')} }\n`;
  }).join('');

  return { out, removed, total: order.length };
}

const dedupResult = dedupe(blocks);
const body =
  `/* 由 extract-components-css.mjs 聚合去重生成：共 ${dedupResult.total} 条规则，` +
  `合并完全重复 ${dedupResult.removed} 条。 */\n\n` +
  dedupResult.out;

const header = `/* ═══════════════════════════════════════════════════════════════
   components.css — Design System Component Definitions
   由 extract-components-css.mjs 自动聚合去重自 preview/component-*.html
   如需修改，请编辑对应的 preview/component-*.html 后重新运行本脚本。
   ═══════════════════════════════════════════════════════════════ */

`;

writeFileSync(join(__dirname, 'components.css'), header + body, 'utf8');
console.log(
  `已生成 components.css：${dedupResult.total} 条规则（合并完全重复 ${dedupResult.removed} 条），来自 ${files.length} 个预览页。`
);
