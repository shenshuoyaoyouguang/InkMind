import { app, BrowserWindow, dialog, Menu, Tray, shell } from 'electron'
import path from 'path'
import fs from 'fs'
import { autoUpdater } from 'electron-updater'
import { createMainWindow, getMainWindow } from './window'
import { setupIpcHandlers, setDataDir } from './ipc'

let tray: Tray | null = null

const isDev = !app.isPackaged

function initDataDir() {
  const userDataPath = app.getPath('userData')
  const dataDir = path.join(userDataPath, 'data')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
  setDataDir(dataDir)
}

function createMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: '文件',
      submenu: [
        {
          label: '新建小说',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            getMainWindow()?.webContents.send('menu-action', 'new-novel')
          }
        },
        {
          label: '打开...',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const mainWindow = getMainWindow()
            const result = await dialog.showOpenDialog(mainWindow!, {
              properties: ['openFile'],
              filters: [{ name: 'InkMind项目', extensions: ['91w'] }]
            })
            if (!result.canceled && result.filePaths.length > 0) {
              mainWindow?.webContents.send('menu-action', 'open-file', result.filePaths[0])
            }
          }
        },
        { type: 'separator' },
        {
          label: '导出...',
          accelerator: 'CmdOrCtrl+E',
          click: () => {
            getMainWindow()?.webContents.send('menu-action', 'export')
          }
        },
        { type: 'separator' },
        { role: 'quit', label: '退出' }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo', label: '撤销' },
        { role: 'redo', label: '重做' },
        { type: 'separator' },
        { role: 'cut', label: '剪切' },
        { role: 'copy', label: '复制' },
        { role: 'paste', label: '粘贴' },
        { role: 'selectAll', label: '全选' }
      ]
    },
    {
      label: '视图',
      submenu: [
        { role: 'reload', label: '重新加载' },
        { role: 'forceReload', label: '强制重新加载' },
        { role: 'toggleDevTools', label: '开发者工具' },
        { type: 'separator' },
        { role: 'resetZoom', label: '实际大小' },
        { role: 'zoomIn', label: '放大' },
        { role: 'zoomOut', label: '缩小' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: '全屏' }
      ]
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于InkMind',
          click: () => {
            dialog.showMessageBox(getMainWindow()!, {
              type: 'info',
              title: '关于InkMind',
              message: 'InkMind v1.0.0',
              detail: 'AI智能小说创作工具\n基于 Vue 3 + Electron'
            })
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

function createTray() {
  try {
    const iconPath = path.join(import.meta.dirname, '../renderer/icon.png')
    if (fs.existsSync(iconPath)) {
      tray = new Tray(iconPath)

      const contextMenu = Menu.buildFromTemplate([
        {
          label: '显示窗口',
          click: () => {
            getMainWindow()?.show()
          }
        },
        {
          label: '写作目标提醒',
          click: () => {
            getMainWindow()?.webContents.send('menu-action', 'show-goals')
          }
        },
        { type: 'separator' },
        {
          label: '退出',
          click: () => {
            app.quit()
          }
        }
      ])

      tray.setToolTip('InkMind - AI智能小说创作')
      tray.setContextMenu(contextMenu)

      tray.on('click', () => {
        getMainWindow()?.show()
      })
    }
  } catch (error) {
    console.log('[InkMind] 托盘图标不存在，跳过托盘创建')
  }
}

function setupAutoUpdater() {
  // 静默自动更新：启动时检查，后台下载，下次启动安装
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('checking-for-update', () => {
    console.log('[InkMind] 检查更新...')
  })

  autoUpdater.on('update-available', (info) => {
    console.log('[InkMind] 发现新版本:', info.version)
  })

  autoUpdater.on('update-not-available', () => {
    console.log('[InkMind] 当前已是最新版本')
  })

  autoUpdater.on('download-progress', (progress) => {
    console.log(`[InkMind] 下载进度: ${Math.round(progress.percent)}%`)
  })

  autoUpdater.on('update-downloaded', (info) => {
    console.log('[InkMind] 更新下载完成，将在下次退出时安装:', info.version)
  })

  autoUpdater.on('error', (error) => {
    console.error('[InkMind] 更新检查失败:', error.message)
  })

  // 启动时延迟检查更新（不阻塞启动）
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch(() => {
      // 静默失败，不影响正常使用
    })
  }, 5000)
}

// 单实例锁
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    const mainWindow = getMainWindow()
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  app.whenReady().then(() => {
    console.log('[InkMind] 应用初始化...')
    initDataDir()
    createMainWindow(isDev)
    createMenu()
    createTray()
    setupIpcHandlers(getMainWindow)

    if (!isDev) {
      setupAutoUpdater()
    }

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow(isDev)
      }
    })
  })
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  console.log('[InkMind] 应用退出...')
  tray?.destroy()
  tray = null
})
