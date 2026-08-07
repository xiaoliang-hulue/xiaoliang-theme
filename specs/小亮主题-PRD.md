# 小亮主题（Xiao Liang Theme）产品需求文档（PRD）

> 版本：v1.0  
> 目标读者：前端开发工程师 / 个人项目维护者  
> 参考约束：原始参考色彩基因（主蓝 `#1664ff`），向「极简、干净、留白、低饱和」方向重构  

---

## 1. 项目背景与目标

### 1.1 背景
你作为前端开发工程师，维护多个前端项目，但各项目视觉风格不统一，缺乏一套属于个人的、可复用的主题体系。

### 1.2 目标
打造一套名为「小亮主题」的个人设计系统，具备以下特征：
- **视觉风格**：极简干净、留白充分、低饱和、细线分隔。
- **色彩基因**：以原始参考主蓝色调（`#1664ff`）为基础，但降低整体饱和度、提升通透感。
- **模式支持**：浅色模式 + 深色模式，默认跟随系统偏好，支持手动覆盖。
- **技术形态**：框架无关，以纯 CSS 自定义属性（CSS Variables）为核心交付物。
- **覆盖范围**：Design Token + 基础组件样式 + 常用页面模板。
- **语言场景**：中文与英文混排友好。

---

## 2. 设计原则

| 原则 | 说明 |
|------|------|
| 留白优先 | 内容区呼吸感强，避免信息密度过高。卡片、表单、列表之间保持充足间距。 |
| 低饱和、高可读 | 背景以白/极浅灰为主，文字以深灰代替纯黑，降低视觉疲劳。 |
| 细线分隔 | 使用 1px 低对比度边框进行区域划分，避免重色块分割。 |
| 4px 栅格 | 所有间距、尺寸、圆角均基于 4px 倍数，保证视觉节奏一致。 |
| 深浅自然切换 | 深色模式不是简单反色，而是对浅色 Token 进行语义化映射，保持层级关系。 |
| 一色多用 | 通过透明度变化（hover/focus/disabled）表达状态，减少额外色值。 |

---

## 3. 色彩系统

### 3.1 主色阶（Primary）
继承参考主蓝色并稍作柔和处理，保留辨识度但降低攻击性。

| Token | 浅色值 | 深色值 | 用途 |
|-------|--------|--------|------|
| `--primary-50` | `#f0f5ff` | `#0f1f4d` | 极浅背景、hover 底色 |
| `--primary-100` | `#dbe6ff` | `#162b66` | 选中背景、轻提示背景 |
| `--primary-200` | `#b3cdff` | `#1e3d8f` | 装饰性背景 |
| `--primary-300` | `#85adff` | `#2754b8` | 浅状态色 |
| `--primary-400` | `#5b8ff9` | `#356de3` | 次级强调 |
| `--primary-500` | `#3b82f6` | `#4b85f6` | 默认主色 |
| `--primary-600` | `#2563eb` | `#6394fa` | 主按钮、链接、关键操作 |
| `--primary-700` | `#1d4ed8` | `#85adff` | hover 态 |
| `--primary-800` | `#1e40af` | `#b3cdff` | 文字级强调 |
| `--primary-900` | `#1e3a8a` | `#dbe6ff` | 深色文字 |
| `--primary-950` | `#172554` | `#eef4ff` | 最深/最浅极端场景 |

> 注：原始参考主色 `#1664ff` 映射到 `--primary-600` 附近，保留色彩认知但向更通用的「明亮蓝」微调。

### 3.2 中性色阶（Neutral / Gray）

| Token | 浅色值 | 深色值 | 用途 |
|-------|--------|--------|------|
| `--gray-0` | `#ffffff` | `#0a0a0a` | 页面背景 |
| `--gray-50` | `#fafafa` | `#111111` | 卡片背景、输入框背景 |
| `--gray-100` | `#f5f5f5` | `#1a1a1a` | hover 背景、次级表面 |
| `--gray-200` | `#e5e5e5` | `#262626` | 分隔线、边框 |
| `--gray-300` | `#d4d4d4` | `#404040` | 禁用边框、次要分隔 |
| `--gray-400` | `#a3a3a3` | `#525252` | 占位符、禁用文字 |
| `--gray-500` | `#737373` | `#737373` | 辅助说明 |
| `--gray-600` | `#525252` | `#a3a3a3` | 次要文字 |
| `--gray-700` | `#404040` | `#d4d4d4` | 正文文字 |
| `--gray-800` | `#262626` | `#e5e5e5` | 标题文字 |
| `--gray-900` | `#171717` | `#f5f5f5` |  emphasized 标题 |
| `--gray-950` | `#0a0a0a` | `#ffffff` | 最深文字/反色 |

### 3.3 语义色（Semantic）

| Token | 浅色值 | 深色值 | 用途 |
|-------|--------|--------|------|
| `--success` | `#16a34a` | `#4ade80` | 成功状态 |
| `--success-bg` | `#f0fdf4` | `#052e16` | 成功背景 |
| `--warning` | `#d97706` | `#fbbf24` | 警告状态 |
| `--warning-bg` | `#fffbeb` | `#451a03` | 警告背景 |
| `--error` | `#dc2626` | `#f87171` | 错误状态 |
| `--error-bg` | `#fef2f2` | `#450a0a` | 错误背景 |
| `--info` | `--primary-600` | `--primary-400` | 信息提示 |
| `--info-bg` | `--primary-50` | `#0f1f4d` | 信息背景 |

### 3.4 语义别名（Semantic Aliases）
所有组件和模板应优先使用别名，而非直接引用色阶。

| 别名 Token | 浅色映射 | 深色映射 | 用途 |
|------------|----------|----------|------|
| `--color-background` | `--gray-0` | `--gray-0` | 页面背景 |
| `--color-surface` | `--gray-0` | `--gray-50` | 卡片、面板表面 |
| `--color-surface-elevated` | `--gray-0` | `--gray-100` | 浮层面板、下拉菜单 |
| `--color-surface-muted` | `--gray-50` | `--gray-100` | 表格斑马纹、代码块 |
| `--color-border` | `--gray-200` | `--gray-200` | 默认边框 |
| `--color-border-subtle` | `--gray-100` | `--gray-100` | 弱边框、分割线 |
| `--color-text` | `--gray-900` | `--gray-100` | 主要文字 |
| `--color-text-secondary` | `--gray-600` | `--gray-500` | 次要文字 |
| `--color-text-muted` | `--gray-400` | `--gray-400` | 禁用、占位符 |
| `--color-primary` | `--primary-600` | `--primary-500` | 主色 |
| `--color-primary-hover` | `--primary-700` | `--primary-400` | 主色悬停 |
| `--color-primary-subtle` | `--primary-50` | `--primary-950` | 主色弱背景 |
| `--color-on-primary` | `#ffffff` | `#0a0a0a` | 主色上的文字 |

### 3.5 深色模式切换机制
```css
:root {
  color-scheme: light dark;
  /* 浅色默认值 */
}

@media (prefers-color-scheme: dark) {
  :root {
    /* 深色覆盖值 */
  }
}

/* 手动覆盖类 */
[data-theme="light"] { /* 强制浅色 */ }
[data-theme="dark"] { /* 强制深色 */ }
```

---

## 4. 字体排版（Typography）

### 4.1 字体栈
兼顾中英混排，中文优先使用系统字体，英文使用通用无衬线字体。

```css
--font-sans:
  "PingFang SC",
  "Hiragino Sans GB",
  "Microsoft YaHei",
  "Helvetica Neue",
  Arial,
  sans-serif;

--font-mono:
  "SFMono-Regular",
  "SF Mono",
  "Roboto Mono",
  "Consolas",
  "Liberation Mono",
  monospace;
```

### 4.2 字号与行高
面向文档站与个人作品，字号比原始参考更舒展。

| Token | 字号 | 行高 | 字重 | 用途 |
|-------|------|------|------|------|
| `--text-xs` | 12px | 18px | 400 | 标注、徽章 |
| `--text-sm` | 14px | 22px | 400 | 辅助文字、按钮 |
| `--text-base` | 16px | 26px | 400 | 正文 |
| `--text-lg` | 18px | 30px | 400 | 大段落 |
| `--text-xl` | 20px | 32px | 500 | 小标题 |
| `--text-2xl` | 24px | 36px | 500 | 模块标题 |
| `--text-3xl` | 30px | 42px | 600 | 页面标题 |
| `--text-4xl` | 36px | 48px | 600 | 展示标题 |
| `--text-5xl` | 48px | 60px | 700 | Hero 标题 |

### 4.3 字重

| Token | 值 | 用途 |
|-------|-----|------|
| `--font-normal` | 400 | 正文 |
| `--font-medium` | 500 | 小标题、按钮 |
| `--font-semibold` | 600 | 页面标题、强调 |
| `--font-bold` | 700 | Hero、数字 |

---

## 5. 间距、圆角、阴影

### 5.1 间距（Spacing）
基于 4px 栅格。

| Token | 值 |
|-------|-----|
| `--space-0` | 0 |
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
| `--space-20` | 80px |
| `--space-24` | 96px |

### 5.2 圆角（Radius）

| Token | 值 | 用途 |
|-------|-----|------|
| `--radius-none` | 0 | 表格、直角元素 |
| `--radius-sm` | 4px | 标签、小按钮 |
| `--radius-md` | 8px | 按钮、输入框、卡片 |
| `--radius-lg` | 12px | 弹窗、抽屉、大卡片 |
| `--radius-xl` | 16px | 页面级容器 |
| `--radius-full` | 9999px | 胶囊、头像 |

### 5.3 阴影（Shadow）
强调低透明度、柔和浮起感。

| Token | 值 | 用途 |
|-------|-----|------|
| `--shadow-xs` | `0 1px 2px 0 rgb(0 0 0 / 0.03)` | 微浮起 |
| `--shadow-sm` | `0 1px 3px 0 rgb(0 0 0 / 0.05)` | 卡片 |
| `--shadow-md` | `0 4px 12px -2px rgb(0 0 0 / 0.06)` | 下拉面板 |
| `--shadow-lg` | `0 12px 28px -6px rgb(0 0 0 / 0.08)` | 弹窗、抽屉 |
| `--shadow-xl` | `0 24px 48px -10px rgb(0 0 0 / 0.10)` | 全屏弹窗 |

深色模式下阴影保持相同 `rgb(0 0 0 / alpha)`，依靠表面色提升形成层级。

---

## 6. 基础组件规范

所有组件样式均以 CSS 变量驱动，不依赖特定框架。

### 6.1 Button

| 变体 | 背景 | 边框 | 文字 | hover |
|------|------|------|------|-------|
| Primary | `--color-primary` | transparent | `--color-on-primary` | `--color-primary-hover` |
| Secondary | `--color-surface` | `--color-border` | `--color-text` | `--color-surface-muted` |
| Ghost | transparent | transparent | `--color-primary` | `--color-primary-subtle` |
| Danger | `--error` | transparent | `#fff` | `#b91c1c` |
| Disabled | `--color-surface-muted` | `--color-border-subtle` | `--color-text-muted` | - |

**尺寸**：
- Small: 高 32px，padding 0 12px
- Default: 高 40px，padding 0 16px
- Large: 高 48px，padding 0 24px
- 圆角：`--radius-md`

### 6.2 Input / Textarea

- 背景：`--color-surface`
- 边框：1px solid `--color-border`
- 文字：`--color-text`
- 占位符：`--color-text-muted`
- focus：边框变为 `--color-primary`，外加 2px `--color-primary-subtle` 外发光
- disabled：背景 `--color-surface-muted`，文字 `--color-text-muted`
- 圆角：`--radius-md`
- 默认高度：40px

### 6.3 Card

- 背景：`--color-surface`
- 边框：1px solid `--color-border-subtle`
- 圆角：`--radius-lg`
- 内边距：`--space-6`（24px）
- 可选阴影：`--shadow-sm`
- hover 态（可交互卡片）：边框变为 `--color-border`，阴影变为 `--shadow-md`

### 6.4 Tag / Badge

| 变体 | 背景 | 文字 |
|------|------|------|
| Default | `--color-surface-muted` | `--color-text-secondary` |
| Primary | `--color-primary-subtle` | `--color-primary` |
| Success | `--success-bg` | `--success` |
| Warning | `--warning-bg` | `--warning` |
| Error | `--error-bg` | `--error` |

- 圆角：`--radius-sm` 或 `--radius-full`
- 内边距：0 `--space-2`（0 8px）
- 高度：24px（small）/ 28px（default）

### 6.5 Modal / Dialog

- 遮罩：`rgb(0 0 0 / 0.45)`
- 容器背景：`--color-surface-elevated`
- 圆角：`--radius-lg`
- 阴影：`--shadow-lg`
- 最大宽度：480px（确认弹窗）/ 720px（详情弹窗）
- 标题字号：`--text-xl`
- 内边距：`--space-6`

### 6.6 Alert

| 类型 | 背景 | 边框 | 图标/文字 |
|------|------|------|-----------|
| Info | `--color-primary-subtle` | `--primary-200` | `--color-primary` |
| Success | `--success-bg` | `--success` 20% | `--success` |
| Warning | `--warning-bg` | `--warning` 20% | `--warning` |
| Error | `--error-bg` | `--error` 20% | `--error` |

- 圆角：`--radius-md`
- 内边距：`--space-4`

### 6.7 Table

- 表头背景：`--color-surface-muted`
- 表头文字：`--color-text-secondary`，字重 500
- 行高：48px
- 单元格内边距：0 `--space-4`
- 边框：1px solid `--color-border-subtle`（仅底边）
- hover 行：`--color-surface-muted`
- 斑马纹：偶数行 `--color-surface-muted`

### 6.8 Navigation（TopNav / SideNav）

- TopNav：高度 64px，背景 `--color-surface`，底边框 `--color-border-subtle`
- SideNav：宽度 240px，背景 `--color-surface-muted`，右侧边框 `--color-border-subtle`
- 菜单项：高 40px，圆角 `--radius-md`
- 选中态：背景 `--color-primary-subtle`，文字 `--color-primary`
- hover 态：背景 `--color-surface-muted`

---

## 7. 页面模板

提供 4 类常见页面模板，可直接复制作为项目起点。

### 7.1 列表页（List Page）
- 顶部：页面标题 + 搜索/筛选 + 新建按钮
- 中部：数据表格
- 底部：分页器
- 布局：最大宽度 1280px，水平居中，padding `--space-6`

### 7.2 详情页（Detail Page）
- 顶部：面包屑 + 页面标题 + 操作按钮组
- 主体：Card 组合，描述列表（Descriptions）展示元信息
- 侧边：相关操作/状态卡片
- 布局：主内容区 2/3，侧边区 1/3

### 7.3 表单页（Form Page）
- 顶部：标题与提交/取消按钮
- 主体：分组 Card，每组包含若干 Input / Select / Textarea
- 底部：提交/重置按钮
- 布局：最大宽度 720px 居中

### 7.4 仪表盘（Dashboard）
- 顶部：标题、日期筛选、关键指标卡片
- 中部：图表区域（预留 `chart-1` ~ `chart-5` 配色）
- 底部：最近动态列表
- 布局：响应式网格，默认 12 列

---

## 8. 技术交付与文件结构

### 8.1 交付物清单

```
小亮主题/
├── tokens/
│   ├── colors.css          # 色阶 + 语义色 + 深色模式
│   ├── typography.css      # 字体、字号、行高、字重
│   ├── spacing.css         # 间距、尺寸
│   ├── radius-shadow.css   # 圆角、阴影
│   └── index.css           # 统一引入所有 token
├── components/
│   ├── button.css
│   ├── input.css
│   ├── card.css
│   ├── tag.css
│   ├── modal.css
│   ├── alert.css
│   ├── table.css
│   ├── nav.css
│   └── index.css
├── templates/
│   ├── list-page.html
│   ├── detail-page.html
│   ├── form-page.html
│   └── dashboard.html
├── preview/
│   ├── index.html          # 主题总览与调色板
│   └── components.html     # 组件展示
└── README.md               # 使用说明
```

### 8.2 使用方式

**方式一：HTML 直接引入**
```html
<link rel="stylesheet" href="小亮主题/tokens/index.css">
<link rel="stylesheet" href="小亮主题/components/index.css">
```

**方式二：CSS 中按需引入**
```css
@import "小亮主题/tokens/colors.css";
@import "小亮主题/components/button.css";
```

**方式三：强制主题**
```html
<html data-theme="dark">
```

### 8.3 手动切换深色模式示例
```js
const root = document.documentElement;
const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
root.setAttribute('data-theme', isDark ? 'dark' : 'light');
```

---

## 9. 响应式断点

| 断点 | 宽度 | 说明 |
|------|------|------|
| `--breakpoint-sm` | 640px | 小屏手机 |
| `--breakpoint-md` | 768px | 平板 |
| `--breakpoint-lg` | 1024px | 小桌面 |
| `--breakpoint-xl` | 1280px | 标准桌面 |
| `--breakpoint-2xl` | 1536px | 大屏 |

默认容器最大宽度：`--container-max: 1280px`。

---

## 10. 实施路线图

| 阶段 | 周期 | 交付物 |
|------|------|--------|
| Phase 1 | 1 天 | 完成 Token 文件（colors/typography/spacing/radius-shadow）与主题总览预览页 |
| Phase 2 | 2 天 | 完成 Button、Input、Card、Tag、Alert、Table 基础组件样式 |
| Phase 3 | 2 天 | 完成 Modal、Nav、Form、Pagination 等复杂组件 |
| Phase 4 | 2 天 | 完成 4 个页面模板（列表/详情/表单/仪表盘） |
| Phase 5 | 1 天 | 深色模式走查、可访问性检查（对比度 ≥ 4.5:1）、文档补全 |

---

## 11. 验收标准

- [ ] 浅色/深色模式可自动跟随系统偏好，且支持 `data-theme` 手动覆盖。
- [ ] 所有组件不依赖任何 JS 框架，纯 CSS 实现。
- [ ] 正文与背景对比度 ≥ 4.5:1，大号文字 ≥ 3:1。
- [ ] 所有间距、圆角均为 4px 的整数倍。
- [ ] 组件 HTML 可直接从 preview 文件复制使用，class 命名保持一致。
- [ ] 提供清晰的文件结构与 README 使用说明。

---

## 12. 命名约定

- Token 命名：`--{category}-{name}-{variant}`，例如 `--color-primary-hover`。
- 组件 class：`.xl-{component}-{variant}-{state}`，例如 `.xl-button-primary:hover`、`.xl-card--hoverable`。
- 文件命名：小写、短横线连接，例如 `colors.css`、`list-page.html`。

---

## 13. 风险与注意事项

1. **主蓝色饱和度过高**：在极简风格中，主按钮、链接需要控制使用面积，避免视觉焦点过于跳跃。
2. **中英混排行高**：中文字号需要比英文略大的行高，避免上下拥挤。
3. **深色模式不是反色**：避免直接将 `--gray-0` 与 `--gray-950` 简单互换，需保持语义层级一致。
4. **跨项目迁移成本**：未来如项目使用 Tailwind，可基于本 PRD 中的 Token 生成 `tailwind.config.js`。

---

*文档结束。下一步：基于本 PRD 进入 Phase 1，输出 Token CSS 文件与主题总览预览页。*
