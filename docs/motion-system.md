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
