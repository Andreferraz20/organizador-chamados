import { app, dialog, ipcMain, shell } from "electron";
import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";

interface TipoVisitaConfig {
  label: string;
  sigla: string;
}

interface AppSettings {
  rootFolder: string | null;
  tiposDeVisita: TipoVisitaConfig[];
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
  tiposDeVisita: [
    { label: "Avaliação Técnica", sigla: "VTAVA" },
    { label: "Manutenção Preventiva", sigla: "MANUP" },
    { label: "Manutenção Corretiva", sigla: "CORRETIVA" },
  ],
  tecnicoNome: "",
  tecnicoEmpresa: "",
};

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".heic", ".webp", ".gif"];
const VIDEO_EXTENSIONS = [".mp4", ".mov", ".avi", ".mkv", ".webm"];
const MIDIA_DIR = "fotos-videos";

/** Gera uma sigla a partir de um nome livre, quando não há sigla configurada. */
function fallbackSigla(tipo: string): string {
  const normalized = tipo
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();
  return normalized.slice(0, 14) || "VISITA";
}

/** Aceita tanto o formato antigo (string[]) quanto o novo ({label, sigla}[]). */
function normalizeTiposDeVisita(value: unknown): TipoVisitaConfig[] {
  if (!Array.isArray(value) || value.length === 0) return DEFAULT_SETTINGS.tiposDeVisita;
  return value.map((item) => {
    if (typeof item === "string") {
      const known = DEFAULT_SETTINGS.tiposDeVisita.find((t) => t.label === item);
      return known ?? { label: item, sigla: fallbackSigla(item) };
    }
    const label = String((item as Partial<TipoVisitaConfig>)?.label ?? item);
    const sigla = String((item as Partial<TipoVisitaConfig>)?.sigla ?? fallbackSigla(label)).toUpperCase();
    return { label, sigla };
  });
}

function abbreviateTipo(tipo: string, tiposConfig: TipoVisitaConfig[]): string {
  const found = tiposConfig.find((t) => t.label === tipo);
  if (found?.sigla) return found.sigla.toUpperCase();
  return fallbackSigla(tipo);
}

/** Nome da pasta da visita: DD-MM-AAAA-SIGLA, ex: "13-08-2026-CORRETIVA". */
function visitaFolderName(ref: VisitaRef, tiposConfig: TipoVisitaConfig[]): string {
  const [ano, mesNum] = ref.mes.split("-");
  return `${ref.dia}-${mesNum}-${ano}-${abbreviateTipo(ref.tipoVisita, tiposConfig)}`;
}

/** Recupera dia + tipo de visita "amigável" a partir do nome de pasta gerado por visitaFolderName. */
function parseVisitaFolderName(folderName: string, tiposConfig: TipoVisitaConfig[]): { dia: string; tipoVisita: string } {
  const parts = folderName.split("-");
  if (parts.length >= 4) {
    const abrev = parts[3];
    const found = tiposConfig.find((t) => t.sigla.toUpperCase() === abrev);
    return { dia: parts[0], tipoVisita: found?.label ?? abrev };
  }
  return { dia: "", tipoVisita: folderName };
}

function settingsFilePath(): string {
  return path.join(app.getPath("userData"), "settings.json");
}

async function readSettings(): Promise<AppSettings> {
  try {
    const raw = await fs.readFile(settingsFilePath(), "utf-8");
    const merged = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    merged.tiposDeVisita = normalizeTiposDeVisita(merged.tiposDeVisita);
    return merged;
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

/** Como ensureRootFolder, mas também traz a config de tipos de visita (sigla das pastas). */
async function ensureContext(): Promise<{ root: string; tiposDeVisita: TipoVisitaConfig[] }> {
  const settings = await readSettings();
  if (!settings.rootFolder) {
    throw new Error("Nenhuma pasta raiz configurada. Configure em Ajustes primeiro.");
  }
  await fs.mkdir(settings.rootFolder, { recursive: true });
  return { root: settings.rootFolder, tiposDeVisita: settings.tiposDeVisita };
}

async function listSubdirectories(dirPath: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    return entries
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort((a, b) => a.localeCompare(b));
  } catch {
    return [];
  }
}

function visitaPath(root: string, ref: VisitaRef, tiposConfig: TipoVisitaConfig[]): string {
  return path.join(root, sanitizeName(ref.empresa), ref.mes, visitaFolderName(ref, tiposConfig));
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

  ipcMain.handle("empresas:delete", async (_event, nome: string) => {
    const root = await ensureRootFolder();
    const target = path.join(root, sanitizeName(nome));
    const { response } = await dialog.showMessageBox({
      type: "warning",
      buttons: ["Cancelar", "Excluir"],
      defaultId: 0,
      cancelId: 0,
      message: `Excluir a empresa "${nome}"?`,
      detail: "Isso apaga todas as visitas, fotos, vídeos e laudos dessa empresa. Não é possível desfazer.",
    });
    if (response !== 1) return false;
    await fs.rm(target, { recursive: true, force: true });
    return true;
  });

  ipcMain.handle("visitas:listMeses", async (_event, empresa: string) => {
    const root = await ensureRootFolder();
    return listSubdirectories(path.join(root, sanitizeName(empresa)));
  });

  ipcMain.handle("visitas:listVisitas", async (_event, empresa: string, mes: string) => {
    const { root, tiposDeVisita } = await ensureContext();
    const folders = await listSubdirectories(path.join(root, sanitizeName(empresa), mes));
    return folders.map((f) => parseVisitaFolderName(f, tiposDeVisita));
  });

  ipcMain.handle("visitas:create", async (_event, ref: VisitaRef) => {
    const { root, tiposDeVisita } = await ensureContext();
    const base = visitaPath(root, ref, tiposDeVisita);
    await fs.mkdir(path.join(base, MIDIA_DIR), { recursive: true });
    await fs.mkdir(path.join(base, "laudo"), { recursive: true });
  });

  ipcMain.handle("visitas:delete", async (_event, ref: VisitaRef) => {
    const { root, tiposDeVisita } = await ensureContext();
    const target = visitaPath(root, ref, tiposDeVisita);
    const { response } = await dialog.showMessageBox({
      type: "warning",
      buttons: ["Cancelar", "Excluir"],
      defaultId: 0,
      cancelId: 0,
      message: "Excluir esta visita?",
      detail: `Isso apaga as fotos, vídeos e o laudo de "${ref.tipoVisita}" (${ref.dia}/${ref.mes}). Não é possível desfazer.`,
    });
    if (response !== 1) return false;
    await fs.rm(target, { recursive: true, force: true });
    return true;
  });

  ipcMain.handle("arquivos:list", async (_event, ref: VisitaRef) => {
    const { root, tiposDeVisita } = await ensureContext();
    return listFilesIn(path.join(visitaPath(root, ref, tiposDeVisita), MIDIA_DIR));
  });

  ipcMain.handle("arquivos:pickFiles", async () => {
    const extensions = [...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS];
    const result = await dialog.showOpenDialog({
      properties: ["openFile", "multiSelections"],
      filters: [{ name: "Fotos e Vídeos", extensions: extensions.map((e) => e.slice(1)) }],
    });
    if (result.canceled) return [];
    return result.filePaths;
  });

  ipcMain.handle("arquivos:openFile", async (_event, filePath: string) => {
    await shell.openPath(filePath);
  });

  ipcMain.handle("arquivos:showInFolder", async (_event, filePath: string) => {
    shell.showItemInFolder(filePath);
  });

  ipcMain.handle("arquivos:add", async (_event, ref: VisitaRef, sourcePaths: string[]) => {
    const { root, tiposDeVisita } = await ensureContext();
    const targetDir = path.join(visitaPath(root, ref, tiposDeVisita), MIDIA_DIR);
    await fs.mkdir(targetDir, { recursive: true });
    for (const sourcePath of sourcePaths) {
      const destPath = path.join(targetDir, path.basename(sourcePath));
      await fs.copyFile(sourcePath, destPath);
    }
    return listFilesIn(targetDir);
  });

  ipcMain.handle("arquivos:remove", async (_event, ref: VisitaRef, fileName: string) => {
    const { root, tiposDeVisita } = await ensureContext();
    const filePath = path.join(visitaPath(root, ref, tiposDeVisita), MIDIA_DIR, fileName);
    await fs.unlink(filePath);
  });

  ipcMain.handle("arquivos:openInExplorer", async (_event, ref: VisitaRef) => {
    const { root, tiposDeVisita } = await ensureContext();
    const target = visitaPath(root, ref, tiposDeVisita);
    if (!fsSync.existsSync(target)) {
      await fs.mkdir(target, { recursive: true });
    }
    await shell.openPath(target);
  });

  ipcMain.handle("laudo:get", async (_event, ref: VisitaRef) => {
    const { root, tiposDeVisita } = await ensureContext();
    const jsonPath = path.join(visitaPath(root, ref, tiposDeVisita), "laudo", "laudo.json");
    try {
      const raw = await fs.readFile(jsonPath, "utf-8");
      return JSON.parse(raw);
    } catch {
      return null;
    }
  });

  ipcMain.handle("laudo:save", async (_event, ref: VisitaRef, data: unknown) => {
    const { root, tiposDeVisita } = await ensureContext();
    const laudoDir = path.join(visitaPath(root, ref, tiposDeVisita), "laudo");
    await fs.mkdir(laudoDir, { recursive: true });
    await fs.writeFile(path.join(laudoDir, "laudo.json"), JSON.stringify(data, null, 2), "utf-8");
  });
}

export { ensureContext, visitaPath, sanitizeName };
