# 图标形变（Icon Morph）

在两个 Lucide 图标之间做**路径形变**（path morphing），例如 `menu ↔ x`、`play ↔ pause`、`lock ↔ unlock`。它介于「静态图标」与「Lottie 动画图标」之间：**不引入任何图标文件**，图标源仍然是 `assets/icons/lucide.min.js`（Lucide v1.8.0）。

引擎是 vendored 的 [morphicons](https://github.com/guillermolg00/morphicons) **1.7.1**（MIT，`Copyright (c) 2026 Guillermo`），已预打包为 `assets/icons/morph.min.js`（约 16 KB 的经典脚本 IIFE），**无需打包器、无网络请求**，可在 `file://` 与严格 CSP 下工作。

> 为什么不用 Lordicon：其[主题授权条款](https://lordicon.com/docs/license/themes)明文禁止「把图标作为独立文件包含进产品」「允许用户改颜色/描边/尺寸/自定义触发」「用在以图标为核心的产品里」，与本主题的 MIT 分发方式正面冲突，且其运行时在 `file://` 下无法工作。完整论证见 `outputs/icon-feasibility/可行性验证报告.md`。

---

## 快速开始

```html
<link rel="stylesheet" href="colors_and_type.css">
<link rel="stylesheet" href="components.css">

<!-- 顺序固定：先 Lucide，再引擎，最后适配器 -->
<script src="assets/icons/lucide.min.js"></script>
<script src="assets/icons/morph.min.js"></script>
<script src="assets/morph-icons.js"></script>

<i class="morph-icon" data-morph-icon="menu-x" aria-label="菜单与关闭"></i>
```

适配器在 `DOMContentLoaded` 自动扫描 `[data-morph-icon]` 并挂载，不需要手动初始化。如需在动态插入节点后重新扫描：

```js
XLMorph.refresh();
```

---

## 属性

| 属性 | 必填 | 取值 | 说明 |
|---|---|---|---|
| `data-morph-icon` | ✅ | 白名单键，如 `menu-x` | 不在白名单内会被拒绝挂载并打印警告 |
| `data-morph-trigger` | | `click`（默认）/ `hover` / `view` / `state` | 触发方式 |
| `data-morph-speed` | | `fast` / `base`（默认）/ `slow` / `emphasis` | 对应主题节奏 |
| `data-morph-label` | | 文本 | 运行时会写成 `aria-label`；已直接写 `aria-label` 时可省略 |

### 触发器

| 值 | 行为 | 交互性 |
|---|---|---|
| `click` | 点击在两侧图标间来回形变；`Enter` / `Space` 等效 | 交互式 |
| `hover` | 悬停进入目标图标、移出回到起始图标；键盘聚焦同样生效 | 非交互 |
| `view` | 首次进入视口播放一次，随后停止观察 | 非交互 |
| `state` | 与 `aria-pressed` 双向绑定：点击翻转属性，外部改属性形变跟着走 | 交互式 |

交互式用法若宿主不是 `<button>` / `<a href>`，适配器会自动补 `role="button"` 与 `tabindex="0"` 并接管 `Enter` / `Space`。

### 尺寸与颜色

```html
<span class="morph-icon"           data-morph-icon="bell-bell-off" data-morph-trigger="hover"></span>
<span class="morph-icon is-xs"     data-morph-icon="bell-bell-off" data-morph-trigger="hover"></span>
<span class="morph-icon is-sm"     data-morph-icon="bell-bell-off" data-morph-trigger="hover"></span>
<span class="morph-icon is-lg"     data-morph-icon="bell-bell-off" data-morph-trigger="hover"></span>
<span class="morph-icon is-xl"     data-morph-icon="bell-bell-off" data-morph-trigger="hover"></span>
```

- 档位：`is-xs` 16px / `is-sm` 18px / 默认 24px / `is-lg` 28px / `is-xl` 40px。
- 也可直接写 `style="--morph-icon-size: 22px"`。
- 颜色 `color: inherit`，所以放进 `.btn-primary` 会自动跟随按钮前景色。`.btn` / `.alert` 内部由组件样式统一为 18px。

---

## 速度映射（实测标定）

`data-morph-speed` 映射到 spring 参数，**按 `progress` 到达 90% 的时刻**对齐主题节奏：

| `data-morph-speed` | spring `{stiffness, damping}` | 50% | 90% | 对应主题 token |
|---|---|---|---|---|
| `fast` / `base` | `{420, 30}`（ζ=0.73） | 84 ms | **134 ms** | `--motion-duration-base` 180ms |
| `slow` | `{300, 30}`（ζ≈0.87） | 99 ms | **200 ms** | `--motion-duration-slow` 280ms |
| `emphasis` | `{170, 26}`（ζ=1.00） | 135 ms | **300 ms** | `--motion-duration-emphasis` 420ms |

刻意**不提供**库自带的 `bouncy`（`{300, 14}`）：它过冲到 `x=1.244` 后来回振荡近 1 秒，图标形变会看起来「弹坏」。

> 库自身的 `settle()` 判据是 `|1−x| < 0.001 && |v| < 0.02`，尾段极长且不可感知（`base` 约 450ms、`emphasis` 约 733ms）。做动效设计请以上表的 90% 时刻为准。

---

## 无障碍

- **装饰性**（未提供可访问名的非交互用法）→ 自动 `aria-hidden="true"`。
- **交互式** → 必须有可访问名：直接写 `aria-label`，或用 `data-morph-label`；缺失时控制台警告。
- 内部 `<svg>` 始终 `aria-hidden="true"` + `focusable="false"`，语义由宿主元素承担。
- **减少动效**：`<html data-motion="off">` → 立即跳变（`reducedMotion: "always"`）；其余情况 → 跟随系统 `prefers-reduced-motion: reduce`（`reducedMotion: "user"`）。**状态切换在任何情况下都会完成**，只是不播放补间。
- 属性变化是实时的：运行中切换 `data-motion` 会对所有已挂载实例即时生效，无需刷新。

> 注意：morphicons 的默认值是 `"never"`（**不跟随系统**），适配器已无条件覆盖为上面的口径。

---

## 可用配对（白名单）

只有下表 23 组可以开放。**路径形变不保证观感**——子路径数量差异过大时中间态会塌成实心块或细碎斑点，所以必须策展，不能让使用者任意配对。

| 配对键 | 图标 | 语义 |
|---|---|---|
| `menu-x` | `Menu ↔ X` | 菜单 / 关闭 |
| `plus-minus` | `Plus ↔ Minus` | 展开 / 折叠 |
| `play-pause` | `Play ↔ Pause` | 播放 / 暂停 |
| `lock-unlock` | `Lock ↔ Unlock` | 锁定 / 解锁 |
| `eye-eye-off` | `Eye ↔ EyeOff` | 显示 / 隐藏 |
| `bell-bell-off` | `Bell ↔ BellOff` | 通知 / 免打扰 |
| `volume-volume-x` | `Volume2 ↔ VolumeX` | 有声 / 静音 |
| `download-upload` | `Download ↔ Upload` | 下载 / 上传 |
| `maximize-minimize` | `Maximize2 ↔ Minimize2` | 放大 / 缩小 |
| `smile-frown` | `Smile ↔ Frown` | 满意 / 不满意 |
| `star-heart` | `Star ↔ Heart` | 收藏 / 喜欢 |
| `square-circle` | `Square ↔ Circle` | 方形 / 圆形 |
| `rotate-ccw-cw` | `RotateCcw ↔ RotateCw` | 撤销 / 重做 |
| `folder-folder-open` | `Folder ↔ FolderOpen` | 目录 收起 / 展开 |
| `panel-left-right` | `PanelLeft ↔ PanelRight` | 左栏 / 右栏 |
| `toggle-left-right` | `ToggleLeft ↔ ToggleRight` | 开关 左 / 右 |
| `check-alert` | `CircleCheck ↔ AlertCircle` | 通过 / 警示 |
| `copy-check` | `Copy ↔ Check` | 复制 / 已复制 |
| `trending-up-down` | `TrendingUp ↔ TrendingDown` | 上升 / 下降 |
| `mic-mic-off` | `Mic ↔ MicOff` | 开麦 / 闭麦 |
| `wifi-wifi-off` | `Wifi ↔ WifiOff` | 联网 / 断网 |
| `user-users` | `User ↔ Users` | 单人 / 多人 |
| `arrow-right-left` | `ArrowRight ↔ ArrowLeft` | 前进 / 后退 |

### 明确不开放

| 配对 | 原因 |
|---|---|
| `sun ↔ moon`（9↔1 子路径） | 中间态塌成环形斑点后成一坨实心块 |
| `loader ↔ loader-2`（8↔1 子路径） | 同上；且旋转才是正确语义 |
| `grid ↔ list`（5↔6 子路径） | 中间态笔画塌陷消失，出现三角形幻觉 |
| `copy ↔ check`（2↔1 子路径） | 中间态出现钩状伪影，需单独评审后再定 |
| `chevron-down ↔ up`、`chevron-left ↔ right` | 技术正确但中间态塌成折角，**旋转过渡更合适** |

### 增补新配对的流程

1. 在 `outputs/icon-feasibility/morph-poc/poc-pairs.mjs` 的 `PAIRS` 里加上候选对，跑一遍；
2. 看 `make-pairs-sheet.py` 生成的 `morph-pairs-grid.png` 关键帧对比图，并读 `pairs-metrics.json` 的 `blobRatio`；
3. 判定口径：`blobRatio = max(ink@34%, ink@67%) / max(ink@0%, ink@100%)`，**偏离 1 越多越糟**（>1.25 叠成一坨，<0.6 塌到看不见）；但该指标只捕捉塌陷/叠块，**捕捉不到「本该旋转」的情况，必须人眼复核**；
4. 通过后追加到 `assets/morph-icons.js` 的 `PAIRS`，并把关键帧图与结论记录进本节。

---

## 与静态 Lucide 图标共存

两者图标源相同，可在同一页并存：`<i data-lucide="search">` + `lucide.createIcons()` 走既有通道，`[data-morph-icon]` 走本适配器，二者互不干扰，**同一元素只用其一**。

---

## 提交前必须注意的审计纪律

`npm run audit:icons` 用几何签名比对 Lucide，以下三条是硬约束（都有实测依据）：

1. **源码里不要出现形变用的 `<path d>`**。适配器在运行时用 `createElementNS` 建 SVG —— 这样源码中只有 Lucide 原始路径或根本没有路径，审计看不见中间态。把形变中间态的 `d` 内联进源码会直接报 `non-lucide-svg`。
2. **不要留空的 `<svg>` 字面量**。审计只识别 `path`/`circle`/`line`/`polyline`/`polygon`/`rect`，空 `<svg>` 或只含 `<g>`/`<use>` 的块会误报 `non-lucide-svg`。
3. **`outputs/` 也在审计扫描范围内**（`audit-icons.mjs` 的 `SKIP` 不含它）。往 `outputs/` 放含非 Lucide `<svg>` 的 Demo 会让 `npm run audit:icons` 变红。

提交前跑：

```bash
npm run build      # 会重生成 components.css（新预览页的 .morph-icon 规则）
npm run audit      # contrast + a11y + icons + motion
npm run test:visual
```

---

## 重新生成引擎

`assets/icons/morph.min.js` 是**预打包产物，按原样提交**，运行时不经任何构建步骤。只有升级 morphicons 版本时才需要：

```bash
npm run build:morph     # = node build-morph-runtime.mjs
```

它会在 `outputs/.morph-build/` 里临时装 `morphicons` 与 `esbuild`（不写入本仓依赖），打出 IIFE 并前置 MIT 许可头。**重新生成后必须重跑 `npm run audit` 与 `npm run test:visual`，并人工复核预览页观感。**

---

## JS API

```js
XLMorph.pairs      // 白名单（只读参考，勿就地修改）
XLMorph.version    // 'morphicons@1.7.1'
XLMorph.init(root) // 在 root 子树内扫描并挂载，返回挂载数
XLMorph.refresh()  // 重新扫描（动态插入节点后用）
XLMorph.to(el, 'X', { spring: { stiffness: 300, damping: 30 } })  // 编程式形变
```

`XLMorph.to` 的图标名必须是 Lucide 中真实存在的图标，且**建议只使用白名单涉及的图标**——任意配对观感不可控。

---

# 换图标过渡（Icon Swap）

与形变互补的一路：**形变是「同一轮廓改变形状」，换图标是「两个不同图标之间淡入淡出」**。同一个运行时（`assets/morph-icons.js`）实现，共用 Lucide 取用、触发器、无障碍与 `data-motion` 接线。

## 为什么不需要白名单

形变必须策展，是因为路径插值在子路径数量差异过大时会**塌陷成实心块**。换图标只是「换掉整个 SVG 再淡入淡出」，不存在插值，因此**任意 Lucide 图标名都可以配对**，不需要审批流程。

## 快速开始

```html
<!-- 必需：两个 Lucide 图标名，用 | 分隔 -->
<span class="icon-swap is-xl" data-icon-swap="Bell|BellOff" aria-label="通知开关"></span>

<!-- 触发器：click（默认）/ hover / state -->
<span class="icon-swap" data-icon-swap="Wifi|WifiOff" data-swap-trigger="hover"></span>

<!-- 过渡风格：fade（默认）/ fade-scale / scale -->
<button class="icon-swap" data-icon-swap="Search|X" data-swap-style="fade-scale"></button>

<!-- 速度：读 --motion-duration-* token -->
<button class="icon-swap" data-icon-swap="ArrowRight|ArrowLeft" data-swap-speed="slow"></button>
```

## 属性

| 属性 | 必填 | 取值 | 说明 |
|---|---|---|---|
| `data-icon-swap` | ✅ | `图标A\|图标B` | 两个真实存在的 Lucide 图标名；非法则**拒绝挂载并告警** |
| `data-swap-trigger` | | `click`（默认）/ `hover` / `state` | 与形变触发器语义一致 |
| `data-swap-style` | | `fade`（默认）/ `fade-scale` / `scale` | 是否附带缩放 |
| `data-swap-speed` | | `fast` / `base`（默认）/ `slow` | 读 `--motion-duration-fast/base/slow` |
| `aria-label` | | 文本 | 交互式用法**应当**提供；纯装饰可省略，适配器会自动 `aria-hidden` |

尺寸档位用 `.is-xs / .is-sm / .is-lg / .is-xl`，与 `.morph-icon` 同规格（`--swap-icon-size`），便于同处摆放。

## 无障碍与动效

- 与形变共用 `makeInteractive` / `applyA11y`：`role="button"`、`tabindex`、`Enter`/`Space`、以及缺可访问名时的告警或 `aria-hidden` 兜底，行为一致。
- `prefers-reduced-motion: reduce` 或 `<html data-motion="off">` 时**立即换图标、不播过渡**（判定实现在 `show()` 内部，点击/悬停/状态/编程式四条路径一次覆盖）。
- 时长由 JS 读 motion token 后写入 `--swap-dur`，**Token 仍是唯一真值**，CSS 只消费变量。

## JS API

```js
XLMorph.swapTo(el, 'BellOff')      // 编程式换图标（图标名须在该元素的配对内）
XLMorph.counts                     // { morph, swap } 最近一次 init 的挂载数
```

## 关键帧

`xl-swap-out` / `xl-swap-in` 及其 `-scale` 变体共 6 个，定义在 `colors_and_type.css` 的动效区（token 区之外，`build:tokens` 不覆盖）。只用 `opacity` 与 `transform`——图标只有 24×24，位移与缩放必须克制，否则过渡比图标本身还抢眼。
