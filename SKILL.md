---
name: "小亮主题 (Xiao Liang Theme)"
description: 个人极简干净设计系统，提供浅色/深色双模式、纯 CSS 变量 Token 与 26 个基础组件规范。激活此 Skill 后，可直接使用小亮主题生成页面、组件或视觉方案。
user-invocable: true
---

# 小亮主题 (Xiao Liang Theme)

个人前端主题设计系统，服务于前端工程师的多项目统一视觉需求。以「极简、干净、留白、低饱和」为核心视觉语言，提供浅色/深色双模式、纯 CSS 变量驱动的 Token 与组件规范。

## 作为 Skill 使用

当此设计系统被安装为 Skill 后，AI 助手会优先读取本文件与 `colors_and_type.css` 中的 Token，按照以下原则生成输出：

- 优先使用语义别名：`--color-primary`、`--color-text`、`--color-surface`、`--color-border` 等。
- 遵循 4px 栅格：间距、尺寸、圆角尽量使用 `--space-*` 与 `--radius-*`。
- 保持浅色/深色双模式：生成的 HTML 需通过 `data-theme="dark"` 或系统偏好切换验证。
- 使用 Lucide 图标库，不引入自定义 SVG。
- 正文对比度需 ≥ 4.5:1，禁用文字按规范豁免。

## 快速引用

```html
<link rel="stylesheet" href="colors_and_type.css">
<link rel="stylesheet" href="components.css">
<link rel="stylesheet" href="utilities.css">
```

---

## 设计原则

- **留白优先**：内容区呼吸感强，卡片、表单、列表之间保持充足间距。
- **低饱和、高可读**：背景以白/极浅灰为主，文字以深灰代替纯黑。
- **细线分隔**：使用 1px 低对比度边框进行区域划分。
- **4px 栅格**：所有间距、尺寸、圆角均基于 4px 倍数。
- **深浅自然切换**：深色模式对浅色 Token 进行语义化映射，保持层级关系。

---

## 快速上手

在 HTML 文件中引入 Token 样式表与工具类：

```html
<link rel="stylesheet" href="小亮主题/colors_and_type.css">
<link rel="stylesheet" href="小亮主题/components.css">
<link rel="stylesheet" href="小亮主题/utilities.css">
```

引入后即可使用 CSS 变量：

```css
.my-button {
  background: var(--color-primary);
  color: var(--color-on-primary);
  border-radius: var(--radius-md);
  height: 40px;
  padding: 0 16px;
  font-size: var(--text-sm);
  line-height: var(--text-sm);
  font-family: var(--font-sans);
}
```

---

## Token 系统概览

### 主色阶

| Token | 浅色值 | 深色值 |
|-------|--------|--------|
| `--primary-50` | `#f0f5ff` | `#0f1f4d` |
| `--primary-100` | `#dbe6ff` | `#162b66` |
| `--primary-500` | `#3b82f6` | `#4b85f6` |
| `--primary-600` | `#2563eb` | `#6394fa` |
| `--primary-700` | `#1d4ed8` | `#85adff` |
| `--primary-950` | `#172554` | `#eef4ff` |

### 中性色阶

| Token | 浅色值 | 深色值 |
|-------|--------|--------|
| `--gray-0` | `#ffffff` | `#0a0a0a` |
| `--gray-50` | `#fafafa` | `#111111` |
| `--gray-100` | `#f5f5f5` | `#1a1a1a` |
| `--gray-200` | `#e5e5e5` | `#262626` |
| `--gray-300` | `#d4d4d4` | `#404040` |
| `--gray-400` | `#a3a3a3` | `#525252` |
| `--gray-500` | `#737373` | `#737373` |
| `--gray-600` | `#525252` | `#a3a3a3` |
| `--gray-700` | `#404040` | `#d4d4d4` |
| `--gray-800` | `#262626` | `#e5e5e5` |
| `--gray-900` | `#171717` | `#f5f5f5` |
| `--gray-950` | `#0a0a0a` | `#ffffff` |

### 语义别名

| Token | 浅色映射 | 深色映射 | 用途 |
|-------|----------|----------|------|
| `--color-background` | `--gray-0` | `--gray-0` | 页面背景 |
| `--color-surface` | `--gray-0` | `--gray-50` | 卡片表面 |
| `--color-surface-elevated` | `--gray-0` | `--gray-100` | 浮起表面（弹窗/导航） |
| `--color-surface-muted` | `--gray-50` | `--gray-100` | 次级表面 |
| `--color-border` | `--gray-200` | `--gray-200` | 默认边框 |
| `--color-border-subtle` | `--gray-100` | `--gray-100` | 弱边框 |
| `--color-text` | `--gray-900` | `--gray-100` | 主要文字 |
| `--color-text-secondary` | `--gray-600` | `--gray-500` | 次要文字 |
| `--color-text-muted` | `--gray-400` | `--gray-400` | 禁用/占位符 |
| `--color-primary` | `--primary-600` | `--primary-500` | 主色 |
| `--color-primary-hover` | `--primary-700` | `--primary-400` | 主色悬停 |
| `--color-primary-subtle` | `--primary-50` | `--primary-950` | 主色弱背景 |
| `--color-on-primary` | `#ffffff` | `#0a0a0a` | 主色上的文字 |

### 字体 Token

| Token | 字号 | 行高 | 用途 |
|-------|------|------|------|
| `--text-xs` | 12px | 18px | 标注、徽章 |
| `--text-sm` | 14px | 22px | 辅助文字、按钮 |
| `--text-base` | 16px | 26px | 正文 |
| `--text-lg` | 18px | 30px | 大段落 |
| `--text-xl` | 20px | 32px | 小标题 |
| `--text-2xl` | 24px | 36px | 模块标题 |
| `--text-3xl` | 30px | 42px | 页面标题 |
| `--text-4xl` | 36px | 48px | 展示标题 |
| `--text-5xl` | 48px | 60px | Hero 标题 |

### 间距 Token

| Token | 值 |
|-------|-----|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-5` | 20px |
| `--space-6` | 24px |
| `--space-8` | 32px |
| `--space-10` | 40px |
| `--space-12` | 48px |
| `--space-16` | 64px |

### 圆角 Token

| Token | 值 | 用途 |
|-------|-----|------|
| `--radius-sm` | 4px | 标签、小按钮 |
| `--radius-md` | 8px | 按钮、输入框、卡片 |
| `--radius-lg` | 12px | 弹窗、抽屉 |
| `--radius-xl` | 16px | 大型容器 |
| `--radius-full` | 9999px | 胶囊、头像 |

### 阴影 Token

| Token | 值 | 用途 |
|-------|-----|------|
| `--shadow-xs` | `0 1px 2px rgba(0,0,0,0.03)` | 微浮起 |
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.05)` | 卡片 |
| `--shadow-md` | `0 4px 12px -2px rgba(0,0,0,0.06)` | 下拉面板 |
| `--shadow-lg` | `0 12px 28px -6px rgba(0,0,0,0.08)` | 弹窗、抽屉 |
| `--shadow-xl` | `0 24px 48px -10px rgba(0,0,0,0.10)` | 全屏弹窗 |

---

## 深色模式

默认跟随系统偏好：

```css
@media (prefers-color-scheme: dark) {
  :root { /* 深色值 */ }
}
```

支持手动覆盖：

```html
<html data-theme="dark">
```

---

## 组件规范

基础组件规范已在 PRD 中定义，后续可通过 `components/` 目录扩展。核心组件包括：

- Button（Primary / Secondary / Ghost / Danger / Disabled）
- Input / Textarea
- Select
- Checkbox / Radio / Switch（分组用 `.field-group` + `.field-group-title`）
- Card
- Tag（独立内容标签）
- Badge（附着计数 / 圆点角标，配 `.badge-wrap` 定位）
- Avatar（5 档尺寸 / 圆形方形 / 状态点 / `.avatar-group` 堆叠）
- Alert（Info / Success / Warning / Error）
- Modal / Dialog
- Drawer（右 / 左 / 底部三向抽屉，依赖 theme.js 的 XL.openDrawer）
- Table
- Form（垂直 / 水平 / 行内）
- Progress（确定 / 不确定进度，role="progressbar"）
- Stepper（水平 / 垂直步骤条，aria-current="step"）
- Pagination
- Dropdown / Tooltip / Toast
- Navigation（TopNav / SideNav）
- Tabs（ARIA 标签切换，依赖 theme.js 的 XL.initTabs）
- Accordion（原生 details/summary，零 JS）
- Breadcrumb（面包屑导航，纯 CSS）

---

## 文件结构

```
小亮主题/
├── colors_and_type.css      # Token 与排版工具类（浅色/深色双模式）
├── components.css           # 26 个组件样式聚合（类名 .btn / .alert / .input / .card / .tag 等）
├── utilities.css           # 工具类（间距/圆角/阴影/容器/弹性/栅格，由 build-utilities.mjs 生成）
├── css.json                 # Token 的 JSON 投影（light / dark）
├── theme.js                # 零依赖交互脚本（Modal / Drawer / Toast / Tabs，暴露 window.XL）
├── build-tokens.mjs         # 由 css.json 单一来源重新生成深色 Token
├── extract-components-css.mjs  # 由 preview/component-*.html 重新生成 components.css
├── build-utilities.mjs      # 由 css.json 的 Token 变量生成 utilities.css
├── build-a11y-report.mjs    # 重新生成 accessibility-report.json（WCAG 2.1 AA 对比度校验）
├── components/              # 各组件结构化定义（index.json + *.json）
├── preview/                 # 预览页（index.html + 26 个组件页 + 4 个页面模板）
├── ui_kits/website/         # UI Kit 展示页与质量报告
├── assets/icons/            # 图标说明（Lucide）
├── specs/小亮主题-PRD.md     # 原始 PRD
├── README.md                # 使用说明
├── SKILL.md                 # 设计规范
└── accessibility-report.json # 可访问性检查（WCAG 2.1 AA）
```

---

## 注意事项

- 所有颜色值为 6 位 hex 或 rgba。
- 间距、字号、圆角均使用 px 单位。
- 正文与背景对比度 ≥ 4.5:1。
- 组件样式优先使用语义别名（`--color-*`），不直接引用色阶。
