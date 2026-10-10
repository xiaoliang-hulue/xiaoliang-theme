# 动效系统

## 默认节奏

- 快速反馈：120ms
- 常规交互：180ms
- 状态过渡：280ms
- 重点入场：420ms
- 错峰步长：45ms

## 控制方式

```html
<html>
<html data-motion="subtle">
<html data-motion="off">
```

系统 `prefers-reduced-motion: reduce` 始终优先于页面设置。

## 基础类

- `.motion-fade`：透明度渐入。
- `.motion-rise`：向上渐入。
- `.motion-pop`：轻微缩放渐入。
- `[data-reveal]`：自动入场，`--reveal-index` 控制错峰。

## 原则

- 只动画 `transform` 和 `opacity`，避免高频布局抖动。
- 动效用于反馈因果，不用持续闪烁和大面积装饰。
- 焦点、错误和状态不能只靠动画表达。

## 例外：图标形变

图标形变（`docs/icon-morph.md`）改的是 `<path>` 的 `d` 属性，不是 `transform`/`opacity`，属上面第一条原则的**唯一例外**。约束如下：

- 只能使用 `assets/morph-icons.js` 内的**策展白名单**配对，不开放任意图标配对；
- 时长受 `data-morph-speed` 限制，最长不超过 `--motion-duration-emphasis`（420ms）；
- 不使用会过冲振荡的弹性档（已剔除 `bouncy`）；
- 同样受 `<html data-motion="off">` 与系统 `prefers-reduced-motion: reduce` 双重约束，命中任一时**立即跳变、不播放补间**，但状态切换必须照常完成；
- 只改写 `d`，不改变元素尺寸与文档流，因此不引起重排。
