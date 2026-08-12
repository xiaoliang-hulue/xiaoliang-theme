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
function parseRules(cssText) {
  // 去掉注释
  const cleaned = cssText.replace(/\/\*[\s\S]*?\*\//g, '');
  const rules = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(cleaned)) !== null) {
    const sel = m[1].trim();
    if (!sel || sel.startsWith('@')) continue;
    const decls = m[2]
      .split(';')
      .map((d) => d.trim())
      .filter(Boolean)
      .sort();
    rules.push({ sel, decls, key: sel + '|' + decls.join(';') });
  }
  return rules;
}

function dedupe(blocks) {
  const seen = new Map(); // key -> rule（保留完整版）
  const source = new Map(); // key -> 来源文件
  const order = []; // 首次出现顺序
  const dupCount = {};

  for (const { file, css } of blocks) {
    for (const rule of parseRules(css)) {
      if (!seen.has(rule.key)) {
        seen.set(rule.key, rule);
        source.set(rule.key, file);
        order.push(rule.key);
      } else {
        dupCount[rule.key] = (dupCount[rule.key] || 0) + 1;
      }
    }
  }

  // 对同一选择器的多个不同声明版本，保留声明最多的完整版
  const bySel = new Map();
  for (const key of order) {
    const r = seen.get(key);
    if (!bySel.has(r.sel)) bySel.set(r.sel, []);
    bySel.get(r.sel).push(key);
  }
  const keep = new Set();
  for (const keys of bySel.values()) {
    if (keys.length === 1) {
      keep.add(keys[0]);
    } else {
      // 多版本：保留声明条数最多者（同条数保留先出现的）
      let best = keys[0];
      for (const k of keys) {
        if (seen.get(k).decls.length > seen.get(best).decls.length) best = k;
      }
      keep.add(best);
    }
  }

  // 组装去重后的 CSS，按首次出现顺序输出
  let out = '';
  let removed = 0;
  for (const key of order) {
    if (!keep.has(key)) {
      removed++;
      continue;
    }
    const r = seen.get(key);
    out += `${r.sel} { ${r.decls.join('; ')} }\n`;
  }
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
