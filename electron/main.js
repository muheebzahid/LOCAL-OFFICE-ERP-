const { app, BrowserWindow, shell, Menu } = require('electron')
const path = require('path')

const SERVER_URL = process.env.ERP_SERVER_URL || 'http://164.90.177.211'

let mainWindow = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 850,
    minWidth: 1024,
    minHeight: 640,
    title: 'AQUA CELL ERP – Inventory & Refurbishment Tracker',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
    autoHideMenuBar: false,
  })

  // Set custom application menu
  const menuTemplate = [
    {
      label: 'File',
      submenu: [
        { label: 'Reload App', accelerator: 'CmdOrCtrl+R', click: () => mainWindow.reload() },
        { label: 'Force Reload', accelerator: 'CmdOrCtrl+Shift+R', click: () => mainWindow.webContents.reloadIgnoringCache() },
        { type: 'separator' },
        { label: 'Print Invoice / Page', accelerator: 'CmdOrCtrl+P', click: () => mainWindow.webContents.print() },
        { type: 'separator' },
        { label: 'Exit AQUA CELL ERP', role: 'quit' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { role: 'close' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'AQUA CELL Server Connection',
          click: () => {
            const { dialog } = require('electron')
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Server Connection Info',
              message: 'Connected to Central Cloud Database',
              detail: `Server Address: ${SERVER_URL}\nAll inventory, sales, and refurb status updates are synced live across all team devices.`,
            })
          },
        },
      ],
    },
  ]

  const menu = Menu.buildFromTemplate(menuTemplate)
  Menu.setApplicationMenu(menu)

  // Load Cloud ERP
  mainWindow.loadURL(SERVER_URL)

  // Handle external links safely
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url)
      return { action: 'deny' }
    }
    return { action: 'allow' }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
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
