# 图标说明

本主题默认使用 **Lucide** 图标库。为避免运行时依赖外部 CDN、并便于在受限网络 / 严格 CSP 环境下使用，已将 Lucide UMD 运行时 **本地内置** 于 `assets/icons/lucide.min.js`（版本 1.8.0）。

## 使用方式

在 HTML 中通过 `data-lucide` 属性声明图标名称，并引入本地运行时：

```html
<i data-lucide="search"></i>
<i data-lucide="bell"></i>
<i data-lucide="user"></i>

<script src="assets/icons/lucide.min.js"></script>
<script>
  lucide.createIcons();
</script>
```

> 路径说明：预览页位于 `preview/`，引用路径为 `../assets/icons/lucide.min.js`；项目根目录引用则为 `assets/icons/lucide.min.js`。

## 内容安全策略（CSP）

由于图标运行时已本地化，可将 CSP 收紧为仅信任同源脚本：

```
Content-Security-Policy: script-src 'self';
```

如仍需通过 CDN 引入 Lucide，可放宽为：

```
Content-Security-Policy: script-src 'self' https://unpkg.com;
```

## 通过 npm 使用

```bash
npm install lucide@1.8.0
```

在构建流程中按需引入 Lucide 的 ESM / CommonJS 模块。

## 自定义图标

如需使用自定义 SVG 图标，请将 SVG 文件直接放入本目录（`assets/icons/`），并在组件或页面中引用。
