import { app, BrowserWindow, dialog, ipcMain, Menu, nativeImage, shell } from "electron";
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

interface Pessoa {
  nome: string;
  contato: string;
  cargo: string;
  email: string;
}

interface NumeroSerie {
  numero: string;
  tipoMaquina: string;
}

interface ClienteDados {
  nome: string;
  endereco: string;
  quantidadeBocas: string;
  numerosSerie: NumeroSerie[];
  pessoas: Pessoa[];
}

interface LaudoRef {
  mes: string;
  dia: string;
  tipoVisita: string;
}

interface ProblemaDetalhe {
  titulo: string;
  descricao: string;
  data: string;
  laudoRef?: LaudoRef | null;
}

interface ClienteDetalhes {
  problemas: ProblemaDetalhe[];
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

/** Pasta reservada na raiz pros dados do Estoque Técnico — não é um cliente, então fica de fora da listagem de empresas. */
export const ESTOQUE_TECNICO_DIR = "Estoque Técnico";

/** Pasta reservada na raiz pras Anotações Técnicas — mesma lógica do Estoque Técnico. */
export const ANOTACOES_TECNICAS_DIR = "Anotações Técnicas";

const RESERVED_ROOT_FOLDERS = [ESTOQUE_TECNICO_DIR, ANOTACOES_TECNICAS_DIR];

/** Ícone cinza sólido usado no arraste nativo quando o arquivo (ex: vídeo) não dá pra virar thumbnail. */
function createFallbackDragIcon() {
  const size = 32;
  const buffer = Buffer.alloc(size * size * 4);
  for (let i = 0; i < buffer.length; i += 4) {
    buffer[i] = 148; // B
    buffer[i + 1] = 148; // G
    buffer[i + 2] = 148; // R
    buffer[i + 3] = 255; // A
  }
  return nativeImage.createFromBuffer(buffer, { width: size, height: size });
}

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

function clienteDadosPath(root: string, empresa: string): string {
  return path.join(root, sanitizeName(empresa), "cliente-dados.json");
}

function clienteDetalhesPath(root: string, empresa: string): string {
  return path.join(root, sanitizeName(empresa), "cliente-detalhes.json");
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
    const dirs = await listSubdirectories(root);
    return dirs.filter((d) => !RESERVED_ROOT_FOLDERS.includes(d));
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
      message: `Excluir o cliente "${nome}"?`,
      detail: "Isso apaga todos os dados, visitas, fotos, vídeos e laudos desse cliente. Não é possível desfazer.",
    });
    if (response !== 1) return false;
    await fs.rm(target, { recursive: true, force: true });
    return true;
  });

  ipcMain.handle("empresas:rename", async (_event, oldNome: string, newNome: string) => {
    const root = await ensureRootFolder();
    const safeNewName = sanitizeName(newNome);
    if (!safeNewName) throw new Error("Nome inválido.");
    const oldPath = path.join(root, sanitizeName(oldNome));
    const newPath = path.join(root, safeNewName);
    if (oldPath === newPath) return safeNewName;

    // No Windows o sistema de arquivos não diferencia maiúsculas de minúsculas, então uma
    // mudança só de caixa (ex: "Vivaz" -> "VIVAZ") aponta pra essa mesma pasta — não é conflito.
    const isCaseOnlyChange = oldPath.toLowerCase() === newPath.toLowerCase();
    if (!isCaseOnlyChange && fsSync.existsSync(newPath)) {
      throw new Error(`Já existe um cliente chamado "${safeNewName}".`);
    }

    if (isCaseOnlyChange) {
      // Um rename direto só de caixa nem sempre "pega" no Windows — passa por um nome
      // temporário no meio do caminho pra garantir que a troca aconteça de verdade.
      const tempPath = `${oldPath}__rename_tmp_${Date.now()}`;
      await fs.rename(oldPath, tempPath);
      await fs.rename(tempPath, newPath);
    } else {
      await fs.rename(oldPath, newPath);
    }
    return safeNewName;
  });

  ipcMain.handle("clienteDados:get", async (_event, empresa: string) => {
    const root = await ensureRootFolder();
    try {
      const raw = await fs.readFile(clienteDadosPath(root, empresa), "utf-8");
      return JSON.parse(raw) as ClienteDados;
    } catch {
      return null;
    }
  });

  ipcMain.handle("clienteDados:save", async (_event, empresa: string, dados: ClienteDados) => {
    const root = await ensureRootFolder();
    const target = clienteDadosPath(root, empresa);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, JSON.stringify(dados, null, 2), "utf-8");
  });

  ipcMain.handle("clienteDetalhes:get", async (_event, empresa: string) => {
    const root = await ensureRootFolder();
    try {
      const raw = await fs.readFile(clienteDetalhesPath(root, empresa), "utf-8");
      return JSON.parse(raw) as ClienteDetalhes;
    } catch {
      return null;
    }
  });

  ipcMain.handle("clienteDetalhes:save", async (_event, empresa: string, detalhes: ClienteDetalhes) => {
    const root = await ensureRootFolder();
    const target = clienteDetalhesPath(root, empresa);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, JSON.stringify(detalhes, null, 2), "utf-8");
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

  ipcMain.handle("arquivos:rename", async (_event, ref: VisitaRef, oldName: string, newName: string) => {
    const { root, tiposDeVisita } = await ensureContext();
    const dir = path.join(visitaPath(root, ref, tiposDeVisita), MIDIA_DIR);
    await fs.rename(path.join(dir, oldName), path.join(dir, sanitizeName(newName)));
  });

  ipcMain.on("arquivos:startDrag", (event, filePaths: string[]) => {
    if (filePaths.length === 0) return;
    let icon = nativeImage.createFromPath(filePaths[0]).resize({ width: 64, height: 64 });
    if (icon.isEmpty()) {
      icon = createFallbackDragIcon();
    }
    event.sender.startDrag({ file: filePaths[0], files: filePaths, icon });
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

  // "Excluir laudo" apaga a visita inteira (fotos, vídeos e laudo) — pro técnico, uma
  // visita sem laudo não faz sentido existir como registro à parte. A confirmação já
  // acontece dentro do formulário do laudo, então aqui não há diálogo nativo.
  ipcMain.handle("laudo:delete", async (_event, ref: VisitaRef) => {
    const { root, tiposDeVisita } = await ensureContext();
    await fs.rm(visitaPath(root, ref, tiposDeVisita), { recursive: true, force: true });
  });
}

/**
 * Menu de contexto nativo do Electron pras miniaturas de foto/vídeo.
 *
 * Usa webContents "context-menu" (nível do processo principal) em vez do evento
 * "contextmenu" do DOM: em alguns setups o clique direito de verdade não estava
 * disparando o evento do DOM (só funcionava disparando via JS manualmente), então
 * um menu nativo — que não depende desse pipeline de eventos da página — é mais robusto.
 */
export function registerMediaContextMenu(win: BrowserWindow): void {
  win.webContents.on("context-menu", (_event, params) => {
    if (params.mediaType !== "image" && params.mediaType !== "video") return;

    let filePath: string;
    try {
      filePath = new URL(params.srcURL).searchParams.get("path") ?? "";
    } catch {
      return;
    }
    if (!filePath) return;

    const menu = Menu.buildFromTemplate([
      { label: "Abrir", click: () => shell.openPath(filePath) },
      { label: "Renomear", click: () => win.webContents.send("media:rename", filePath) },
      { label: "Abrir local do arquivo", click: () => shell.showItemInFolder(filePath) },
      { type: "separator" },
      {
        label: "Remover",
        click: async () => {
          await fs.unlink(filePath);
          win.webContents.send("media:refresh");
        },
      },
    ]);
    menu.popup({ window: win });
  });
}

export { ensureContext, visitaPath, sanitizeName };
