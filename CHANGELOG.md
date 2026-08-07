# 更新日志 (Changelog)

本文件记录小亮主题的每个发布版本变更。版本号遵循语义化版本规范 (SemVer)。

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
