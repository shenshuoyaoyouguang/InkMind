import { BrowserWindow, app } from 'electron'
import path from 'path'
import fs from 'fs'

let mainWindow: BrowserWindow | null = null

interface WindowState {
  x?: number
  y?: number
  width: number
  height: number
  isMaximized: boolean
}

function getWindowStatePath(): string {
  return path.join(app.getPath('userData'), 'window-state.json')
}

function loadWindowState(): WindowState {
  const defaultState: WindowState = { width: 1200, height: 800, isMaximized: false }
  try {
    const statePath = getWindowStatePath()
    if (fs.existsSync(statePath)) {
      const data = JSON.parse(fs.readFileSync(statePath, 'utf-8'))
      return { ...defaultState, ...data }
    }
  } catch {
    // 使用默认状态
  }
  return defaultState
}

let saveTimeout: ReturnType<typeof setTimeout> | null = null

function saveWindowState(win: BrowserWindow) {
  if (saveTimeout) clearTimeout(saveTimeout)
  saveTimeout = setTimeout(() => {
    try {
      if (!win.isDestroyed()) {
        const isMaximized = win.isMaximized()
        const bounds = win.getBounds()
        const state: WindowState = {
          x: bounds.x,
          y: bounds.y,
          width: bounds.width,
          height: bounds.height,
          isMaximized
        }
        fs.writeFileSync(getWindowStatePath(), JSON.stringify(state, null, 2), 'utf-8')
      }
    } catch {
      // 静默失败
    }
  }, 500)
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow
}

export function setMainWindow(win: BrowserWindow | null) {
  mainWindow = win
}

export function createMainWindow(isDev: boolean): BrowserWindow {
  const savedState = loadWindowState()

  mainWindow = new BrowserWindow({
    x: savedState.x,
    y: savedState.y,
    width: savedState.width,
    height: savedState.height,
    minWidth: 800,
    minHeight: 600,
    title: 'InkMind',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      preload: path.join(import.meta.dirname, '../preload/index.mjs')
    },
    show: false
  })

  if (savedState.isMaximized) {
    mainWindow.maximize()
  }

  if (isDev) {
    mainWindow.loadURL('http://localhost:7520')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(import.meta.dirname, '../renderer/index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow!.show()
    console.log('[InkMind] 应用已启动')
  })

  mainWindow.on('resize', () => saveWindowState(mainWindow!))
  mainWindow.on('move', () => saveWindowState(mainWindow!))

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  return mainWindow
}
