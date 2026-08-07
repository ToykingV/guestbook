# 📝 Guestbook — GitHub 留言板

一个纯前端、零后端的留言板网页，利用 **GitHub Issues** 作为数据存储，可部署在 **GitHub Pages** 上供任何人访问和留言。

## ✨ 功能特性

- 🌐 **零后端** — 纯静态页面，利用 GitHub Issues API 存储数据
- 🎨 **精美 UI** — 深色主题 + 流畅动画，支持移动端响应式
- 💬 **实时留言** — 访客填写昵称和留言即可发布
- 🔄 **排序切换** — 支持按最新/最早排序浏览
- 📄 **分页加载** — 留言多了自动分页，性能无忧
- 🔒 **可选 Token** — 配置 GitHub Token 可提高 API 速率限制
- 📱 **响应式** — 手机、平板、桌面完美适配

## 🚀 快速部署（5 分钟）

### 第 1 步：Fork 或创建仓库

1. 在 GitHub 上创建一个**公开仓库**，名称随意（如 `guestbook`）
2. 将本目录下的三个文件上传到仓库根目录：
   - `index.html`
   - `style.css`
   - `app.js`

### 第 2 步：开启 GitHub Pages

1. 进入仓库 → **Settings** → **Pages**
2. **Source** 选择 `Deploy from a branch`
3. **Branch** 选择 `main`（或 `master`）→ 点击 **Save**
4. 等待约 30 秒，访问 `https://<你的用户名>.github.io/<仓库名>/`

### 第 3 步：配置留言板

打开网页后：

1. 点击页面底部的 **⚙️ 配置** 按钮
2. 填写你的 **GitHub 用户名** 和 **仓库名称**
3. （可选）生成一个 [GitHub Token](https://github.com/settings/tokens) 填入，可提高 API 调用限额
4. 点击 **💾 保存配置**

> ⚠️ **Token 仅保存在访客的浏览器 localStorage 中，不会上传到任何服务器。**

### 第 4 步：（推荐）预填默认配置

如果你想让访客打开就能直接用、无需手动配置，直接修改 `app.js` 顶部的 `DEFAULT_CONFIG`：

```javascript
const DEFAULT_CONFIG = {
    owner: '你的GitHub用户名',
    repo:  '你的仓库名',
    token: '',  // 留空即可，访客浏览器会用自己的匿名配额
};
```

同时修改 `index.html` 中 `<script src="app.js">` 之前的部分，无需改动。

推送后 GitHub Pages 会自动更新。

## 📋 使用说明

- 任何人打开网页 → 输入昵称 + 留言 → 点击发布
- 留言会以 **GitHub Issue** 的形式保存在你的仓库中
- 你可以在仓库的 Issues 页面统一管理（置顶、锁定、删除等）
- 每条留言的 Issue 标题格式为 `[留言] 昵称`

## 🔧 进阶配置

### 提高 API 限额

未认证请求：每小时 60 次  
认证请求（带 Token）：每小时 5000 次

**生成 Token 步骤：**
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. 点击 **Generate new token** → 勾选 `public_repo` 权限
3. 复制 Token，粘贴到配置弹窗中

### 自定义样式

编辑 `style.css` 中的 `:root` 变量即可一键换色：

```css
:root {
    --primary: #6366f1;       /* 主色调 */
    --bg: #0f172a;            /* 背景色 */
    --bg-card: #1e293b;       /* 卡片背景 */
    --text: #e2e8f0;          /* 文字颜色 */
    /* ... */
}
```

## 📁 文件结构

```
guestbook/
├── index.html    ← 页面结构
├── style.css     ← 样式表
├── app.js        ← 核心逻辑（GitHub API 交互）
└── README.md     ← 本文件
```

## 🛡️ 安全提示

- 仓库建议设为 **Public**（GitHub Pages 免费版仅支持公开仓库）
- 不要将高权限 Token 硬编码到 `app.js` 中
- 建议创建一个**仅限 `public_repo` 权限**的 Token
- 可在仓库 Settings → Moderation 中开启 Issue 评论限制

## 📜 License

MIT License — 随意使用、修改、分发 🎉
