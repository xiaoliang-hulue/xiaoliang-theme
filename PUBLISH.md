# 发布到 Gitee 指南

## 我已帮你完成

- [x] 初始化 Git 仓库
- [x] 创建 `.gitignore`
- [x] 提交初始版本（`v1.2.0`）
- [x] 准备 `package.json`、`README.md`、`SKILL.md` 等文件

## 需要你提供/完成

### 1. Gitee 账号与仓库

- 注册/登录 [Gitee](https://gitee.com)
- 新建仓库，建议命名为 `xiaoliang-theme`
- 不要勾选「初始化仓库」（已有本地提交）

### 2. 提供仓库地址

你的 Gitee 仓库地址：

```
https://gitee.com/huluexiaoliang/xiaoliang-theme.git
git@gitee.com:huluexiaoliang/xiaoliang-theme.git
```

`package.json` 的 `repository` 字段已更新。

### 3. 配置 Git 作者信息（重要）

当前本地仓库使用了占位作者：

```bash
cd /workspace/.design_library/小亮主题
git config user.name "你的名称"
git config user.email "你的邮箱"
```

然后修改最后一次提交的作者：

```bash
git commit --amend --author="你的名称 <你的邮箱>" --no-edit
```

### 4. 推送代码到 Gitee

#### 方式 A：SSH（推荐）

1. 在本地生成 SSH key：

```bash
ssh-keygen -t ed25519 -C "你的邮箱"
cat ~/.ssh/id_ed25519.pub
```

2. 把公钥添加到 Gitee：设置 → SSH 公钥
3. 推送：

```bash
git remote add origin git@gitee.com:huluexiaoliang/xiaoliang-theme.git
git branch -M main
git push -u origin main
```

#### 方式 B：HTTPS

```bash
git remote add origin https://gitee.com/huluexiaoliang/xiaoliang-theme.git
git branch -M main
git push -u origin main
```

推送时会要求输入 Gitee 用户名和密码。

## 发布后可选：发布 npm 包

Gitee 是代码托管平台，不能替代 npm registry。如果希望别人通过 `npm install xiaoliang-theme` 安装，还需要：

1. 注册 [npm](https://www.npmjs.com) 账号
2. 本地登录：`npm login`
3. 发布：`npm publish`

如果只是通过 Gitee 安装，可以使用：

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

## 发布为 Trae Skill

如需将此设计系统作为 Trae Skill 安装调用，需通过 Trae 的 Skill 安装机制将本仓库（或本地目录）注册为 Skill。具体方式取决于 Trae 当前支持的 Skill 来源（本地路径 / Git URL / Skill 市场）。

安装后，在对话中激活「小亮主题」Skill，AI 将读取 `SKILL.md` 与 Token 文件生成符合规范的界面。
