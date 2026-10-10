// build-icon-animations.mjs —— 从 lucide-animated 提取动画规格并生成纯 CSS 动画
//
// 为什么这样做：lucide-animated@1.7.x 是 React + Motion 的库（peer 依赖 react>=18、
// motion>=11，dist 1.44 MB），本主题无 React、无打包器、全程 file://，**不可直接引入**。
// 但它的动效本质是声明式的 VARIANTS 数据（opacity / pathLength / pathOffset /
// rotate / x / y / scale），这些词汇都能 1:1 映射到 CSS。
// 故本脚本把规格「翻译」成 @keyframes + :hover/[aria-pressed] 触发规则，
// **产物是一个 CSS 文件，运行时不需要任何 JS**（prefers-reduced-motion 自动降级）。
//
// 排除：含 `d` 路径形变的图标（8 个）——CSS `d` 属性或 SMIL 才能做，且与本主题
// 自己的 morph 能力重叠，暂不纳入。
//
// 用法：npm run build:anim
//   前置：outputs/la-probe/package/dist/index.js 存在（npm pack lucide-animated 解包）
import fs from 'node:fs';
import path from 'node:path';

const ROOT = import.meta.dirname;
const SRC_DIST = path.join(ROOT, 'outputs', 'la-probe', 'package', 'dist', 'index.js');
const OUT_CSS = path.join(ROOT, 'assets', 'icon-animations.css');
const REPORT = path.join(ROOT, 'outputs', 'icon-animations-manifest.json');

/* 策展清单：只收「对设计系统有用 + 在 lucide v1.8.0 里确实存在 + 动画可 CSS 化」的图标。
   刻意不做全量 402 个——大部分是货币符号/品牌图标/长尾别名，收益低于维护成本。 */
const CURATED = [
  // 状态与反馈
  'LoaderCircle', 'CircleCheck', 'CircleAlert', 'Wifi', 'Battery', 'BatteryLow', 'CloudRain',
  // 操作
  'Download', 'Upload', 'Search', 'Copy', 'Plus', 'Trash', 'RefreshCw',
  // 强调与动效点缀
  'Sparkles', 'Zap', 'Heart', 'Star', 'Flame', 'TrendingUp', 'Activity', 'Bell', 'ArrowRight',
];

if (!fs.existsSync(SRC_DIST)) {
  console.error('!! 找不到 ' + SRC_DIST);
  console.error('   请先执行：npm pack lucide-animated@1.0.5 并解包到 outputs/la-probe/');
  process.exit(1);
}
const src = fs.readFileSync(SRC_DIST, 'utf8');

/* ---------- 1. 抽取变体定义与图标组件 ---------- */
const defs = new Map();
const defRe = /var ([A-Z_0-9]+) = (\{[\s\S]*?\n\});\n/g;
let m;
while ((m = defRe.exec(src)) !== null) defs.set(m[1], { body: m[2], at: m.index });
/* 只保留真正的变体对象：必须含 animate: 分支。
 * 否则 DEFAULT_TRANSITION24 这类普通常量会因为「离组件更近」而顶掉真正的变体。 */
for (const [k, v] of [...defs]) {
  if (v.body.indexOf('animate:') < 0) defs.delete(k);
}

const icons = [];
const iconRe = /var (\w+)Icon = forwardRef\d+\(/g;
while ((m = iconRe.exec(src)) !== null) {
  /* 两种关联方式：
   *  A) 组件体内 `variants: XXX` 显式引用（变体可能定义在很靠前的地方）
   *  B) 变体就内联在组件定义之前，取最近的（部分图标没有 A 的显式引用）
   */
  const bodyStart = m.index;
  const body = src.slice(bodyStart, bodyStart + 4000);
  const refs = [...body.matchAll(/variants:\s*([A-Z_0-9]+)/g)].map((x) => x[1]);
  let bound = null;
  for (const r of refs) if (defs.has(r)) { bound = r; break; }
  if (!bound) {
    let bestDist = Infinity;
    for (const [vn, v] of defs) {
      const d = bodyStart - v.at;
      if (d > 0 && d < bestDist && d < 6000) { bestDist = d; bound = vn; }
    }
  }
  icons.push({ name: m[1], variantsVar: bound, at: bodyStart, refs });
}
const iconByName = new Map(icons.map((i) => [i.name, i]));

/* ---------- 2. 极简 VARIANTS 解析（只取 animate 分支里用到的键） ---------- */
function parseAnimate(body) {
  const at = body.indexOf('animate:');
  if (at < 0) return null;
  const seg = body.slice(at);
  const out = { props: {}, duration: null, ease: null, delay: 0, repeat: 1 };
  const dur = seg.match(/duration:\s*([\d.]+)/);
  if (dur) out.duration = parseFloat(dur[1]);
  const dl = seg.match(/delay:\s*([\d.]+)/);
  if (dl) out.delay = parseFloat(dl[1]);
  const rep = seg.match(/repeat:\s*(Number\.POSITIVE_INFINITY|[\d.]+|"infinite"|'infinite')/);
  if (rep) {
    const rv = rep[1];
    // 加载类图标靠 repeat:Infinity 持续转，丢了就不是「加载中」了
    out.repeat = (rv === 'Number.POSITIVE_INFINITY' || rv === '"infinite"' || rv === "'infinite'") ? Infinity : parseInt(rv, 10);
  }
  const ez = seg.match(/ease:\s*"([^"]+)"/);
  if (ez) out.ease = ez[1];
  for (const k of ['opacity', 'pathLength', 'pathOffset', 'scale', 'rotate', 'x', 'y']) {
    const re = new RegExp('(^|[\\s,{])' + k + '\\s*:\\s*(\\[[^\\]]*\\]|[-\\d.]+)');
    const r = seg.match(re);
    if (r) {
      let v = r[2];
      if (v[0] === '[') v = v.slice(1, -1).split(',').map((s) => parseFloat(s.trim()));
      else v = parseFloat(v);
      out.props[k] = v;
    }
  }
  return out;
}

/* Motion 的 ease 名 → CSS timing-function */
const EASE = {
  linear: 'linear',
  easeIn: 'cubic-bezier(0.42, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.58, 1)',
  easeInOut: 'cubic-bezier(0.42, 0, 0.58, 1)',
  circIn: 'cubic-bezier(0.55, 0, 1, 0.45)',
  circOut: 'cubic-bezier(0, 0.55, 0.45, 1)',
  backIn: 'cubic-bezier(0.36, 0, 0.66, -0.56)',
  backOut: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
};
const easeOf = (n) => EASE[n] || 'cubic-bezier(0.2, 0, 0, 1)';

/* 把 scale/rotate/x/y 合成一条 transform */
function transformOf(p, key) {
  const t = [];
  if (p.x !== undefined) t.push('translateX(' + (typeof p.x === 'number' ? p.x + 'px' : p.x) + ')');
  if (p.y !== undefined) t.push('translateY(' + (typeof p.y === 'number' ? p.y + 'px' : p.y) + ')');
  if (p.scale !== undefined) {
    const s = Array.isArray(p.scale) ? p.scale : [p.scale];
    t.push('scale(' + s[Math.min(key, s.length - 1)] + ')');
  }
  if (p.rotate !== undefined) {
    const r = Array.isArray(p.rotate) ? p.rotate : [p.rotate];
    t.push('rotate(' + r[Math.min(key, r.length - 1)] + 'deg)');
  }
  return t.length ? t.join(' ') : null;
}

/* ---------- 3. 逐图标生成关键帧 ---------- */
const used = [];
const skipped = [];
const chunks = [];

for (const name of CURATED) {
  const ic = iconByName.get(name);
  if (!ic || !ic.variantsVar) { skipped.push({ name, reason: '包内未找到变体定义' }); continue; }
  const body = defs.get(ic.variantsVar).body;
  if (/(^|[\s,{])d\s*:\s*\[/.test(body.slice(body.indexOf('animate:')))) {
    skipped.push({ name, reason: '含 d 路径形变，需 SMIL/CSS d，暂不纳入' });
    continue;
  }
  const a = parseAnimate(body);
  if (!a || !Object.keys(a.props).length) { skipped.push({ name, reason: 'animate 分支无 CSS 可映射属性' }); continue; }

  const p = a.props;
  const keyName = 'la-' + name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

  // 关键帧序列：数组型属性按其长度展开，否则两帧
  const len = Math.max(
    ...['opacity', 'pathLength', 'pathOffset', 'scale', 'rotate', 'x', 'y']
      .filter((k) => Array.isArray(p[k]))
      .map((k) => p[k].length),
    2
  );
  const frames = [];
  for (let i = 0; i < len; i++) {
    const decl = [];
    if (p.opacity !== undefined) {
      const v = Array.isArray(p.opacity) ? p.opacity[Math.min(i, p.opacity.length - 1)] : p.opacity;
      decl.push('opacity: ' + v);
    }
    // pathLength：CSS 侧靠 pathLength="1" 归一化后用 dasharray/dashoffset 画线
    const draws = p.pathLength !== undefined || p.pathOffset !== undefined;
    if (draws) {
      const pl = p.pathLength !== undefined
        ? (Array.isArray(p.pathLength) ? p.pathLength[Math.min(i, p.pathLength.length - 1)] : p.pathLength)
        : null;
      const off = p.pathOffset !== undefined
        ? (Array.isArray(p.pathOffset) ? p.pathOffset[Math.min(i, p.pathOffset.length - 1)] : p.pathOffset)
        : null;
      if (pl !== null) {
        decl.push('stroke-dasharray: ' + pl);
        decl.push('stroke-dashoffset: ' + (1 - pl));
      } else if (off !== null) {
        decl.push('stroke-dasharray: 1');
        decl.push('stroke-dashoffset: ' + off);
      }
    }
    const tf = transformOf(p, i);
    if (tf) decl.push('transform: ' + (i === len - 1 ? 'none' : tf));
    frames.push('  ' + Math.round((i / (len - 1)) * 100) + '% { ' + decl.join('; ') + ' }');
  }

  const dur = (a.duration || 0.6) * 1000;
  const delay = (a.delay || 0) * 1000;
  const iter = a.repeat === Infinity ? ' infinite' : (a.repeat > 1 ? ' ' + a.repeat : '');
  const timing = easeOf(a.ease);

  chunks.push(
    '@keyframes ' + keyName + ' {\n' + frames.join('\n') + '\n}\n' +
    '[data-anim="' + name + '"]:hover svg > *,\n' +
    '[data-anim="' + name + '"][aria-pressed="true"] svg > *,\n' +
    '[data-anim="' + name + '"].is-playing svg > * {\n' +
    '  animation: ' + keyName + ' ' + Math.round(dur) + 'ms ' + timing + ' ' + Math.round(delay) + 'ms' + iter + ' both;\n' +
    '}\n'
  );
  used.push({ name, key: keyName, props: Object.keys(p), durationMs: Math.round(dur), delayMs: Math.round(delay), ease: a.ease || 'default', repeat: a.repeat === Infinity ? 'infinite' : a.repeat, frames: len });
}

/* ---------- 4. 输出 ---------- */
const header = `/* ============================================================================
 * icon-animations.css —— 由 build-icon-animations.mjs 生成，请勿手工编辑
 *
 * 动画规格来源：lucide-animated@1.0.5（MIT），经脚本提取 VARIANTS 后翻译为 CSS
 * keyframes。运行时不需要任何动画 JS。
 *
 * 用法：<i class="anim-icon" data-anim="LoaderCircle"></i>
 *   · 悬停播放；也可用 [aria-pressed="true"] 或 .is-playing 触发
 *   · 描边画线类动画（pathLength）依赖 JS 端给路径加 pathLength="1"
 *   · prefers-reduced-motion: reduce 由本主题全局兜底强制降级
 *
 * 可用图标（${used.length} 个，data-anim 的值）：
 *   ${used.map((u) => u.name).join('、')}
 * 未收录：含 d 路径形变的图标（需 SMIL/CSS d），以及包内无同名动画的图标。
 * ========================================================================== */

.anim-icon { display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; width: var(--anim-icon-size, 24px); height: var(--anim-icon-size, 24px); color: inherit; line-height: 0; }
.anim-icon svg { display: block; width: 100%; height: 100%; }
.anim-icon svg > * { fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.anim-icon.is-xs { --anim-icon-size: 16px; }
.anim-icon.is-sm { --anim-icon-size: 18px; }
.anim-icon.is-lg { --anim-icon-size: 28px; }
.anim-icon.is-xl { --anim-icon-size: 40px; }
.anim-icon[role="button"], button.anim-icon { cursor: pointer; }
.anim-icon:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }

`;

fs.writeFileSync(OUT_CSS, header + chunks.join('\n'), 'utf8');
fs.writeFileSync(REPORT, JSON.stringify({
  source: 'lucide-animated@1.0.5 (MIT)',
  generated: used.length,
  skipped,
  icons: used,
}, null, 1), 'utf8');

console.log('已生成 ' + path.relative(ROOT, OUT_CSS) + '（' + used.length + ' 个图标）');
console.log('已写清单 ' + path.relative(ROOT, REPORT));
if (skipped.length) {
  console.log('跳过 ' + skipped.length + ' 个：');
  skipped.forEach((s) => console.log('   - ' + s.name + '：' + s.reason));
}
