import { app, BrowserWindow } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

app.disableHardwareAcceleration()

function createWindow() {
  const win = new BrowserWindow({
    width: 1500,
    height: 980,
    minWidth: 1200,
    minHeight: 760,
    title: 'Smart Money Analyst',
    backgroundColor: '#020817',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  const isDev = process.env.ELECTRON_DEV === 'true'
  const indexPath = path.join(__dirname, 'dist', 'index.html')

  if (isDev) {
    win.loadURL('http://localhost:5173')
  } else {
    win.loadFile(indexPath)
  }
  win.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    console.error('Failed to load app:', errorCode, errorDescription)
  })
  win.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    console.log(`[renderer:${level}] ${message} (${sourceId}:${line})`)
  })
  win.webContents.on('render-process-gone', (_event, details) => {
    console.error('Renderer process stopped:', details.reason, details.exitCode)
  })
  win.setMenuBarVisibility(false)
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
