// build-utilities.mjs — 由 css.json 的 Token 变量生成 utilities.css
//
// 间距(p/m/gap)、圆角(rounded-*)、阴影(shadow-*) 直接消费 colors_and_type.css
// 中由 build-tokens.mjs 生成的 --space-* / --radius-* / --shadow-* 变量；
// 容器与栅格消费 --breakpoint-* / --container-max，从而把断点 Token 暴露为可用工具。
//
// 单一来源：变量定义在 css.json，本脚本只引用变量名，不重复写死数值。
// 例外：@media 的条件部分（min-width）按 CSS 规范不支持 var()，因此断点值在构建期
// 从 css.json 展开为字面量；属性值仍使用 var(--breakpoint-*)，保持可主题化。
// 运行：`node build-utilities.mjs`（已并入 `npm run build`）。

import { readFileSync, writeFileSync } from 'node:fs';

const css = JSON.parse(readFileSync(new URL('./css.json', import.meta.url), 'utf8'));

const spacing = css.spacing;            // { "0":"0px", "1":"4px", ... }
const radius = css.radius;              // { none, sm, md, lg, xl, full }
const shadow = css.shadow;              // { xs, sm, md, lg, xl }
const bp = css.breakpoints;            // { sm, md, lg, xl, 2xl, container-max }
const spaceSteps = Object.keys(spacing);
const gridCols = [1, 2, 3, 4, 5, 6, 12];
// 用于"类选择器的"断点（2xl 会让类名以数字开头，CSS 选择器不合法，故仅用于属性值）
const classBp = ['sm', 'md', 'lg', 'xl'];
// @media 条件不支持 var()，构建期展开为字面量
const mq = (b) => `@media (min-width:${bp[b]})`;

const L = [];
L.push('/* 小亮主题 — 工具类（Utilities）');
L.push(' * 间距 / 圆角 / 阴影 / 布局工具类，消费 colors_and_type.css 中的 Token 变量。');
L.push(' * 由 build-utilities.mjs 从 css.json 自动生成，请勿手改；改 Token 后运行 `npm run build`。');
L.push(' */');
L.push('');

// ---------- 间距 ----------
const spacingClasses = [
  ['p', 'padding'],
  ['px', 'padding-inline'],
  ['py', 'padding-block'],
  ['pt', 'padding-top'],
  ['pr', 'padding-right'],
  ['pb', 'padding-bottom'],
  ['pl', 'padding-left'],
  ['m', 'margin'],
  ['mx', 'margin-inline'],
  ['my', 'margin-block'],
  ['mt', 'margin-top'],
  ['mr', 'margin-right'],
  ['mb', 'margin-bottom'],
  ['ml', 'margin-left'],
];
for (const [cls, prop] of spacingClasses) {
  for (const s of spaceSteps) {
    L.push(`.${cls}-${s}{${prop}:var(--space-${s})}`);
  }
}
for (const s of spaceSteps) {
  L.push(`.gap-${s}{gap:var(--space-${s})}`);
  L.push(`.gap-x-${s}{column-gap:var(--space-${s})}`);
  L.push(`.gap-y-${s}{row-gap:var(--space-${s})}`);
}

// ---------- 圆角 ----------
for (const [k] of Object.entries(radius)) {
  L.push(`.rounded-${k}{border-radius:var(--radius-${k})}`);
}

// ---------- 阴影 ----------
for (const [k] of Object.entries(shadow)) {
  L.push(`.shadow-${k}{box-shadow:var(--shadow-${k})}`);
}

// ---------- 容器（响应式：随断点增长最大宽度） ----------
L.push('.container{width:100%;max-width:var(--container-max);margin-inline:auto;padding-inline:var(--space-4)}');
L.push('.container-fluid{width:100%;padding-inline:var(--space-4)}');
for (const b of ['sm', 'md', 'lg', 'xl', '2xl']) {
  L.push(`${mq(b)}{.container{max-width:var(--breakpoint-${b})}}`);
}

// ---------- Flex ----------
L.push(
  '.flex{display:flex}',
  '.inline-flex{display:inline-flex}',
  '.flex-col{flex-direction:column}',
  '.flex-row{flex-direction:row}',
  '.flex-wrap{flex-wrap:wrap}',
  '.flex-nowrap{flex-wrap:nowrap}',
  '.items-start{align-items:flex-start}',
  '.items-center{align-items:center}',
  '.items-end{align-items:flex-end}',
  '.items-stretch{align-items:stretch}',
  '.justify-start{justify-content:flex-start}',
  '.justify-center{justify-content:center}',
  '.justify-end{justify-content:flex-end}',
  '.justify-between{justify-content:space-between}',
  '.justify-around{justify-content:space-around}',
  '.flex-1{flex:1 1 0%}',
  '.flex-auto{flex:1 1 auto}',
  '.flex-none{flex:none}',
  '.flex-grow{flex-grow:1}',
  '.flex-shrink{flex-shrink:1}',
);

// ---------- Grid（基础 + 响应式栅格，暴露断点） ----------
L.push('.grid{display:grid}');
L.push('.grid-cols-none{grid-template-columns:none}');
for (const n of gridCols) {
  L.push(`.grid-cols-${n}{grid-template-columns:repeat(${n},minmax(0,1fr))}`);
}
for (const b of classBp) {
  for (const n of gridCols) {
    L.push(`${mq(b)}{.${b}\\:grid-cols-${n}{grid-template-columns:repeat(${n},minmax(0,1fr))}}`);
  }
}

// ---------- 显示工具（含响应式显隐） ----------
L.push('.block{display:block}', '.inline-block{display:inline-block}', '.hidden{display:none}');
for (const b of classBp) {
  L.push(`${mq(b)}{.${b}\\:block{display:block}}`);
  L.push(`${mq(b)}{.${b}\\:hidden{display:none}}`);
  L.push(`${mq(b)}{.${b}\\:flex{display:flex}}`);
}

// ---------- 可访问性 ----------
// 视觉隐藏但保留给屏幕阅读器；.focus:not-sr-only 用于聚焦时还原（如"跳转到主内容"链接）
L.push(
  '.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);clip-path:inset(50%);white-space:nowrap;border:0}',
  '.not-sr-only{position:static;width:auto;height:auto;padding:0;margin:0;overflow:visible;clip:auto;clip-path:none;white-space:normal}',
  '.focus\\:not-sr-only:focus{position:static;width:auto;height:auto;padding:0;margin:0;overflow:visible;clip:auto;clip-path:none;white-space:normal}',
);

const out = L.join('\n') + '\n';
writeFileSync(new URL('./utilities.css', import.meta.url), out, 'utf8');
console.log(`utilities.css generated: ${L.length} rules`);
