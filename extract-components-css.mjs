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

const header = `/* ═══════════════════════════════════════════════════════════════
   components.css — Design System Component Definitions
   由 extract-components-css.mjs 自动聚合自 preview/component-*.html
   如需修改，请编辑对应的 preview/component-*.html 后重新运行本脚本。
   ═══════════════════════════════════════════════════════════════ */

`;

const body = blocks
  .map(
    ({ file, css }) =>
      `/* ── 来源: ${file} ─────────────────────────────────────────────────── */\n${css}\n`
  )
  .join('\n');

writeFileSync(join(__dirname, 'components.css'), header + body, 'utf8');
console.log(`已生成 components.css，包含 ${blocks.length} 个样式块（来自 ${files.length} 个预览页）。`);
