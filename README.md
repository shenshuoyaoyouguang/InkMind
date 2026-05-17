# InkMind - AI 智能小说创作工具

基于 Vue 3 + Electron 的桌面端 AI 小说写作应用，帮助创作者高效完成从构思到成稿的全流程。

## 功能特性

### AI 写作引擎
- **智能章节生成**：基于上下文自动生成章节内容，支持续写和扩写
- **AI 写作助手**：提供写作建议、情节分析、角色发展等辅助功能
- **多模型支持**：兼容所有 OpenAI 格式的 API（Claude、GPT、Deepseek 等）

### 创作工具链
- **小说管理**：创建、编辑、分类管理多个小说项目
- **章节管理**：拖拽排序、批量操作、独立编辑每个章节
- **角色设定**：创建和管理角色档案，AI 辅助丰富角色背景
- **世界观构建**：设定地理、历史、规则等世界观要素
- **事件时间线**：管理故事中的关键事件和时间关系
- **语料库**：积累写作素材，供 AI 生成时参考

### 写作辅助
- **短文创作**：支持多种短文类型（故事、诗歌、对话等）
- **提示词库**：预设和自定义 AI 提示词模板
- **书籍分析**：AI 分析文本结构、风格、情感等
- **写作目标**：设定每日字数目标，跟踪创作进度
- **Token 计费**：实时统计 API 调用次数和消耗

### 桌面体验
- **跨平台**：支持 Windows、macOS、Linux
- **系统托盘**：最小化到后台，随时唤出
- **窗口状态记忆**：自动保存窗口位置和大小
- **自动更新**：静默检查并应用更新
- **深色模式**：跟随系统主题自动切换

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | Vue 3 + Vite 5 |
| UI 组件 | Element Plus |
| 状态管理 | Pinia |
| 路由 | Vue Router |
| 富文本编辑 | WangEditor |
| 桌面框架 | Electron 28 + electron-vite |
| 打包分发 | electron-builder (NSIS) |

## 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

启动后支持：
- 渲染进程 HMR 热更新（修改 Vue 组件后页面自动刷新）
- 主进程热重载（修改主进程代码后 Electron 自动重启）
- DevTools 自动打开

### 构建安装包

```bash
npm run build
```

产出位于 `release/` 目录，包含 Windows NSIS 安装程序。

## 项目结构

```
├── src/
│   ├── main/              # Electron 主进程
│   │   ├── index.ts       # 应用入口、生命周期、托盘、菜单
│   │   ├── ipc.ts         # IPC 通信处理
│   │   └── window.ts      # 窗口管理
│   ├── preload/           # Preload 脚本
│   │   └── index.ts       # 安全 API 桥接
│   ├── views/             # 页面组件
│   ├── components/        # 通用组件
│   ├── composables/       # 组合式函数
│   ├── stores/            # Pinia 状态管理
│   ├── services/          # 服务层（存储、API）
│   ├── router/            # 路由配置
│   └── config/            # 静态配置
├── electron.vite.config.ts  # electron-vite 构建配置
├── electron-builder.yml     # 打包配置
└── build/                   # 构建资源（图标等）
```

## AI 服务配置

91写作支持任意 OpenAI 兼容的 API 服务。在应用内的「设置」页面配置：

1. **API 地址**：填入 API 的 Base URL（如 `https://api.openai.com/v1`）
2. **API 密钥**：填入你的 API Key
3. **选择模型**：从下拉列表中选择可用模型

支持的常见服务：OpenAI、Claude (via API)、Deepseek、智谱、通义等。

## 开发指南

### 技术架构

- **主进程** (`src/main/`)：负责窗口管理、系统集成、文件操作
- **渲染进程** (`src/`)：Vue 3 SPA，负责所有 UI 交互
- **通信层**：通过 `contextBridge` + `ipcMain`/`ipcRenderer` 安全通信
- **存储层**：Electron 环境使用文件存储（`userData/data/`），浏览器环境使用 localStorage

### 关键命令

```bash
npm run dev          # 启动开发模式（热重载）
npm run build        # 构建生产版本
npm run preview      # 预览生产构建
npm run lint         # ESLint 代码检查
```

## 贡献

欢迎提交 Issue 和 Pull Request。

## 贡献

欢迎提交 Issue 和 Pull Request。

1. Fork 本仓库
2. 创建功能分支：`git checkout -b feature/your-feature`
3. 提交更改：`git commit -m 'Add your feature'`
4. 推送分支：`git push origin feature/your-feature`
5. 提交 Pull Request

## 许可证

[MIT License](LICENSE) - 自由使用、修改和分发。
