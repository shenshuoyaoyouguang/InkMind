import { ipcMain, dialog, nativeTheme, app, shell, Notification } from 'electron'
import path from 'path'
import fs from 'fs'
import type { BrowserWindow } from 'electron'

let dataDir: string

export function setDataDir(dir: string) {
  dataDir = dir
}

export function getDataDir() {
  return dataDir
}

function isWithinDataDir(filePath: string): boolean {
  const resolved = path.resolve(dataDir, filePath)
  return resolved.startsWith(path.resolve(dataDir) + path.sep) || resolved === path.resolve(dataDir)
}

export function setupIpcHandlers(getMainWindow: () => BrowserWindow | null) {
  // 读取文件
  ipcMain.handle('read-file', async (_event, filePath: string) => {
    try {
      if (!isWithinDataDir(filePath)) {
        return { success: false, error: '路径不允许' }
      }
      const fullPath = path.join(dataDir, filePath)
      const content = fs.readFileSync(fullPath, 'utf-8')
      return { success: true, data: content }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  // 写入文件
  ipcMain.handle('write-file', async (_event, filePath: string, content: string) => {
    try {
      if (!isWithinDataDir(filePath)) {
        return { success: false, error: '路径不允许' }
      }
      const fullPath = path.join(dataDir, filePath)
      const dir = path.dirname(fullPath)
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
      fs.writeFileSync(fullPath, content, 'utf-8')
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  // 删除文件
  ipcMain.handle('delete-file', async (_event, filePath: string) => {
    try {
      if (!isWithinDataDir(filePath)) {
        return { success: false, error: '路径不允许' }
      }
      const fullPath = path.join(dataDir, filePath)
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath)
      }
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  // 列出目录
  ipcMain.handle('list-files', async (_event, dirPath: string) => {
    try {
      const targetDir = dirPath || ''
      if (!isWithinDataDir(targetDir)) {
        return { success: false, error: '路径不允许' }
      }
      const fullPath = path.join(dataDir, targetDir)
      if (!fs.existsSync(fullPath)) {
        return { success: true, data: [] }
      }
      const files = fs.readdirSync(fullPath)
      return { success: true, data: files }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  // 选择文件对话框
  ipcMain.handle('select-file-dialog', async (_event, options: any) => {
    const mainWindow = getMainWindow()
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openFile'],
      filters: options?.filters || [{ name: '所有文件', extensions: ['*'] }]
    })
    return result
  })

  // 保存文件对话框
  ipcMain.handle('save-file-dialog', async (_event, options: any) => {
    const mainWindow = getMainWindow()
    const result = await dialog.showSaveDialog(mainWindow!, {
      defaultPath: options?.defaultPath,
      filters: options?.filters || [{ name: '所有文件', extensions: ['*'] }]
    })
    return result
  })

  // 获取系统主题
  ipcMain.handle('get-system-theme', () => {
    return nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
  })

  // 获取应用路径（白名单限制）
  const ALLOWED_PATHS = ['userData', 'appData', 'documents'] as const
  ipcMain.handle('get-app-path', (_event, name: string) => {
    if (!ALLOWED_PATHS.includes(name as any)) return null
    return app.getPath(name as any)
  })

  // 显示系统通知
  ipcMain.handle('show-notification', async (_event, title: string, body: string) => {
    if (Notification.isSupported()) {
      new Notification({ title, body }).show()
      return { success: true }
    }
    return { success: false, error: '通知不支持' }
  })

  // 窗口控制（fire-and-forget，使用 ipcMain.on）
  ipcMain.on('window-minimize', () => {
    getMainWindow()?.minimize()
  })

  ipcMain.on('window-maximize', () => {
    const mainWindow = getMainWindow()
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow?.maximize()
    }
  })

  ipcMain.on('window-close', () => {
    getMainWindow()?.close()
  })

  ipcMain.handle('window-is-maximized', () => {
    return getMainWindow()?.isMaximized() || false
  })

  // 打开外部链接（仅允许 http/https）
  ipcMain.handle('open-external', async (_event, url: string) => {
    try {
      const parsed = new URL(url)
      if (!['https:', 'http:'].includes(parsed.protocol)) return
      await shell.openExternal(url)
    } catch {
      // 无效 URL，忽略
    }
  })

  // 迁移localStorage数据
  ipcMain.handle('migrate-localstorage', async (_event, data: Record<string, any>) => {
    try {
      for (const [key, value] of Object.entries(data)) {
        const filePath = `${key}.json`
        if (!isWithinDataDir(filePath)) {
          continue
        }
        const fullPath = path.join(dataDir, filePath)
        fs.writeFileSync(fullPath, JSON.stringify(value, null, 2), 'utf-8')
      }
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  })

  // 获取数据目录路径
  ipcMain.handle('get-data-dir', () => {
    return dataDir
  })
}
