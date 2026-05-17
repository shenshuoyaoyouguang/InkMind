/**
 * 统一的存储服务
 * 支持浏览器环境和Electron环境
 * 自动检测运行环境并使用合适的存储方式
 */

// 检测是否在Electron环境中
const isElectron = typeof window !== "undefined" && window.electronAPI;

/**
 * 存储服务类
 */
class StorageService {
  constructor() {
    this.isReady = false;
    this.init();
  }

  async init() {
    if (isElectron) {
      // Electron环境：检查是否需要迁移localStorage数据
      await this.checkMigration();
    }
    this.isReady = true;
  }

  // 检查是否需要迁移localStorage数据
  async checkMigration() {
    try {
      const dataDir = await window.electronAPI.getDataDir();
      // 检查是否存在迁移标记文件
      const result = await window.electronAPI.readFile("migration.done");
      if (!result.success) {
        // 需要迁移：读取所有localStorage数据并保存到文件
        await this.migrateFromLocalStorage();
        // 创建迁移完成标记
        await window.electronAPI.writeFile("migration.done", "true");
      }
    } catch (error) {
      console.log("[存储] 迁移检查失败:", error.message);
    }
  }

  // 从localStorage迁移数据
  async migrateFromLocalStorage() {
    const keysToMigrate = [
      "apiConfigType",
      "officialApiConfig",
      "customApiConfig",
      "customModels",
      "novel_chapters",
      "customTemplates",
      "writingGoals",
      "account_balance",
      "billing_records",
      "token_usage_stats",
      "auto_backup_settings",
      "backup_list",
      "lastReadAnnouncementVersion",
      "lastReadAnnouncementDate",
      "novels",
      "aiApiConfigs",
    ];

    const data = {};
    for (const key of keysToMigrate) {
      const value = localStorage.getItem(key);
      if (value !== null) {
        try {
          data[key] = JSON.parse(value);
        } catch {
          data[key] = value;
        }
      }
    }

    if (Object.keys(data).length > 0) {
      await window.electronAPI.migrateLocalStorage(data);
      console.log("[存储] 数据迁移完成");
    }
  }

  /**
   * 获取数据
   */
  async get(key, defaultValue = null) {
    try {
      if (isElectron) {
        const result = await window.electronAPI.readFile(`${key}.json`);
        if (result.success) {
          return JSON.parse(result.data);
        }
        return defaultValue;
      } else {
        const value = localStorage.getItem(key);
        if (value === null) return defaultValue;
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      }
    } catch (error) {
      console.error(`[存储] 读取失败 ${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * 设置数据
   */
  async set(key, value) {
    try {
      const data = JSON.stringify(value);
      if (isElectron) {
        return await window.electronAPI.writeFile(`${key}.json`, data);
      } else {
        localStorage.setItem(key, data);
        return { success: true };
      }
    } catch (error) {
      console.error(`[存储] 保存失败 ${key}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 删除数据
   */
  async remove(key) {
    try {
      if (isElectron) {
        return await window.electronAPI.deleteFile(`${key}.json`);
      } else {
        localStorage.removeItem(key);
        return { success: true };
      }
    } catch (error) {
      console.error(`[存储] 删除失败 ${key}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取所有键
   */
  async keys() {
    try {
      if (isElectron) {
        const result = await window.electronAPI.listFiles("");
        if (result.success) {
          return result.data
            .filter((f) => f.endsWith(".json"))
            .map((f) => f.replace(".json", ""));
        }
        return [];
      } else {
        return Object.keys(localStorage);
      }
    } catch (error) {
      console.error("[存储] 获取键列表失败:", error);
      return [];
    }
  }

  /**
   * 清空所有数据
   */
  async clear() {
    try {
      if (isElectron) {
        const files = await this.keys();
        for (const key of files) {
          await this.remove(key);
        }
      } else {
        localStorage.clear();
      }
      return { success: true };
    } catch (error) {
      console.error("[存储] 清空失败:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 导出所有数据
   */
  async exportAll() {
    const keys = await this.keys();
    const data = {};
    for (const key of keys) {
      data[key] = await this.get(key);
    }
    return data;
  }

  /**
   * 导入数据
   */
  async importAll(data) {
    for (const [key, value] of Object.entries(data)) {
      await this.set(key, value);
    }
    return { success: true };
  }

  /**
   * 检查是否在Electron环境
   */
  isElectronEnv() {
    return isElectron;
  }

  /**
   * 获取系统主题
   */
  async getSystemTheme() {
    if (isElectron) {
      return await window.electronAPI.getSystemTheme();
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  /**
   * 显示系统通知
   */
  async showNotification(title, body) {
    if (isElectron) {
      return await window.electronAPI.showNotification(title, body);
    }
    // 浏览器环境使用Notification API
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body });
      return { success: true };
    }
    return { success: false, error: "浏览器通知不支持" };
  }

  /**
   * 选择文件
   */
  async selectFile(options) {
    if (isElectron) {
      return await window.electronAPI.selectFile(options);
    }
    return { canceled: true };
  }

  /**
   * 保存文件对话框
   */
  async saveFile(options) {
    if (isElectron) {
      return await window.electronAPI.saveFile(options);
    }
    return { canceled: true };
  }
}

// 导出单例
const storage = new StorageService();

export default storage;
export { StorageService };
