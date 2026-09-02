import { dialog, ipcMain } from "electron";
import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import { ensureContext, sanitizeName, ANOTACOES_TECNICAS_DIR } from "./fs-ops";

interface AnotacaoDados {
  titulo: string;
  data: string;
  texto: string;
}

interface FileEntry {
  name: string;
  path: string;
  sizeBytes: number;
  mimeType: string;
}

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".heic", ".webp", ".gif"];
const VIDEO_EXTENSIONS = [".mp4", ".mov", ".avi", ".mkv", ".webm"];
const ANEXOS_DIR = "anexos";

function anotacoesRoot(root: string): string {
  return path.join(root, ANOTACOES_TECNICAS_DIR);
}

function anotacaoDir(root: string, id: string): string {
  return path.join(anotacoesRoot(root), id);
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
    return Promise.all(
      files.map(async (f) => {
        const fullPath = path.join(dirPath, f.name);
        const stat = await fs.stat(fullPath);
        return { name: f.name, path: fullPath, sizeBytes: stat.size, mimeType: mimeTypeFor(f.name) };
      }),
    );
  } catch {
    return [];
  }
}

async function uniqueFolderName(baseDir: string, label: string): Promise<string> {
  const safe = sanitizeName(label) || "Sem titulo";
  let candidate = safe;
  let i = 2;
  while (fsSync.existsSync(path.join(baseDir, candidate))) {
    candidate = `${safe} (${i})`;
    i++;
  }
  return candidate;
}

async function listAnotacoes(root: string): Promise<(AnotacaoDados & { id: string })[]> {
  const dir = anotacoesRoot(root);
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const folders = entries.filter((e) => e.isDirectory());
    const items: ((AnotacaoDados & { id: string }) | null)[] = await Promise.all(
      folders.map(async (f) => {
        try {
          const raw = await fs.readFile(path.join(dir, f.name, "dados.json"), "utf-8");
          return { ...(JSON.parse(raw) as AnotacaoDados), id: f.name };
        } catch {
          return null;
        }
      }),
    );
    const valid = items.filter((i) => i !== null) as (AnotacaoDados & { id: string })[];
    return valid.sort((a, b) => b.data.localeCompare(a.data));
  } catch {
    return [];
  }
}

export function registerAnotacoesHandlers(): void {
  ipcMain.handle("anotacoes:list", async () => {
    const { root } = await ensureContext();
    return listAnotacoes(root);
  });

  ipcMain.handle("anotacoes:create", async (_event, dados: AnotacaoDados) => {
    const { root } = await ensureContext();
    const dir = anotacoesRoot(root);
    await fs.mkdir(dir, { recursive: true });
    const id = await uniqueFolderName(dir, `${dados.titulo || "Nova anotacao"} ${dados.data}`);
    const folder = path.join(dir, id);
    await fs.mkdir(path.join(folder, ANEXOS_DIR), { recursive: true });
    await fs.writeFile(path.join(folder, "dados.json"), JSON.stringify(dados, null, 2), "utf-8");
    return { ...dados, id };
  });

  ipcMain.handle("anotacoes:save", async (_event, id: string, dados: AnotacaoDados) => {
    const { root } = await ensureContext();
    const folder = anotacaoDir(root, id);
    await fs.writeFile(path.join(folder, "dados.json"), JSON.stringify(dados, null, 2), "utf-8");
    return { ...dados, id };
  });

  ipcMain.handle("anotacoes:delete", async (_event, id: string) => {
    const { root } = await ensureContext();
    const { response } = await dialog.showMessageBox({
      type: "warning",
      buttons: ["Cancelar", "Excluir"],
      defaultId: 0,
      cancelId: 0,
      message: "Excluir esta anotação?",
      detail: "Isso apaga o texto e os anexos dessa anotação. Não é possível desfazer.",
    });
    if (response !== 1) return false;
    await fs.rm(anotacaoDir(root, id), { recursive: true, force: true });
    return true;
  });

  ipcMain.handle("anotacoes:listAnexos", async (_event, id: string) => {
    const { root } = await ensureContext();
    return listFilesIn(path.join(anotacaoDir(root, id), ANEXOS_DIR));
  });

  ipcMain.handle("anotacoes:addAnexos", async (_event, id: string, sourcePaths: string[]) => {
    const { root } = await ensureContext();
    const targetDir = path.join(anotacaoDir(root, id), ANEXOS_DIR);
    await fs.mkdir(targetDir, { recursive: true });
    for (const sourcePath of sourcePaths) {
      await fs.copyFile(sourcePath, path.join(targetDir, path.basename(sourcePath)));
    }
    return listFilesIn(targetDir);
  });

  ipcMain.handle("anotacoes:removeAnexo", async (_event, id: string, fileName: string) => {
    const { root } = await ensureContext();
    await fs.unlink(path.join(anotacaoDir(root, id), ANEXOS_DIR, fileName));
  });
}
