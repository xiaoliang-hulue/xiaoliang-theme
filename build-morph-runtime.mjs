#!/usr/bin/env node
/* build-morph-runtime.mjs — 重新生成 assets/icons/morph.min.js
 * ─────────────────────────────────────────────────────────────
 * 小亮主题刻意不引入打包器：`assets/icons/morph.min.js` 是「预打包好的 vendored 产物」，
 * 和 `assets/icons/lucide.min.js` 一样按原样提交，运行时不经过任何构建步骤。
 *
 * 只有在你确实要升级 morphicons 版本时才需要跑本脚本：
 *
 *   node build-morph-runtime.mjs
 *
 * 它会：
 *   1. 在 outputs/.morph-build/ 里临时安装 morphicons 与 esbuild（不写入本仓依赖）；
 *   2. 打成 IIFE（--format=iife --target=es2020 --minify）；
 *   3. 前置 MIT 许可头后写入 assets/icons/morph.min.js。
 *
 * 重新生成后必须重跑：npm run audit && npm run test:visual
 * 并且人工复核 preview/component-morph-icon.html 的观感是否仍然正常。
 * ─────────────────────────────────────────────────────────────
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const MORPHICONS_VERSION = '1.7.1';
const SCRATCH = path.join(ROOT, 'outputs', '.morph-build');
const TARGET = path.join(ROOT, 'assets', 'icons', 'morph.min.js');

const HEADER = `/*!
 * 小亮主题 — 图标形变运行时（vendored，请勿手工编辑）
 *
 * morphicons@${MORPHICONS_VERSION} — MIT License, Copyright (c) 2026 Guillermo
 * https://github.com/guillermolg00/morphicons
 *
 * 由 esbuild 预打包为经典脚本（IIFE），导出：
 *   window.MorphIcons = { createMorph, canonicalD, version }
 * 因此无需打包器、无需 ESM、可在 file:// 与严格 CSP（connect-src 'none'）下使用。
 *
 * 重新生成：node build-morph-runtime.mjs（需临时装 esbuild 与 morphicons）
 * 重新生成后请务必重跑 npm run audit 与 npm run test:visual。
 */


`;

const ENTRY = `import { createMorph, canonicalD } from "morphicons/dom";

globalThis.MorphIcons = {
  createMorph,
  canonicalD,
  version: "morphicons@${MORPHICONS_VERSION}"
};
`;

function run(command, args, cwd) {
  execFileSync(command, args, { cwd, stdio: 'inherit' });
}

function main() {
  mkdirSync(SCRATCH, { recursive: true });
  writeFileSync(path.join(SCRATCH, 'entry.js'), ENTRY, 'utf8');

  console.log('[build:morph] 安装临时依赖 morphicons@' + MORPHICONS_VERSION + ' 与 esbuild …');
  run('npm', ['install', '--no-save', '--no-audit', '--no-fund', `morphicons@${MORPHICONS_VERSION}`, 'esbuild'], SCRATCH);

  const esbuild = path.join(SCRATCH, 'node_modules', '.bin', process.platform === 'win32' ? 'esbuild.cmd' : 'esbuild');
  if (!existsSync(esbuild)) throw new Error('找不到 esbuild：' + esbuild);

  const bundle = path.join(SCRATCH, 'morph.iife.js');
  console.log('[build:morph] 打包 IIFE …');
  run(esbuild, [
    path.join(SCRATCH, 'entry.js'),
    '--bundle',
    '--format=iife',
    '--minify',
    '--target=es2020',
    `--outfile=${bundle}`
  ], SCRATCH);

  const body = readFileSync(bundle, 'utf8');
  if (!body.includes('MorphIcons')) throw new Error('打包产物里没有 MorphIcons，esbuild 参数可能被改动过。');

  const output = HEADER + body;
  writeFileSync(TARGET, output, 'utf8');

  const sha = createHash('sha256').update(output).digest('hex');
  console.log('[build:morph] 已写入 ' + path.relative(ROOT, TARGET));
  console.log('[build:morph] 字节数 ' + Buffer.byteLength(output) + ' · sha256 ' + sha);
  console.log('[build:morph] 下一步：npm run audit && npm run test:visual');
}

main();
