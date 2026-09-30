#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const json = JSON.parse(read('css.json'));
const css = read('colors_and_type.css');
const themeJs = read('theme.js');
const components = read('components.css');

const errors = [];
const requireText = (text, expected, label) => {
  if (!text.includes(expected)) errors.push(`${label}: 缺少 ${expected}`);
};

const requiredMotionKeys = [
  'duration-fast',
  'duration-base',
  'duration-slow',
  'duration-emphasis',
  'ease-standard',
  'ease-emphasized',
  'ease-spring',
  'distance-sm',
  'distance-md',
  'distance-lg',
  'scale-press',
  'scale-hover',
  'stagger-step',
];

if (!json.motion || typeof json.motion !== 'object') {
  errors.push('css.json: 缺少 motion 对象');
} else {
  for (const key of requiredMotionKeys) {
    if (!json.motion[key]) errors.push(`css.json: motion.${key} 缺失`);
  }
}

for (const key of requiredMotionKeys) {
  requireText(css, `--motion-${key}:`, 'colors_and_type.css');
}
requireText(css, '[data-motion="off"]', 'colors_and_type.css');
requireText(css, '[data-motion="subtle"]', 'colors_and_type.css');
requireText(css, '@media (prefers-reduced-motion: reduce)', 'colors_and_type.css');
requireText(components, '@keyframes btn-spin', 'components.css');
requireText(components, '@keyframes drawer-in-right', 'components.css');
requireText(components, '@media (prefers-reduced-motion: reduce)', 'components.css');
requireText(themeJs, 'OVERLAY_EXIT_MS', 'theme.js');
requireText(themeJs, 'is-closing', 'theme.js');
requireText(themeJs, 'prefersReducedMotion', 'theme.js');
requireText(themeJs, 'is-toast-closing', 'theme.js');
requireText(themeJs, 'initAccordions', 'theme.js');

if (errors.length) {
  console.error(`动效契约未通过，共 ${errors.length} 项：`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log('动效契约通过：Token、控制入口、关键帧、浮层退出与减少动效均已接入。');
