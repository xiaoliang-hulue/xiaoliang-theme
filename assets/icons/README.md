# 图标说明

本主题默认使用 **Lucide** 图标库，不内置任何 SVG 图标文件。

## 使用方式

可通过 CDN 直接引入，在 HTML 中使用 `data-lucide` 属性声明图标名称：

```html
<i data-lucide="search"></i>
<i data-lucide="bell"></i>
<i data-lucide="user"></i>

<script src="https://unpkg.com/lucide@latest"></script>
<script>
  lucide.createIcons();
</script>
```

也可通过 npm 安装：

```bash
npm install lucide
```

然后在项目中按需引入并使用。

## 自定义图标

如需使用自定义 SVG 图标，请将 SVG 文件直接放入本目录（`assets/icons/`），并在组件或页面中引用。
