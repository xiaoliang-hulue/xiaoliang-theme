// extract-components-css.mjs
// 从 preview/component-*.html 的 <style> 块中提取组件样式，聚合为 components.css。
// 用法：node extract-components-css.mjs
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const previewDir = join(__dirname, 'preview');

const files = readdirSync(previewDir)
  .filter((f) => /^component-.*\.html$/.test(f))
  .sort();

const blocks = [];
for (const file of files) {
  const html = readFileSync(join(previewDir, file), 'utf8');
  const styleRe = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let m;
  while ((m = styleRe.exec(html)) !== null) {
    blocks.push({ file, css: m[1].trim() });
  }
}

if (blocks.length === 0) {
  console.error('未找到任何 component-*.html 中的 <style> 块。');
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
