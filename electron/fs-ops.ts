import { app, dialog, ipcMain, shell } from "electron";
import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";

interface AppSettings {
  rootFolder: string | null;
  tiposDeVisita: string[];
  tecnicoNome: string;
  tecnicoEmpresa: string;
}

interface VisitaRef {
  empresa: string;
  mes: string;
  dia: string;
  tipoVisita: string;
}

interface FileEntry {
  name: string;
  path: string;
  sizeBytes: number;
  mimeType: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  rootFolder: null,
  tiposDeVisita: ["Avaliação Técnica", "Manutenção Preventiva", "Manutenção Corretiva"],
  tecnicoNome: "",
  tecnicoEmpresa: "",
};

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".heic", ".webp", ".gif"];
const VIDEO_EXTENSIONS = [".mp4", ".mov", ".avi", ".mkv", ".webm"];

function settingsFilePath(): string {
  return path.join(app.getPath("userData"), "settings.json");
}

async function readSettings(): Promise<AppSettings> {
  try {
    const raw = await fs.readFile(settingsFilePath(), "utf-8");
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

async function writeSettings(settings: AppSettings): Promise<AppSettings> {
  await fs.mkdir(path.dirname(settingsFilePath()), { recursive: true });
  await fs.writeFile(settingsFilePath(), JSON.stringify(settings, null, 2), "utf-8");
  return settings;
}

/** Remove caracteres inválidos para nomes de pasta no Windows. */
function sanitizeName(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, "-").trim();
}

async function ensureRootFolder(): Promise<string> {
  const settings = await readSettings();
  if (!settings.rootFolder) {
    throw new Error("Nenhuma pasta raiz configurada. Configure em Ajustes primeiro.");
  }
  await fs.mkdir(settings.rootFolder, { recursive: true });
  return settings.rootFolder;
}

async function listSubdirectories(dirPath: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    return entries
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort((a, b) => b.localeCompare(a));
  } catch {
    return [];
  }
}

function visitaPath(root: string, ref: VisitaRef): string {
  return path.join(root, sanitizeName(ref.empresa), ref.mes, ref.dia, sanitizeName(ref.tipoVisita));
}

function mimeTypeFor(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  if (IMAGE_EXTENSIONS.includes(ext)) return `image/${ext.slice(1)}`;
  if (VIDEO_EXTENSIONS.includes(ext)) return `video/${ext.slice(1)}`;
  return "application/octet-stream";
}

async function listFilesIn(dirPath: string): Promise<FileEntry[]> {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const files = entries.filter((e) => e.isFile());
    const stats = await Promise.all(
      files.map(async (f) => {
        const fullPath = path.join(dirPath, f.name);
        const stat = await fs.stat(fullPath);
        return {
          name: f.name,
          path: fullPath,
          sizeBytes: stat.size,
          mimeType: mimeTypeFor(f.name),
        };
      }),
    );
    return stats;
  } catch {
    return [];
  }
}

export function registerFsHandlers(): void {
  ipcMain.handle("settings:get", async () => readSettings());

  ipcMain.handle("settings:save", async (_event, settings: AppSettings) => writeSettings(settings));

  ipcMain.handle("settings:chooseRootFolder", async () => {
    const result = await dialog.showOpenDialog({ properties: ["openDirectory", "createDirectory"] });
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
  });

  ipcMain.handle("empresas:list", async () => {
    const root = await ensureRootFolder();
    return listSubdirectories(root);
  });

  ipcMain.handle("empresas:create", async (_event, nome: string) => {
    const root = await ensureRootFolder();
    await fs.mkdir(path.join(root, sanitizeName(nome)), { recursive: true });
  });

  ipcMain.handle("visitas:listMeses", async (_event, empresa: string) => {
    const root = await ensureRootFolder();
    return listSubdirectories(path.join(root, sanitizeName(empresa)));
  });

  ipcMain.handle("visitas:listDias", async (_event, empresa: string, mes: string) => {
    const root = await ensureRootFolder();
    return listSubdirectories(path.join(root, sanitizeName(empresa), mes));
  });

  ipcMain.handle("visitas:listTipos", async (_event, empresa: string, mes: string, dia: string) => {
    const root = await ensureRootFolder();
    return listSubdirectories(path.join(root, sanitizeName(empresa), mes, dia));
  });

  ipcMain.handle("visitas:create", async (_event, ref: VisitaRef) => {
    const root = await ensureRootFolder();
    const base = visitaPath(root, ref);
    await fs.mkdir(path.join(base, "fotos"), { recursive: true });
    await fs.mkdir(path.join(base, "videos"), { recursive: true });
    await fs.mkdir(path.join(base, "laudo"), { recursive: true });
  });

  ipcMain.handle("arquivos:list", async (_event, ref: VisitaRef, categoria: "fotos" | "videos") => {
    const root = await ensureRootFolder();
    return listFilesIn(path.join(visitaPath(root, ref), categoria));
  });

  ipcMain.handle("arquivos:pickFiles", async (_event, categoria: "fotos" | "videos") => {
    const extensions = categoria === "fotos" ? IMAGE_EXTENSIONS : VIDEO_EXTENSIONS;
    const result = await dialog.showOpenDialog({
      properties: ["openFile", "multiSelections"],
      filters: [{ name: categoria === "fotos" ? "Fotos" : "Vídeos", extensions: extensions.map((e) => e.slice(1)) }],
    });
    if (result.canceled) return [];
    return result.filePaths;
  });

  ipcMain.handle(
    "arquivos:add",
    async (_event, ref: VisitaRef, categoria: "fotos" | "videos", sourcePaths: string[]) => {
      const root = await ensureRootFolder();
      const targetDir = path.join(visitaPath(root, ref), categoria);
      await fs.mkdir(targetDir, { recursive: true });
      for (const sourcePath of sourcePaths) {
        const destPath = path.join(targetDir, path.basename(sourcePath));
        await fs.copyFile(sourcePath, destPath);
      }
      return listFilesIn(targetDir);
    },
  );

  ipcMain.handle(
    "arquivos:remove",
    async (_event, ref: VisitaRef, categoria: "fotos" | "videos", fileName: string) => {
      const root = await ensureRootFolder();
      const filePath = path.join(visitaPath(root, ref), categoria, fileName);
      await fs.unlink(filePath);
    },
  );

  ipcMain.handle("arquivos:openInExplorer", async (_event, ref: VisitaRef) => {
    const root = await ensureRootFolder();
    const target = visitaPath(root, ref);
    if (!fsSync.existsSync(target)) {
      await fs.mkdir(target, { recursive: true });
    }
    await shell.openPath(target);
  });

  ipcMain.handle("laudo:get", async (_event, ref: VisitaRef) => {
    const root = await ensureRootFolder();
    const jsonPath = path.join(visitaPath(root, ref), "laudo", "laudo.json");
    try {
      const raw = await fs.readFile(jsonPath, "utf-8");
      return JSON.parse(raw);
    } catch {
      return null;
    }
  });
}

export { ensureRootFolder, visitaPath, sanitizeName };
