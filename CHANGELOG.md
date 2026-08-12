# 更新日志 (Changelog)

本文件记录小亮主题的每个发布版本变更。版本号遵循语义化版本规范 (SemVer)。

---

## [1.4.8] - 2026-08-12

### 改进（夜间模式降饱和 · 日间微调 · 两模式饱和度平衡）

**背景**：全面审查日间/夜间共用颜色变量，发现夜间模式饱和度整体偏高（主色/亮端色阶/语义色 S100 满饱和、文字带蓝相、背景带蓝相），日间相对显得「发灰」，两模式视觉观感失衡。

**调整原则**：以日间设计规范饱和度为准绳——日间保持标准（Tailwind 系），夜间统一降饱和至柔和区间（S 60~85），同组色两模式过渡自然。

- **夜间降饱和（核心）**：
  - 主色 `--color-primary`：`#6ea8ff`(S100) → `#7eb0f1`(S80)，hover `#8ab8ff`(S100) → `#9bc1f3`(S79)——去荧光，落深底更柔和
  - 亮端色阶 800/900/950：`#b3cdff/#dbe6ff/#eef4ff`(S100) → `#bacff7/#dfe9fb/#f2f5fd`(S79/78/73)
  - 语义色：error `#f87171`(S91) → `#ed7e7e`(S76)、success `#4ade80`(S69) → `#51d682`(S62)、warning `#fbbf24`(S96) → `#eeb52f`(S85)、fav-on `#fbbf24`(S96) → `#f2a92c`(S88)
  - 文字去蓝：正文 `#e6edf3`(S35) → `#ebecef`(S11)、次要 `#aeb9c7`(S18) → `#b3b8c1`(S10)、辅助 `#8b98a9`(S15) → `#8f96a3`(S10)
  - 背景族收敛蓝相：background `#0d1117`(S28) → `#0f1115`(S17)、surface `#151a21`(S22) → `#181b21`(S16)、elevated `#1b2230`(S28) → `#1f242e`(S19)、border `#303d4d`(S23) → `#373d49`(S14)、border-subtle `#262f3d`(S23) → `#2b2f36`(S11)
  - 语义底降饱和：error-bg `#450a0a` → `#3b1111`、success-bg `#052e16` → `#0b2816`、warning-bg `#451a03` → `#372410`
- **日间微调（提升至标准）**：`--color-text-subtle` `#6b7280`(S9) → `#677183`(S12)，提升蓝相与对比（4.83 → 4.92，AA 达标）；其余日间色已是规范标准值，未动
- **对比度复核（全部达标）**：日间正文 17.93 / 主色 5.17 / 辅助 4.92；夜间正文 16.0 / 主色 8.43 / hover 10.18 / error 6.19 / success 8.49 / warning 7.94 / 信息 4.52——均 ≥ WCAG 2.1 AA 4.5:1（文字）
- **顺带修复**：`preview/index.html` 切换脚本尊重页面已有 `data-theme`（与 `_theme.js` 一致），修复系统深色覆盖手写浅色的问题
- 审计全绿：对比度 32 项 pass=30/exempt=2/fail=0、a11y allPass、图标 0 问题
- **下游同步**：build_xl.py 深色快照 38 处 + 四章产物重建 + quiz-platform-generator 模板/selfcheck 断言同步，selfcheck **185 项全过 EXIT=0**

---

## [1.4.7] - 2026-08-12

### 改进（预览页统一明暗切换 · 产物去重瘦身）

- **预览页统一明暗切换入口**：新增 `preview/_theme.js` 公共片段（自动注入右上角切换按钮，尊重页面已有 `data-theme`、跟随系统偏好、点击手动切换），31 个此前无切换入口的预览页（26 个组件页 + page-dashboard/detail/form/list + tokens）统一引入；`index.html` 保留原有更完整的切换脚本。现在所有 32 个预览页均可手动切换明暗模式。
- **components.css 聚合去重**：`extract-components-css.mjs` 新增按「选择器 + 规范化声明块」去重逻辑（同一选择器完全相同的声明只保留首次出现；不同版本保留声明条数最多的完整版，如 `.btn` 保留含 `flex-shrink:0` 的完整定义）。`components.css` 从 42677B 减至 32284B（**-24.4%**），275 条规则，合并完全重复 19 条；`.page-ellipsis`/`.badge`/`.avatar` 等合法覆盖不受影响。
- **渲染等价验证**：新旧 components.css 对 5 个代表性预览页（button/card/table/dashboard/form）无头 Edge 截图像素对比，4 页 0 差异、1 页仅 0.0069% 抗锯齿微差；语义等价确认（0 声明不匹配，多行选择器完整保留）。
- 审计全绿：`npm run audit` → 对比度 32 项 pass=30/exempt=2/fail=0、a11y allPass、图标 0 问题。
- 同步：用户级 Skill 副本 `assets/components.css` / `assets/preview/*` 已同步。

---

## [1.4.6] - 2026-08-12

### 修复（夜间模式配色 · 统一柔和护眼）

- **深色 Token 全面调优**（`css.json` dark/aliases → `build-tokens.mjs` 重建 `colors_and_type.css` 两处深色作用域同步产出）：深色底由纯黑改为柔和蓝黑，文字层级分明、主色提亮、边框提亮，解决 6 个预览页夜间观感不一致、发闷、层级不清的问题。
- 具体变更：
  - 背景：`--color-background` `#0a0a0a`→`#0d1117`（柔和蓝黑）、`--color-surface` `#111111`→`#151a21`、`--color-surface-elevated/muted` `#1a1a1a`→`#1b2230`。
  - 文字：`--color-text` `#f5f5f5`→`#e6edf3`（柔和亮白）、`--color-text-secondary` `#a3a3a3`→`#aeb9c7`、`--color-text-subtle` `#a3a3a3`→`#8b98a9`。
  - 主色：`--color-primary` `#4b85f6`→`#6ea8ff`（提亮，深底对比明显）、`--color-primary-hover` `#6394fa`→`#8ab8ff`、`--color-on-primary` `#0a0a0a`→`#0d1117`。
  - 边框：`--color-border` `#262626`→`#303d4d`、`--color-border-subtle` `#1a1a1a`→`#262f3d`（卡片/分隔线夜间可见）。
- **对比度（实测，全部达标）**：正文/背景 16.02:1、次要/背景 9.52:1、subtle/背景 6.45:1、主色/背景 7.85:1、on-primary/主色 7.85:1、success/warning/error 落深底 10.86/11.34/6.84:1。均为「明显对比 + 柔和护眼」取向（避免纯白刺眼、避免高饱和荧光）。
- 语义色（success/warning/error）深色值保持不变（本就达标）。
- 审计全绿：`npm run audit` → 对比度 32 项 pass=30/exempt=2/fail=0、a11y allPass、图标 0 问题。
- 同步：用户级 Skill 副本 `assets/css.json` / `assets/colors_and_type.css` / `assets/preview/*`（32 个预览页）已同步；副本 preview 图标引用按副本目录结构改写为 `../icons/lucide.min.js`。

---

## [1.4.5] - 2026-08-08

### 新增（语义令牌 · 收藏星）

- **新增专属语义色 `--fav-on`**：`css.json` 浅色 `#f59e0b`(amber-500) / 深色 `#fbbf24`(amber-400)，经 `build-tokens.mjs` 生成进 `colors_and_type.css` 的浅色 `:root` 与两处深色作用域（`[data-theme="dark"]`/`.dark` 与 `@media(prefers-color-scheme:dark)`）。
- **归属说明**：此令牌为「收藏/星标」语义（金色），与 `--warning`(amber-700 暗棕 / amber-400 亮金) 解耦。下游题库平台 `.fav-btn.on` 此前误用 `var(--warning)`，导致浅色模式实心星表现为暗棕发闷；现改为 `var(--fav-on)`。该令牌当前仅由下游 quiz-platform 消费（主题自身无星标组件），属「下游快照类」令牌，值以主题 `css.json` 为单一来源，平台端就地定义须与之一致。
- 对比度说明：浅色 `--fav-on:#f59e0b` 落在白卡上为 **2.14:1**，低于 WCAG 1.4.11 UI 非文本 3:1 阈值；此为刻意「金色星标」观感取舍，不纳入对比度门禁（门禁只校验硬编码 SPEC，不会因此失败）。

---

## [1.4.4] - 2026-08-08

### 修复（深色 Token 严重缺陷）

- **`--color-primary-subtle` 深色值取反修复**：深色主色阶为倒序（`--primary-50` 最暗 `#0f1f4d`、`--primary-950` 最亮 `#eef4ff`），但语义别名此前错误映射到 `primary-950`，导致深色下 `--color-primary-subtle` 是近白色 `#eef4ff`。受影响组件：`.btn-ghost:hover`、`.tag-primary`、`.avatar.primary`、`.sidenav-link.active`、`.topnav-link.active`、`.step.active .step-index` —— 深色模式下悬停/激活时出现刺眼白块。已改为 `#0f1f4d`（`css.json` 单一真值 → `build-tokens.mjs` 重生成 `colors_and_type.css` 两处深色作用域）。
  - 主色文字落在该浅底上的对比度由 **3.18:1（不达 AA）** 提升至 **4.52:1（达 AA）**。
- **澄清两项「疑似坏值」实为正确值**（外部报告曾建议改动，实测会引入新缺陷，故保持不变）：
  - `--color-on-primary: #0a0a0a`（深色）—— 主色 `#4b85f6` 为亮蓝，白字对比度仅 **3.51:1（不达 AA）**，黑字 **5.64:1（达 AA）**。
  - `--color-primary-hover: #6394fa`（深色）—— 悬停态需比常态更亮，符合深色交互惯例。

### 新增（对比度硬门禁）

- **`npm run audit:contrast`（`build-a11y-report.mjs`）升级为构建门禁**：此前脚本只生成报告、从不失败退出，导致上述色阶取反缺陷长期潜伏。现在 `fail > 0` 即 `process.exit(1)`。
- **新增上界校验 `maxRatio`**：除常规下界（正文 ≥4.5:1、UI 非文本 ≥3:1）外，新增「对比度过高即失败」的守卫，用于捕获**同色系近邻被取反**这一类错误。首个用例：`primary-subtle` / `background` 必须 ≤2.5:1（取反时会飙到 17.93:1，直接拦截）。
- 新增 3 项检查（共 32 项，pass=30 / exempt=2 / fail=0）：
  - 主色文字 / 主色浅底（幽灵悬停·标签·头像·激活项）
  - 主色浅底 / 页面背景（同色系近邻·上界守卫）
  - 正文文字 / 悬浮表面（模态·抽屉·下拉）
- `npm run audit` 链路扩展为 `audit:contrast && audit:a11y && audit:icons`，任一失败即中断。

### 改进（`audit-icons.mjs`）

- 支持**单文件**扫描目标（此前仅接受目录，传入 `.html` 会 `ENOTDIR` 崩溃），便于下游项目直接校验单个产物页。
- 支持 `data-not-icon="说明"` 豁免属性：装饰性 / 非图标用途的内联 SVG（如水印底纹）可显式标注豁免，避免误报。

### 规范（SKILL.md）

新增「深色 Token 硬性约束」5 条：① 深色主色阶倒序，浅底别名须映射 50 端；② 深色 `--color-on-primary` 是黑不是白（附对比度实测值）；③ Token 真值在 `css.json`，禁手改 CSS；④ 下游快照禁止就地打补丁绕开主题坏值；⑤ 提交前必过 `npm run audit:contrast`（含上界守卫）。

---

## [1.4.3] - 2026-08-08

### 新增

- **图标一致性审计脚本 `audit-icons.mjs`**：静态扫描目标目录下所有 `.html/.css/.js`（排除 `lucide.min.js`、`ui_kits`、`.git`、`node_modules`），逐图标做三类检查：
  1. **几何签名比对** —— 提取每个 `<svg>` 块（含 CSS `mask` data-uri）的 `path/circle/line/polyline/rect` 几何属性，排序拼接为签名，与内置 Lucide v1.8.0 全量 1940 个图标比对，识别「非 Lucide 自定义 SVG」与「旧版本路径漂移」；
  2. **`data-lucide` 引用校验** —— 检查图标名在库中存在，且页面确实引入了 `lucide.min.js` 并调用 `createIcons()`（防孤儿引用）；
  3. **Emoji 扫描** —— 剥离 svg 后扫描文本节点，禁止 emoji / 字符图标充当 UI 图标。
  输出 `audit-icons-report.json`。运行：`npm run audit:icons`；`npm run audit` 一次跑完 a11y + icons。

### 修复（版本漂移与残留清理）

- `preview/component-badge.html`：`bell`、`send` 内联路径为旧版 Lucide 画法，已更新为 v1.8.0 真实路径。
- `preview/component-table.html`：`inbox` 内联路径为旧版画法，已更新为 v1.8.0 真实路径。
- `preview/component-avatar.html`：两处灰色人像占位为自定义填充 SVG（`rect`+`circle`+`path`），已改为 Lucide `user`。
- `preview/index.html`：主题切换按钮使用 emoji `🌙` / `☀️`，已改为内联 Lucide `moon` / `sun`；切换逻辑由 `textContent` 改为 `innerHTML`。
- 审计结果：主题源与用户级副本 **0 问题**，全部图标命中 Lucide v1.8.0，无 emoji、无自定义 SVG、无孤儿 `data-lucide` 引用。

### 规范（SKILL.md 硬性约束）

新增「图标一致性硬性约束」5 条：① 图标源锁定内置 Lucide v1.8.0，禁止切换版本或引 CDN；② 单页内要么全内联真实路径、要么全用 `data-lucide`，禁止两种用法混用；③ 禁止 emoji、字符箭头（`☰`/`▶`）、手绘 `polyline`、Feather 旧路径充当图标；④ 升级图标库须全量重抽所有内联路径；⑤ 提交前必须通过 `npm run audit:icons`。

---

## [1.4.2] - 2026-08-08

### 修复（规范一致性）

- **图标全面 Lucide 化**：此前主题自身存在与「不引入自定义 SVG」规则冲突的内联 SVG，已全部改为 Lucide 真实路径：
  - `components.css`（源：`preview/component-accordion.html`、`preview/component-breadcrumb.html`）的折叠/分隔 chevron 由手绘 `polyline` 改为 Lucide `chevron-down` / `chevron-right` 路径（mask 内联）；
  - `theme.js` 与 `preview/component-toast.html` 的 Toast 图标（success/error/info）由 Feather `check-circle`/`x-circle`/`info` 改为 Lucide `circle-check`/`circle-x`/`info`；
  - `preview/component-stepper.html` 已完成步骤对勾由 Feather `polyline` 改为 Lucide `check` 路径。
  - 关闭 `x` 图标经核对待为 Lucide `x`，无需改动。
- 重建 `components.css`（26 样式块）已含上述 Lucide 路径；全仓（除 `lucide.min.js` 与 `ui_kits` 示例代码）已无 Feather / 自定义 `polyline` 残留。
- `SKILL.md` 图标规范补充：CSS 伪元素箭头同样须用 Lucide 真实路径（mask 内联）。

### 题库平台（外部项目 `题库制作/`）

- 耐久修复 `quiz-platform-generator/assets/platform-template.html` 与 `build_db_xl.py` 的图标层，使其符合小亮主题 Lucide 规范，并重生成 `数据库设计基础.html`：
  - 顶栏 `book-open` / `moon`（夜间切换）由 Feather 画法改为 Lucide 真实路径；
  - 反馈区 `ok` / `no` / `info` 由 Feather `check-circle`/`x-circle`/`info` 改为 Lucide `circle-check`/`circle-x`/`info`；
  - 折叠箭头 CSS mask 由手绘 `polyline` 改为 Lucide `chevron-right` 路径（展开旋转 90°）。
  - 校验：生成页 6 处 Lucide 路径全部命中，Feather / 自定义 SVG 残留为 0。

---

## [1.4.1] - 2026-08-08

### 新增

- **组件级 / 页面级 ARIA 审计**：新增 `audit-a11y.mjs`，静态扫描 `preview/component-*.html` 与 `preview/page-*.html`，检查可访问名、role 结构、地标、装饰性图标隐藏与标题层级，输出 `component-a11y-report.json`。当前 30 个预览页全部通过（error / warning / info 均为 0）。运行：`npm run audit:a11y`。
- **设计 Token 参考页**：新增 `preview/tokens.html`，离线速查全部 Token（主色阶 / 中性色阶 / 语义色 / 表面文本边框 / 字号 / 间距 / 圆角 / 阴影 / 断点），并在 `preview/index.html` 索引。
- **无障碍兜底 CSS**（写入 `colors_and_type.css`，位于 Token 区块之外、不被构建覆盖）：
  - `@media print`：打印时隐藏浮层与装饰性图标，保证纸面可读；
  - `[dir="rtl"]`：提供 RTL 基础镜像（方向、对齐、侧栏位置）；
  - `@media (prefers-contrast: more)`：加强边框与文本对比；
  - 此前已含 `prefers-reduced-motion` 与 `forced-colors` 支持。

### 修复

- 批量补强预览页 ARIA：装饰性 Lucide 图标与内联 `<svg>` 加 `aria-hidden="true"`；图标按钮（如通知铃铛）补 `aria-label`；`<nav>` 补 `aria-label` 区分地标；侧边栏当前项加 `aria-current="page"`；演示用 `<input>` / `<table>` 补 `aria-label`。审计脚本同步支持隐式 `<label>` 包裹关联，避免误报。

---

## [1.4.0] - 2026-08-07

### 新增

- **组件扩展至 26 个**，新增 5 个组件：
  - **Progress**（进度条）：`role="progressbar"` + `aria-valuenow`，3 档尺寸、4 种语义色、带标签行与不确定进度动画（`prefers-reduced-motion` 下降级为静态）。
  - **Avatar**（头像）：5 档尺寸、圆形 / 方形、文字缩写 / 图片、在线状态点（online / busy / away / offline）与 `.avatar-group` 负边距堆叠。
  - **Badge**（徽标）：计数 / 圆点两种形态、5 种语义色，`.badge-wrap` 可将角标定位到任意宿主右上角；前景色用 `var(--color-background)` 实现明暗模式自动反色。
  - **Stepper**（步骤条）：水平 / 垂直两向，已完成 / 进行中 / 未开始三态，基于 `<ol>` 语义与 `aria-current="step"`，连接线用伪元素绘制。
  - **Drawer**（抽屉）：右 / 左 / 底部三向滑出，与 Modal 共用浮层基座，支持 ESC、点击遮罩关闭、焦点陷阱与多层叠加。
- **`.field-group` / `.field-group-title`**：Checkbox / Radio 的 fieldset 分组样式纳入组件层，使用者复制示例不再出现浏览器默认边框。
- **工具类新增可访问性类**：`sr-only`、`not-sr-only`、`focus:not-sr-only`。
- `theme.js` 新增 `XL.openDrawer` / `XL.closeDrawer`，并支持传入 CSS 选择器字符串（此前仅接受元素，与 README 示例不符）。

### 修复

- **`components.css` 打包污染**（重要）：`extract-components-css.mjs` 此前把预览页 `<style>` 整块聚合，导致脚手架样式——包括全局 `body { margin/padding/background }` 与 `.specimen` / `.stage` / `.story` / `.rail` / `.divider` / `.row` / `.label` 等内部类——被打进发布产物，污染任何引入该文件的页面。现改为仅提取 `@component-css-start` / `@component-css-end` 标记之间的内容，缺失标记的预览页会构建失败。
- **响应式工具类完全失效**（重要）：`build-utilities.mjs` 生成的媒体查询写作 `@media (min-width:var(--breakpoint-md))`，而 CSS 规范不允许在媒体查询条件中使用 `var()`，导致 `.container` 的断点增长、`.{sm,md,lg,xl}:grid-cols-*`、`.{sm,md,lg,xl}:{block,hidden,flex}` 全部不生效。现改为构建期从 `css.json` 展开为字面量（属性值仍保留 `var()`）。
- **Modal 点击遮罩无法关闭**：原判断用 `overlay.contains(e.target)`，而遮罩本身即 overlay，条件恒为真。现改为判断点击是否落在 `.modal` / `.drawer` 面板之外。
- **浮层多层叠加**：ESC 与焦点陷阱改为作用于最上层浮层，关闭时仅在无剩余浮层时才恢复 `body` 滚动。
- **`preview/index.html` 组件索引过时**：此前只收录 12 个组件，现按表单 / 展示 / 反馈 / 导航四组补齐 26 个组件与 4 个页面模板；并移除该页误加的 `@component-css-start` 标记。

---

## [1.3.0] - 2026-08-07

### 新增

- **组件扩展至 21 个**，新增 3 个高频组件：
  - **Tabs**（标签页）：基于 ARIA `tablist` / `tab` / `tabpanel`，由 `theme.js` 的 `XL.initTabs()` 提供点击切换、方向键导航（Home/End/←/→）与 roving tabindex，自动激活模式。
  - **Accordion**（手风琴）：基于原生 `<details>` / `<summary>`，零 JS 依赖、键盘可达、ARIA 内建；支持默认展开与 Chevron 指示。
  - **Breadcrumb**（面包屑）：纯 CSS 导航路径，支持 `aria-current="page"` 与分隔符样式。
- 新增 `CHANGELOG.md`。

---

## [1.2.0] - 2026-08-07

### 新增

- **`utilities.css` 工具类体系**（由 `build-utilities.mjs` 从 `css.json` 的 Token 变量生成）：
  - 间距 `p-*` / `m-*` / `gap-*`（基于 `--space-*` 13 档）
  - 圆角 `rounded-*`、阴影 `shadow-*`（消费 `--radius-*` / `--shadow-*`）
  - 响应式容器 `.container` / `.container-fluid`
  - Flex 基础、Grid 基础与响应式栅格 `.{sm,md,lg,xl}:grid-cols-*`
  - 响应式显隐 `.{sm,md,lg,xl}:{block,hidden}` 等
- **重跑 `accessibility-report.json`**：新增 `text-subtle`（次级正文）对比度检查，浅色 4.83:1、深色 7.85:1，证明 `text-subtle` / `text-muted` 拆分后次级正文仍达 WCAG 2.1 AA（≥4.5:1）。

### 文档

- README 与 SKILL.md 补全 `utilities.css` 引入说明与工具类清单。

---

## [1.1.0] - 2026-08-07

### 新增

- **组件扩展至 18 个**（原 14）：新增 Textarea、Select、Checkbox / Radio、Switch。
- **`theme.js` 零依赖交互脚本**（暴露 `window.XL`）：Modal（ESC / 焦点陷阱 / 点击外部关闭）、Toast（固定容器 / 自动消失 / 关闭按钮 / `aria-live`）。
- **深色 Token 单一来源**：`css.json` → `build-tokens.mjs` 生成 `colors_and_type.css` 的浅色 / 深色 Token 区块（`[data-theme="dark"]` 与 `@media` 两处同步）。
- **`--color-text-subtle`**：拆分次级正文（`≥4.5:1`）与装饰性 `--color-text-muted`。
- **可访问性增强**：`:focus-visible` 焦点环、组件级 ARIA（dropdown/menu、modal/dialog、toast/status）、`prefers-reduced-motion`、`forced-colors`。
- **图标本地化**：Lucide UMD 运行时 vendored 至 `assets/icons/lucide.min.js`，移除 unpkg CDN 依赖。

### 移除

- 删除孤立的 `tailwind.config.js`，文档统一改为纯 CSS 引入。

---

## [1.0.0] - 2026-08-06

### 初始发布

- 极简干净设计系统：浅色 / 深色双模式、纯 CSS 变量 Token（`css.json` 投影）。
- 14 个基础组件：Button、Input、Card、Tag、Alert、Table、Modal、Tooltip、Toast、Dropdown、TopNav、SideNav、Form、Pagination。
- 组件预览页、UI Kit 展示页、MIT 许可证。
