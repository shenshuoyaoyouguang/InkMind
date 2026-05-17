import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // 文件操作
  readFile: (filePath: string) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath: string, content: string) => ipcRenderer.invoke('write-file', filePath, content),
  deleteFile: (filePath: string) => ipcRenderer.invoke('delete-file', filePath),
  listFiles: (dirPath: string) => ipcRenderer.invoke('list-files', dirPath),

  // 文件对话框
  selectFile: (options: any) => ipcRenderer.invoke('select-file-dialog', options),
  saveFile: (options: any) => ipcRenderer.invoke('save-file-dialog', options),

  // 系统功能
  getSystemTheme: () => ipcRenderer.invoke('get-system-theme'),
  getAppPath: (name: string) => ipcRenderer.invoke('get-app-path', name),
  showNotification: (title: string, body: string) => ipcRenderer.invoke('show-notification', title, body),
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),

  // 数据迁移
  migrateLocalStorage: (data: Record<string, any>) => ipcRenderer.invoke('migrate-localstorage', data),

  // 获取数据目录
  getDataDir: () => ipcRenderer.invoke('get-data-dir'),

  // 窗口控制
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),

  // 监听菜单事件（防重复注册）
  onMenuAction: (() => {
    let listener: ((...args: any[]) => void) | null = null
    return (callback: (action: string, data?: any) => void) => {
      if (listener) ipcRenderer.removeListener('menu-action', listener)
      listener = (_event, action, data) => callback(action, data)
      ipcRenderer.on('menu-action', listener)
    }
  })(),

  // 移除菜单监听
  removeMenuListener: () => {
    ipcRenderer.removeAllListeners('menu-action')
  }
})

console.log('[InkMind] Preload脚本已加载')
