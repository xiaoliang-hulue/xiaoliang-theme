# 从 1.x 升级到 1.5

## 无破坏变更

现有 Token、组件 class、`window.XL` API 和交互属性全部保留。原有项目替换以下文件即可升级：

```text
colors_and_type.css
components.css
utilities.css
theme.js
```

## 默认视觉变化

1. 页面与卡片表面加入轻微暖度。
2. 新增青绿与暖金语义色，主色仍为海蓝。
3. 按钮、卡片、表格、导航、表单与浮层默认启用动效。
4. Modal、Drawer、Toast 的退出动作会等待动画完成。

## 控制动效

```html
<html data-motion="subtle">
<html data-motion="off">
```

系统“减少动态效果”设置始终优先。

## 回退

如果项目暂时不希望接受新视觉，继续使用 v1.4.10 的四个文件即可。不要只回退其中一个文件，以免 Token 与组件样式版本不一致。
