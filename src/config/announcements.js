// 公告配置文件
export const announcements = [
  {
    id: "v1.0.0",
    version: "1.0.0",
    title: "InkMind v1.0.0 正式发布",
    date: "2026-05-18",
    priority: 1,
    content: `
# InkMind v1.0.0

## 全新架构升级

本次更新将底层构建系统从 Vite + electron-builder 迁移至 **electron-vite**，带来更好的开发体验和生产级打包质量。

### 主要更新

- **electron-vite 构建**：统一的主进程/渲染进程构建，开发时支持热重载
- **NSIS 安装程序**：标准 Windows 安装包，支持自定义安装路径
- **静默自动更新**：应用启动时自动检查更新，后台静默下载
- **安全加固**：ASAR 打包、单实例锁、IPC 路径安全校验
- **窗口状态记忆**：窗口位置和大小在重启后自动恢复
- **完整桌面体验**：托盘图标、系统菜单、快捷键支持

### 技术栈

- Vue 3 + Vite 5 + Element Plus
- Electron 28 + electron-vite
- Pinia + Vue Router + WangEditor

感谢所有贡献者和用户的反馈！
    `,
  },
  {
    id: "v0.7.0",
    version: "0.7.0",
    title: "v0.7.0 功能更新",
    date: "2025-01-20",
    priority: 0,
    content: `
# v0.7.0 更新日志

### 功能改进
- 优化 API 配置流程
- 新增模型切换下拉框
- 短文创作功能升级
- 系统稳定性优化

### 支持的 AI 模型
- Claude 4 Sonnet
- Claude Opus 4
- Claude 3.7 Sonnet Thinking
- Claude 3.7 Sonnet
- 以及所有兼容 OpenAI 格式的 API
    `,
  },
];

// 获取最新公告
export function getLatestAnnouncement() {
  return (
    announcements
      .sort((a, b) => b.priority - a.priority)
      .find((announcement) => announcement.priority > 0) || announcements[0]
  );
}

// 获取指定版本的公告
export function getAnnouncementByVersion(version) {
  return announcements.find((announcement) => announcement.version === version);
}

// 检查是否有新版本公告
export function hasNewAnnouncement() {
  const lastReadVersion = localStorage.getItem("lastReadAnnouncementVersion");
  const latestAnnouncement = getLatestAnnouncement();

  if (!lastReadVersion) {
    return true;
  }

  return lastReadVersion !== latestAnnouncement.version;
}

// 标记公告为已读
export function markAnnouncementAsRead(version) {
  localStorage.setItem("lastReadAnnouncementVersion", version);
  localStorage.setItem("lastReadAnnouncementDate", new Date().toISOString());
}

// 获取用户统计信息
export function getAnnouncementStats() {
  return {
    lastReadVersion: localStorage.getItem("lastReadAnnouncementVersion"),
    lastReadDate: localStorage.getItem("lastReadAnnouncementDate"),
  };
}
