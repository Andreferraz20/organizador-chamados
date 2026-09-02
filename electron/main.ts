import { app, BrowserWindow, Menu, net, protocol } from "electron";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { registerFsHandlers, registerMediaContextMenu } from "./fs-ops";
import { registerPdfHandlers } from "./pdf";
import { registerDocumentacaoHandlers } from "./docs-ops";
import { registerEstoqueHandlers } from "./estoque-ops";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Remove a barra de menu padrão do Electron (File/Edit/View/Window) — não faz
// sentido pro usuário final deste app.
Menu.setApplicationMenu(null);

/** Protocolo customizado pra exibir previews de fotos/vídeos locais sem os bloqueios de "file://". */
protocol.registerSchemesAsPrivileged([
  {
    scheme: "media",
    privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true, bypassCSP: true, corsEnabled: true },
  },
]);

process.env.APP_ROOT = path.join(__dirname, "..");
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");

let win: BrowserWindow | null = null;

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: "Área do Técnico",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  win.webContents.on("preload-error", (_event, preloadPath, error) => {
    console.error("[preload-error]", preloadPath, error);
  });

  registerMediaContextMenu(win);

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(() => {
  protocol.handle("media", (request) => {
    try {
      // O caminho vem no query param "path" (ver toMediaUrl em src/lib/api.ts).
      const filePath = new URL(request.url).searchParams.get("path") ?? "";
      return net.fetch(pathToFileURL(filePath).toString());
    } catch (error) {
      console.error("[media protocol]", request.url, error);
      throw error;
    }
  });

  registerFsHandlers();
  registerPdfHandlers();
  registerDocumentacaoHandlers();
  registerEstoqueHandlers();
  createWindow();
});
