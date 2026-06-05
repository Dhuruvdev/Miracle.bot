'use strict';

/**
 * OpenEmbedded — Electron main process
 *
 * Web-wrapper mode: loads the live website URL in production.
 * No frontend files are bundled — the app is a thin shell that:
 *   1. Opens the website in a BrowserWindow
 *   2. Injects the Discord Rich Presence bridge via preload.js
 *   3. Updates Discord activity as the user navigates pages
 *
 * Config (set via .env or environment):
 *   APP_URL         — live website to load (default: https://discord.builders)
 *   ELECTRON_DEV=1  — dev mode: loads localhost:5000 instead
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const { app, BrowserWindow, ipcMain, shell, Menu } = require('electron');
const path = require('path');
const rpc  = require('./rpc');

// ── Config ────────────────────────────────────────────────────────────────────

const DEV     = process.env.ELECTRON_DEV === '1';
const APP_URL = process.env.APP_URL || 'https://discord.builders';
const LOAD_URL = DEV ? 'http://localhost:5000' : APP_URL;

// ── Window ────────────────────────────────────────────────────────────────────

let mainWindow = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width:     1280,
        height:    820,
        minWidth:  900,
        minHeight: 600,
        title:     'OpenEmbedded',
        backgroundColor: '#1a1b2e',
        webPreferences: {
            preload:          path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration:  false,
            sandbox:          false,
            // Keep security on — we always load from a real URL
            webSecurity:      true,
        },
        titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
        show: false,
    });

    // Show once ready — avoids white flash on startup
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        if (DEV) mainWindow.webContents.openDevTools({ mode: 'detach' });
        console.log('[Main] Loaded:', LOAD_URL);
    });

    // Always load from URL — dev hits localhost, prod hits live site
    mainWindow.loadURL(LOAD_URL).catch(err => {
        console.error('[Main] Failed to load URL:', LOAD_URL, err.message);
        // Show a friendly error page if the URL is unreachable
        mainWindow.loadURL('data:text/html,<html style="background:%231a1b2e;color:%23fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><div style="text-align:center"><h2>OpenEmbedded</h2><p>Could not load the app. Check your internet connection.</p><button onclick="location.reload()" style="padding:.5rem 1.5rem;background:%235865F2;color:%23fff;border:none;border-radius:4px;cursor:pointer;font-size:1rem">Retry</button></div></html>');
    });

    // Open external links in the system browser, not a new Electron window
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('http')) {
            shell.openExternal(url);
            return { action: 'deny' };
        }
        return { action: 'allow' };
    });

    mainWindow.on('closed', () => { mainWindow = null; });
}

// ── App menu ──────────────────────────────────────────────────────────────────

function buildMenu() {
    const isMac = process.platform === 'darwin';
    const template = [
        ...(isMac ? [{
            label: app.name,
            submenu: [
                { role: 'about' },
                { type: 'separator' },
                { role: 'services' },
                { type: 'separator' },
                { role: 'hide' },
                { role: 'hideOthers' },
                { role: 'unhide' },
                { type: 'separator' },
                { role: 'quit' },
            ],
        }] : []),
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' }, { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' }, { role: 'copy' },
                { role: 'paste' }, { role: 'selectAll' },
            ],
        },
        {
            label: 'View',
            submenu: [
                { role: 'reload' }, { role: 'forceReload' },
                { type: 'separator' },
                { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' },
            ],
        },
        {
            label: 'Window',
            submenu: [
                { role: 'minimize' }, { role: 'zoom' },
                ...(isMac
                    ? [{ type: 'separator' }, { role: 'front' }]
                    : [{ role: 'close' }]),
            ],
        },
    ];
    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ── IPC handlers ──────────────────────────────────────────────────────────────

// Renderer → Main: page navigated (from useElectronActivity hook)
ipcMain.on('rpc:set-page', (_event, pagePath) => {
    rpc.setPage(pagePath);
});

// Renderer → Main (sync): app version
ipcMain.on('app:version', (event) => {
    event.returnValue = app.getVersion();
});

// ── Lifecycle ─────────────────────────────────────────────────────────────────

app.whenReady().then(() => {
    buildMenu();
    createWindow();

    // Start Discord Rich Presence (silent no-op if Discord isn't running)
    try { rpc.start(); } catch (err) {
        console.warn('[Main] Discord RPC start failed:', err.message);
    }

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    rpc.destroy();
    if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
    rpc.destroy();
});
