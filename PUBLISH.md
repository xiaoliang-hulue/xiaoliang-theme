# 发布到 GitHub 指南

## 1. 创建账号与仓库

1. 打开 `https://github.com/signup` 注册账号。
2. 登录后打开 `https://github.com/new`。
3. Repository name 填 `xiaoliang-theme`。
4. 选择 Public。
5. 不要勾选 Add a README、.gitignore 或 license，因为本地仓库已经包含这些文件。
6. 点击 Create repository。

## 2. 添加远端并推送

在项目目录执行，把 `YOUR_GITHUB_USERNAME` 换成你的 GitHub 用户名：

```powershell
git remote add github https://github.com/YOUR_GITHUB_USERNAME/xiaoliang-theme.git
git push -u github main
```

Git Credential Manager 会打开浏览器登录。登录后如终端仍在等待，重新执行 `git push -u github main`。

## 3. 开启 GitHub Pages

1. 打开仓库 Settings。
2. 左侧选择 Pages。
3. Source 选择 Deploy from a branch。
4. Branch 选择 main，目录选择 / (root)。
5. 保存后等待 1 到 2 分钟。
6. 访问 `https://YOUR_GITHUB_USERNAME.github.io/xiaoliang-theme/`。

## 4. 查看自动审计

打开仓库 Actions，确认 `Audit` 工作流为绿色。该工作流会运行：

- 依赖锁定安装。
- Token、组件与工具类构建。
- 生成文件漂移检查。
- 对比度、ARIA、图标与动效契约审计。
- Playwright 桌面、移动端和交互回归。

任一检查失败都会阻断合并。

## 5. 发布 npm 包（可选）

GitHub 不替代 npm registry。如果希望别人通过 `npm install xiaoliang-theme` 安装：

1. 注册 `https://www.npmjs.com/signup`。
2. 本地执行 `npm login`。
3. 确认版本与更新日志。
4. 执行 `npm publish`。
