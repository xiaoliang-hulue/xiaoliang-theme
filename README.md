# 小亮主题 (Xiao Liang Theme)

一套面向前端工程师个人项目的极简干净设计系统。提供浅色/深色双模式、纯 CSS 变量驱动的 Design Token，以及基础组件规范。

## 特性

- **极简干净**：大量留白、低饱和、细线分隔
- **深浅双模式**：自动跟随系统偏好，支持手动切换
- **框架无关**：纯 CSS Custom Properties，任意前端框架可用
- **中英混排友好**：优先使用系统字体栈
- **4px 栅格**：间距、尺寸、圆角统一节奏

## 安装使用

### npm 安装（推荐，需先发布到 npm）

```bash
npm install xiaoliang-theme
```

### 从 Gitee 安装

```bash
npm install git+https://gitee.com/huluexiaoliang/xiaoliang-theme.git
```

或在 `package.json` 中：

```json
{
  "dependencies": {
    "xiaoliang-theme": "git+https://gitee.com/huluexiaoliang/xiaoliang-theme.git#main"
  }
}
```

### 引入样式

在 HTML 中引入：

```html
<link rel="stylesheet" href="node_modules/xiaoliang-theme/colors_and_type.css">
<link rel="stylesheet" href="node_modules/xiaoliang-theme/components.css">
<link rel="stylesheet" href="node_modules/xiaoliang-theme/utilities.css">
```

或在 CSS/JS 中按需引入：

```css
@import "xiaoliang-theme/colors_and_type.css";
@import "xiaoliang-theme/components.css";
@import "xiaoliang-theme/utilities.css";
```

```js
import 'xiaoliang-theme/colors_and_type.css';
import 'xiaoliang-theme/components.css';
import 'xiaoliang-theme/utilities.css';
```

### 手动复制

将本目录复制到你的项目中，然后在 HTML 中引入：

```html
<link rel="stylesheet" href="小亮主题/colors_and_type.css">
```

或在 CSS 中按需引入：

```css
@import "小亮主题/colors_and_type.css";
```

### 作为 Skill 调用

将小亮主题安装为 Trae Skill 后，可以在对话中直接要求 AI 使用该设计系统生成页面或组件。AI 会读取 `SKILL.md` 与 Token 文件，按照小亮主题的配色、栅格、组件规范输出结果。

## 使用示例

### 按钮

组件类名为 `btn` / `btn-primary` / `btn-secondary` / `btn-ghost` / `btn-danger`，尺寸用 `btn-sm` / `btn-md` / `btn-lg`，禁用加 `disabled` 属性，加载态加 `btn-loading`。

```html
<button class="btn btn-primary">主要按钮</button>
<button class="btn btn-secondary">次要按钮</button>
```

```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  padding: 0 var(--space-4);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  font-family: var(--font-sans);
  border: 1px solid transparent;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.btn-primary {
  background: var(--color-primary);
  color: var(--color-on-primary);
}

.btn-primary:hover {
  background: var(--color-primary-hover);
}

.btn-secondary {
  background: var(--color-surface-muted);
  color: var(--color-text);
  border-color: var(--color-border);
}

.btn-secondary:hover {
  background: var(--color-border-subtle);
}
```

### 卡片

```html
<div class="card card-default">
  <h3 class="xl-h4">卡片标题</h3>
  <p class="xl-body">卡片内容描述文字。</p>
</div>
```

```css
.card {
  width: 100%;
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.card-default {
  padding: var(--space-6);
}
```

### 输入框

```html
<input class="input" type="text" placeholder="请输入内容">
```

```css
.input {
  width: 100%;
  height: 40px;
  padding: 0 var(--space-3);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text);
  font-size: var(--text-sm);
  font-family: var(--font-sans);
}

.input::placeholder {
  color: var(--color-text-muted);
}

.input:focus {
  border-color: var(--color-primary);
  outline: 2px solid var(--color-primary-subtle);
  outline-offset: 2px;
}
```

## 切换深色模式

主题默认**跟随系统偏好**（`prefers-color-scheme: dark`）。如需手动控制，给 `<html>` 设置 `data-theme` 属性即可（也兼容 `.dark` 类）：

```js
const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
```

强制指定（手动覆盖系统偏好）：

```html
<html data-theme="dark">
<!-- 或显式浅色：<html data-theme="light"> -->
```

## Token 速查

### 颜色

- `--color-primary`：主色
- `--color-primary-hover`：主色悬停
- `--color-on-primary`：主色上的文字
- `--color-background`：页面背景
- `--color-surface`：卡片表面
- `--color-surface-muted`：次级表面
- `--color-text`：主要文字
- `--color-text-secondary`：次要文字
- `--color-text-muted`：禁用/占位符
- `--color-border`：默认边框
- `--color-border-subtle`：弱边框

### 间距

- `--space-1` ~ `--space-24`：4px 为基准的间距阶

### 圆角

- `--radius-sm` / `--radius-md` / `--radius-lg` / `--radius-xl` / `--radius-full`

### 阴影

- `--shadow-xs` / `--shadow-sm` / `--shadow-md` / `--shadow-lg` / `--shadow-xl`

### 排版

- `.xl-display` / `.xl-h1` / `.xl-h2` / `.xl-h3` / `.xl-h4`
- `.xl-body` / `.xl-lead` / `.xl-caption` / `.xl-eyebrow` / `.xl-mono`

## 引入方式

小亮主题是 **纯 CSS** 设计系统，无需任何构建工具。在页面中引入 Token 文件、组件样式与工具类即可：

```html
<link rel="stylesheet" href="小亮主题/colors_and_type.css">
<link rel="stylesheet" href="小亮主题/components.css">
<link rel="stylesheet" href="小亮主题/utilities.css">
```

如需使用 Modal / Toast 等交互组件，再引入零依赖的 `theme.js`（暴露全局 `window.XL`）：

```html
<script src="小亮主题/theme.js"></script>
<script>
  XL.openModal('#demo-modal');
  XL.showToast({ type: 'success', title: '已保存', message: '配置已更新' });
</script>
```

> 本主题不依赖 Tailwind 或其它 CSS 框架；若你的项目使用 Tailwind，可基于 `css.json` 的 Token 自行生成 `tailwind.config.js`。

## 工具类（Utilities）

`utilities.css` 由 `build-utilities.mjs` 从 `css.json` 的 Token 变量自动生成，提供脱离组件即可使用的布局/间距/圆角/阴影工具类：

- **间距**：`p-*` / `px-*` / `py-*` / `pt-*` / `pr-*` / `pb-*` / `pl-*`、`m-*` / `mx-*` / `my-*` / `mt-*` / `mr-*` / `mb-*` / `ml-*`、`gap-*` / `gap-x-*` / `gap-y-*`（基于 `--space-*` 刻度：0/1/2/3/4/5/6/8/10/12/16/20/24）
- **圆角**：`rounded-none` / `rounded-sm` / `rounded-md` / `rounded-lg` / `rounded-xl` / `rounded-full`（基于 `--radius-*`）
- **阴影**：`shadow-xs` / `shadow-sm` / `shadow-md` / `shadow-lg` / `shadow-xl`（基于 `--shadow-*`）
- **容器**：`container`（随断点 `sm/md/lg/xl/2xl` 增长最大宽度）、`container-fluid`
- **弹性布局**：`flex` / `flex-col` / `flex-wrap` / `items-center` / `justify-between` / `flex-1` 等
- **栅格**：`grid` / `grid-cols-1/2/3/4/5/6/12`，以及响应式变体 `sm:grid-cols-*` / `md:grid-cols-*` / `lg:grid-cols-*` / `xl:grid-cols-*`（基于 `--breakpoint-*`）
- **显隐**：`block` / `inline-block` / `hidden` 及响应式变体 `sm:block` / `md:hidden` / `lg:flex` 等

```html
<div class="container flex items-center justify-between p-4 gap-3">
  <h1 class="xl-h3">标题</h1>
  <button class="btn btn-primary rounded-md shadow-sm">操作</button>
</div>
```

> 工具类直接消费 `colors_and_type.css` 中的 Token 变量，因此浅色/深色双模式与主题定制自动生效。改 Token 后运行 `npm run build` 即可同步重新生成。

## 图标

本主题默认使用 **Lucide** 图标库，运行时已本地内置（`assets/icons/lucide.min.js`，无外部 CDN 依赖）。详见 `assets/icons/README.md`。

```html
<i data-lucide="search"></i>
<script src="assets/icons/lucide.min.js"></script>
<script>lucide.createIcons();</script>
```

## 文件说明

| 文件 | 说明 |
|------|------|
| `colors_and_type.css` | Token 定义与排版工具类（浅色/深色双模式） |
| `css.json` | Token 的 JSON 投影（含 light / dark） |
| `components.css` | 聚合后的组件样式（21 个组件，类名 `.btn` / `.alert` 等） |
| `utilities.css` | 工具类（间距/圆角/阴影/容器/弹性/栅格，由 `build-utilities.mjs` 生成） |
| `components/` | 各组件的结构化定义（`index.json` + `*.json`） |
| `theme.js` | 零依赖交互脚本（Modal / Toast，暴露 `window.XL`） |
| `assets/icons/README.md` | Lucide 图标使用说明 |
| `preview/index.html` | 主题总览预览页 |
| `preview/component-*.html` | 21 个组件预览页 |
| `preview/page-list.html` | 列表页模板 |
| `preview/page-detail.html` | 详情页模板 |
| `preview/page-form.html` | 表单页模板 |
| `preview/page-dashboard.html` | 仪表盘模板 |
| `ui_kits/website/index.html` | UI Kit 展示页（3 屏：组件总览、表单示例、数据看板） |
| `ui_kits/website/quality-report.json` | UI Kit 质量报告 |
| `uikit-plan.json` | UI Kit 生成计划 |
| `SKILL.md` | 设计系统规范 |
| `accessibility-report.json` | 可访问性检查报告（WCAG 2.1 AA） |
| `specs/小亮主题-PRD.md` | 原始 PRD |

## 组件清单

已提供预览页的组件（共 21 个）：

| 组件 | 预览文件 | 说明 |
|------|----------|------|
| Button | `preview/component-button.html` | Primary / Secondary / Ghost / Danger / 尺寸 / 禁用 / 加载 |
| Input | `preview/component-input.html` | 默认 / Focus / 禁用 / 错误 / 成功 |
| Textarea | `preview/component-textarea.html` | 默认 / 错误 / 禁用 |
| Select | `preview/component-select.html` | 默认 / 错误 / 禁用 |
| Card | `preview/component-card.html` | 默认 / 紧凑 / 可交互 |
| Tag | `preview/component-tag.html` | Default / Primary / Success / Warning / Error / Rounded / Pill |
| Alert | `preview/component-alert.html` | Info / Success / Warning / Error |
| Table | `preview/component-table.html` | 默认 / 斑马纹 / Hover |
| Form | `preview/component-form.html` | 垂直 / 水平 / 行内布局 / 错误 / 成功 / 禁用 |
| Checkbox / Radio | `preview/component-checkbox.html` | 复选 / 单选 / 禁用 |
| Switch | `preview/component-switch.html` | 开 / 关 / 禁用 |
| Pagination | `preview/component-pagination.html` | 默认 / 小尺寸 / 激活 / 禁用 / 省略号 |
| Dropdown | `preview/component-dropdown.html` | 菜单 / 分隔线 / 项 |
| Modal | `preview/component-modal.html` | 标题 / 内容 / 底部操作 |
| Tooltip | `preview/component-tooltip.html` | 悬停气泡（下 / 上） |
| Toast | `preview/component-toast.html` | Success / Error / Info |
| TopNav | `preview/component-topnav.html` | 品牌 / 导航链接 / 激活态 |
| SideNav | `preview/component-sidenav.html` | 分区 / 链接 / 激活态 |
| Tabs | `preview/component-tabs.html` | 概览 / 详情 / 设置（ARIA + 方向键，依赖 theme.js） |
| Accordion | `preview/component-accordion.html` | 折叠 / 默认展开（原生 details，零 JS） |
| Breadcrumb | `preview/component-breadcrumb.html` | 默认 / Chevron 分隔符 |

组件样式已聚合到 `components.css`（类名规范：`.btn` / `.alert` / `.input` / `.card` / `.tag` 等），可直接引入或按需复制。各组件的结构化定义见 `components/*.json`。

UI Kit 展示页 `ui_kits/website/index.html` 综合使用了上述全部组件，覆盖组件总览、表单示例、数据看板 3 个屏幕，可作为真实页面布局参考。

## 可访问性

已基于 WCAG 2.1 AA 执行对比度检查，完整结果见 `accessibility-report.json`。正文、按钮、链接、表格等核心文字与背景组合均达到 ≥ 4.5:1，禁用文字按规范豁免。

## 扩展状态

- 页面模板（列表页、详情页、表单页、仪表盘）—— 已完成
- UI Kit 展示页 —— 已完成
- 组件覆盖：Button、Input、Textarea、Select、Card、Tag、Alert、Table、Form、Checkbox、Radio、Switch、Pagination、Dropdown、Modal、Tooltip、Toast、TopNav、SideNav、Tabs、Accordion、Breadcrumb（共 21 个）—— 已完成

## 许可

基于 [MIT 许可证](./LICENSE) 开源，可自由用于个人与商业项目。
