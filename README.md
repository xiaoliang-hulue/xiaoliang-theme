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
```

或在 CSS/JS 中按需引入：

```css
@import "xiaoliang-theme/colors_and_type.css";
@import "xiaoliang-theme/components.css";
```

```js
import 'xiaoliang-theme/colors_and_type.css';
import 'xiaoliang-theme/components.css';
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

```html
<button class="xl-button xl-button--primary">主要按钮</button>
<button class="xl-button xl-button--secondary">次要按钮</button>
```

```css
.xl-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  padding: 0 16px;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  font-family: var(--font-sans);
  border: 1px solid transparent;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.xl-button--primary {
  background: var(--color-primary);
  color: var(--color-on-primary);
}

.xl-button--primary:hover {
  background: var(--color-primary-hover);
}

.xl-button--secondary {
  background: var(--color-surface);
  color: var(--color-text);
  border-color: var(--color-border);
}

.xl-button--secondary:hover {
  background: var(--color-surface-muted);
}
```

### 卡片

```html
<div class="xl-card">
  <h3 class="xl-h4">卡片标题</h3>
  <p class="xl-body">卡片内容描述文字。</p>
</div>
```

```css
.xl-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
}
```

### 输入框

```html
<input class="xl-input" type="text" placeholder="请输入内容">
```

```css
.xl-input {
  width: 100%;
  height: 40px;
  padding: 0 var(--space-3);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text);
  font-size: var(--text-base);
  font-family: var(--font-sans);
}

.xl-input::placeholder {
  color: var(--color-text-muted);
}

.xl-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-subtle);
}
```

## 切换深色模式

```js
const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
```

或强制指定：

```html
<html data-theme="dark">
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

## Tailwind CSS 配置

本主题提供 `tailwind.config.js`，已将 Token 映射为 Tailwind 的 `colors`、`spacing`、`borderRadius`、`boxShadow`、`fontFamily` 等主题键：

```js
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{html,js,jsx,ts,tsx,vue}'],
  theme: {
    colors: {
      primary: {
        DEFAULT: 'var(--color-primary)',
        hover: 'var(--color-primary-hover)',
        subtle: 'var(--color-primary-subtle)',
      },
      surface: {
        DEFAULT: 'var(--color-surface)',
        elevated: 'var(--color-surface-elevated)',
        muted: 'var(--color-surface-muted)',
      },
      text: {
        DEFAULT: 'var(--color-text)',
        secondary: 'var(--color-text-secondary)',
        muted: 'var(--color-text-muted)',
      },
      // ...
    },
  },
};
```

在项目中同时引入 Token 文件与 Tailwind 编译后的 CSS 即可：

```html
<link rel="stylesheet" href="小亮主题/colors_and_type.css">
<link rel="stylesheet" href="/dist/output.css">
```

## 图标

本主题默认使用 **Lucide** 图标库，不内置 SVG 图标文件。详见 `assets/icons/README.md`。

```html
<i data-lucide="search"></i>
<script src="https://unpkg.com/lucide@latest"></script>
<script>lucide.createIcons();</script>
```

## 文件说明

| 文件 | 说明 |
|------|------|
| `colors_and_type.css` | Token 定义与排版工具类 |
| `css.json` | Token 的 JSON 投影 |
| `components.css` | 聚合后的组件样式 |
| `tailwind.config.js` | Tailwind CSS 主题配置 |
| `assets/icons/README.md` | Lucide 图标使用说明 |
| `preview/index.html` | 主题总览预览页 |
| `preview/page-list.html` | 列表页模板 |
| `preview/page-detail.html` | 详情页模板 |
| `preview/page-form.html` | 表单页模板 |
| `preview/page-dashboard.html` | 仪表盘模板 |
| `ui_kits/website/index.html` | UI Kit 展示页（3 屏：组件总览、表单示例、数据看板） |
| `SKILL.md` | 设计系统规范 |
| `accessibility-report.json` | 可访问性检查报告（WCAG 2.1 AA） |
| `specs/小亮主题-PRD.md` | 原始 PRD |

## 组件清单

已提供预览页的组件：

| 组件 | 预览文件 | 说明 |
|------|----------|------|
| Button | `preview/component-button.html` | Primary / Secondary / Ghost / Danger / 尺寸 / 禁用 |
| Input | `preview/component-input.html` | 默认 / Focus / 禁用 / 错误 |
| Card | `preview/component-card.html` | 默认 / 紧凑 / 可交互 |
| Tag | `preview/component-tag.html` | Default / Primary / Success / Warning / Error / Pill |
| Alert | `preview/component-alert.html` | Info / Success / Warning / Error |
| Table | `preview/component-table.html` | 默认 / 斑马纹 / Hover |
| Form | `preview/component-form.html` | 垂直 / 水平 / 行内布局 / 错误 / 成功 / 禁用 |
| Pagination | `preview/component-pagination.html` | 默认 / 小尺寸 / 激活 / 禁用 / 省略号 |

组件样式已聚合到 `components.css`，可直接引入或按需复制。

UI Kit 展示页 `ui_kits/website/index.html` 综合使用了上述 6 个组件，覆盖组件总览、表单示例、数据看板 3 个屏幕，可作为真实页面布局参考。

## 可访问性

已基于 WCAG 2.1 AA 执行对比度检查，完整结果见 `accessibility-report.json`。正文、按钮、链接、表格等核心文字与背景组合均达到 ≥ 4.5:1，禁用文字按规范豁免。

## 扩展状态

- 页面模板（列表页、详情页、表单页、仪表盘）—— 已完成
- UI Kit 展示页 —— 已完成
- 组件覆盖：Button、Input、Card、Tag、Alert、Table、Form、Pagination —— 已完成

## 许可

个人项目自由使用。
