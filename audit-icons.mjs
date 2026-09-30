// 图标一致性审计：扫描目标目录下所有图标，逐一比对 lucide.min.js 库，
// 找出非 Lucide / 自定义 SVG / emoji / 孤儿 data-lucide（未引库）引用。
// 用法：node audit-icons.mjs [dir1 dir2 ...]   默认扫脚本所在目录
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// 图标库定位：兼容两种目录布局
//   ① 主题仓库根：<repo>/audit-icons.mjs      -> assets/icons/lucide.min.js
//   ② 用户级 Skill：<skill>/assets/audit-icons.mjs -> icons/lucide.min.js
// 也允许用环境变量 LUCIDE_LIB 显式指定。
const LUCIDE_CANDIDATES = [
  process.env.LUCIDE_LIB,
  path.join(__dirname, 'assets/icons/lucide.min.js'),
  path.join(__dirname, 'icons/lucide.min.js'),
  path.join(__dirname, '../assets/icons/lucide.min.js'),
].filter(Boolean);
const LUCIDE = LUCIDE_CANDIDATES.find((p) => fs.existsSync(p));
if (!LUCIDE) {
  console.error('✗ 未找到 lucide.min.js，已尝试：\n  ' + LUCIDE_CANDIDATES.join('\n  '));
  console.error('  可设置环境变量 LUCIDE_LIB=<lucide.min.js 绝对路径> 后重试。');
  process.exit(1);
}

// ---------- 建立 Lucide 库索引：标准化几何签名 -> 图标名 ----------
function geomOfChildren(children) {
  const out = [];
  for (const el of children || []) {
    if (!Array.isArray(el)) continue;
    const [tag, attrs] = el;
    const a = attrs || {};
    if (tag === 'path' && a.d) out.push('P:' + a.d);
    else if (tag === 'circle') out.push('C:' + [a.cx, a.cy, a.r].join(','));
    else if (tag === 'line') out.push('L:' + [a.x1, a.y1, a.x2, a.y2].join(','));
    else if ((tag === 'polyline' || tag === 'polygon') && a.points) out.push('PL:' + a.points);
    else if (tag === 'rect') out.push('R:' + [a.x, a.y, a.width, a.height].join(','));
    else if (tag === 'svg' && a.children) out.push(...geomOfChildren(a.children));
  }
  return out;
}
function geomOfSvgString(svg) {
  const out = [];
  for (const m of svg.matchAll(/<path\b[^>]*\bd=["']([^"']*)["']/gi)) out.push('P:' + m[1]);
  const cx = (svg.match(/<circle\b[^>]*\bcx=["']([^"']*)["']/i) || [])[1];
  const cy = (svg.match(/<circle\b[^>]*\bcy=["']([^"']*)["']/i) || [])[1];
  const cr = (svg.match(/<circle\b[^>]*\br=["']([^"']*)["']/i) || [])[1];
  if (cx !== undefined) out.push('C:' + [cx, cy, cr].join(','));
  const x1 = (svg.match(/<line\b[^>]*\bx1=["']([^"']*)["']/i) || [])[1];
  const y1 = (svg.match(/<line\b[^>]*\by1=["']([^"']*)["']/i) || [])[1];
  const x2 = (svg.match(/<line\b[^>]*\bx2=["']([^"']*)["']/i) || [])[1];
  const y2 = (svg.match(/<line\b[^>]*\by2=["']([^"']*)["']/i) || [])[1];
  if (x1 !== undefined) out.push('L:' + [x1, y1, x2, y2].join(','));
  for (const m of svg.matchAll(/<poly(?:line|gon)\b[^>]*\bpoints=["']([^"']*)["']/gi)) out.push('PL:' + m[1]);
  const rx = (svg.match(/<rect\b[^>]*\bx=["']([^"']*)["']/i) || [])[1];
  const ry = (svg.match(/<rect\b[^>]*\by=["']([^"']*)["']/i) || [])[1];
  const rw = (svg.match(/<rect\b[^>]*\bwidth=["']([^"']*)["']/i) || [])[1];
  const rh = (svg.match(/<rect\b[^>]*\bheight=["']([^"']*)["']/i) || [])[1];
  if (rx !== undefined) out.push('R:' + [rx, ry, rw, rh].join(','));
  return out;
}
const lucide = require(LUCIDE);
function serializeIcon(data) {
  const DEF = { xmlns: 'http://www.w3.org/2000/svg', width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
  function ser(node) {
    if (typeof node === 'string') return node;
    const [tag, attrs, children] = node;
    let s = '<' + tag;
    if (attrs) for (const k in attrs) s += ' ' + k + '="' + String(attrs[k]) + '"';
    if (children && children.length) { s += '>'; for (const c of children) s += ser(c); s += '</' + tag + '>'; }
    else s += '/>';
    return s;
  }
  if (Array.isArray(data) && data[0] === 'svg') return ser(data);
  if (Array.isArray(data)) return ser(['svg', DEF, data]);
  if (data && data.children) return ser(['svg', DEF, data.children]);
  return '';
}
const SIG2NAME = new Map();
for (const key of Object.keys(lucide)) {
  const data = lucide[key];
  const sig = geomOfSvgString(serializeIcon(data)).sort().join('|');
  if (sig && !SIG2NAME.has(sig)) SIG2NAME.set(sig, key);
}
function matchLucide(svgString) {
  const sig = geomOfSvgString(svgString).sort().join('|');
  return SIG2NAME.get(sig) || null;
}

// ---------- 扫描目标 ----------
// 入参可以是目录，也可以是单个文件路径（便于只校验一个生成产物）。
const dirs = process.argv.slice(2).length ? process.argv.slice(2) : [__dirname];
const SKIP = new Set(['.git', '.worktrees', '.superpowers', 'node_modules', 'test-results', 'playwright-report', 'ui_kits']);
const EMOJI_RE = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u;

function walk(dir, files) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') && SKIP.has(e.name)) continue;
    if (SKIP.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, files);
    else if (/\.(html|css|js)$/i.test(e.name) && !/lucide\.min\.js$/.test(e.name)) files.push(p);
  }
}

const allFiles = [];
for (const d of dirs) {
  let st;
  try {
    st = fs.statSync(d);
  } catch {
    console.error(`路径不存在，已跳过: ${d}`);
    continue;
  }
  if (st.isDirectory()) walk(d, allFiles);
  else if (/\.(html|css|js)$/i.test(d)) allFiles.push(d);
  else console.error(`非 html/css/js 文件，已跳过: ${d}`);
}
if (!allFiles.length) {
  console.error('没有可扫描的文件。用法: node audit-icons.mjs [目录或文件 ...]');
  process.exit(1);
}

const report = { generatedAt: new Date().toISOString(), scanned: allFiles.length, dirs, files: [], issues: [] };
let issueCount = 0;

for (const f of allFiles) {
  let txt;
  try { txt = fs.readFileSync(f, 'utf8'); } catch { continue; }
  const rel = path.relative(__dirname, f) || f;
  const entry = { file: rel, inline: [], ref: [], emoji: [] };

  // 1) 所有 <svg>...</svg> 块（含 mask data-uri 内联）
  const svgRe = /<svg[\s\S]*?<\/svg>/gi;
  let m;
  while ((m = svgRe.exec(txt))) {
    const svg = m[0];
    // 显式豁免：data-not-icon="原因" 声明这是插画/水印/图表等业务图形，不是 UI 图标。
    // 用属性而非白名单，豁免理由就写在代码现场，不会随文件移动而失效。
    const exemptMatch = svg.match(/data-not-icon=["']([^"']*)["']/i);
    if (exemptMatch) {
      entry.inline.push({ name: 'EXEMPT', reason: exemptMatch[1] || 'unspecified', loc: m.index });
      continue;
    }
    const name = matchLucide(svg);
    entry.inline.push({ name: name || 'UNKNOWN', loc: m.index });
    if (!name) { report.issues.push({ file: rel, type: 'non-lucide-svg', loc: m.index, detail: svg.slice(0, 120) }); issueCount++; }
  }

  // 2) data-lucide 引用型
  const dlRe = /data-lucide=["']([^"']+)["']/gi;
  const refs = new Set();
  while ((m = dlRe.exec(txt))) refs.add(m[1]);
  const scriptRefsLucide = /lucide\.min\.js|icons\/lucide|createIcons/.test(txt);
  for (const name of refs) {
    const inLib = Boolean(lucide[name] || lucide[name.split('-').map(s=>s[0].toUpperCase()+s.slice(1)).join('')]);
    entry.ref.push({ name, inLib, scriptRefsLucide });
    if (!inLib) { report.issues.push({ file: rel, type: 'unknown-data-lucide', name }); issueCount++; }
    if (!scriptRefsLucide) { report.issues.push({ file: rel, type: 'orphan-data-lucide', name, detail: '使用了 data-lucide 但未引用 lucide.min.js / 未调用 createIcons' }); issueCount++; }
  }

  // 3) emoji（剔除 svg 块后扫文本）
  const txtNoSvg = txt.replace(/<svg[\s\S]*?<\/svg>/gi, '');
  const em = txtNoSvg.match(EMOJI_RE);
  if (em) { entry.emoji = [...new Set(em)]; for (const c of entry.emoji) { report.issues.push({ file: rel, type: 'emoji', char: c }); issueCount++; } }

  if (entry.inline.length || entry.ref.length || entry.emoji.length) report.files.push(entry);
}

report.allClear = issueCount === 0;
report.issueCount = issueCount;
const out = path.join(__dirname, 'audit-icons-report.json');
fs.writeFileSync(out, JSON.stringify(report, null, 2), 'utf8');

console.log('扫描目录:', dirs.join(' | '));
console.log('扫描文件:', report.scanned, ' 含图标文件:', report.files.length);
console.log('图标文件清单:');
for (const e of report.files) {
  const ins = e.inline.map(i => i.name).join(', ');
  const refs = e.ref.map(r => `data-lucide:${r.name}${r.scriptRefsLucide ? '' : '(⚠未引库)'}`).join(', ');
  console.log(`  ${e.file}  →  内联[${ins}] ${refs ? '| 引用[' + refs + ']' : ''}${e.emoji.length ? ' | emoji:' + e.emoji.join('') : ''}`);
}
console.log('\n问题总数:', issueCount);
if (issueCount) for (const i of report.issues) console.log('  ⚠', i.type, i.file, i.name || i.char || '', i.detail || '');
else console.log('  ✅ 全部图标均为 Lucide，无 emoji / 自定义 SVG / 孤儿引用');
console.log('\n报告已写:', out);
