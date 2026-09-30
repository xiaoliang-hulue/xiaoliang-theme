// build-tokens.mjs
// 从 css.json 单一来源生成 colors_and_type.css 中的 Token 区块（含浅色 :root 与深色双触发块）。
// 用法：node build-tokens.mjs
// 设计目标：深色值只在此处定义一次，[data-theme="dark"] 与 @media(prefers-color-scheme) 两处均由同一生成源产出，
// 避免手动维护时「手动切深色正常、系统自动深色失效」的漂移。
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cssPath = join(__dirname, 'colors_and_type.css');
const json = JSON.parse(readFileSync(join(__dirname, 'css.json'), 'utf8'));

const START = '/* @@TOKENS-START@@ */';
const END = '/* @@TOKENS-END@@ */';

const decl = (name, val) => `  --${name}: ${val};`;

// ── 浅色 / 主题无关 Token（:root）──
const light = [];
light.push('  color-scheme: light dark;');
for (const [k, v] of Object.entries(json.light.primary)) light.push(decl(`primary-${k}`, v));
for (const [k, v] of Object.entries(json.light.gray)) light.push(decl(`gray-${k}`, v));
for (const [k, v] of Object.entries(json.light.semantic)) light.push(decl(k, v));
for (const [k, v] of Object.entries(json.light.aliases)) light.push(decl(k, v));
for (const [k, v] of Object.entries(json.font.family)) light.push(decl(`font-${k}`, v));
for (const [k, v] of Object.entries(json.font.size)) light.push(decl(`text-${k}`, v));
for (const [k, v] of Object.entries(json.font.weight)) light.push(decl(`font-${k}`, v));
for (const [k, v] of Object.entries(json.radius)) light.push(decl(`radius-${k}`, v));
for (const [k, v] of Object.entries(json.spacing)) light.push(decl(`space-${k}`, v));
for (const [k, v] of Object.entries(json.motion)) light.push(decl(`motion-${k}`, v));
for (const [k, v] of Object.entries(json.shadow)) light.push(decl(`shadow-${k}`, v));
if (json.breakpoints) {
  for (const [k, v] of Object.entries(json.breakpoints)) {
    if (k === 'container-max') light.push(decl('container-max', v));
    else light.push(decl(`breakpoint-${k}`, v));
  }
}
const lightBlock = `:root {\n${light.join('\n')}\n}`;

// ── 深色 Token（仅与浅色不同的部分）──
const dark = [];
for (const [k, v] of Object.entries(json.dark.primary)) dark.push(decl(`primary-${k}`, v));
for (const [k, v] of Object.entries(json.dark.gray)) dark.push(decl(`gray-${k}`, v));
for (const [k, v] of Object.entries(json.dark.semantic)) dark.push(decl(k, v));
for (const [k, v] of Object.entries(json.dark.aliases)) dark.push(decl(k, v));
const darkDecls = dark.join('\n');
const darkBlock =
  `:root[data-theme="dark"],\n.dark {\n${darkDecls}\n}\n\n` +
  `/* 自动跟随系统偏好：用户未显式指定浅色时，系统深色即应用深色 Token */\n` +
  `@media (prefers-color-scheme: dark) {\n` +
  `  :root:not([data-theme="light"]) {\n${darkDecls}\n  }\n}`;

const generated = `${lightBlock}\n\n${darkBlock}\n`;

// ── 注入标记区 ──
let css = readFileSync(cssPath, 'utf8');
if (css.includes(START) && css.includes(END)) {
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`${esc(START)}[\\s\\S]*?${esc(END)}`);
  css = css.replace(re, `${START}\n${generated}${END}`);
} else {
  css = css.replace('/* Typography utilities */', `${START}\n${generated}${END}\n\n/* Typography utilities */`);
}
writeFileSync(cssPath, css, 'utf8');
console.log('已重新生成 colors_and_type.css 的 Token 区块（深色值由 css.json 单一来源产出，[data-theme] 与 @media 两处同步）。');
