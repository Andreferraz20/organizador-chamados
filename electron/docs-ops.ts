import { app, dialog, ipcMain, shell } from "electron";
import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";

export type DocCategoria = "infraestrutura" | "tecnico" | "usuario";

interface DocumentoInfo {
  nome: string;
  arquivo: string;
}

const CATEGORIAS: DocCategoria[] = ["infraestrutura", "tecnico", "usuario"];

function sanitizeName(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, "-").trim();
}

function documentacaoRoot(): string {
  return path.join(app.getPath("userData"), "documentacao");
}

function categoriaDir(categoria: DocCategoria): string {
  return path.join(documentacaoRoot(), categoria);
}

/** Pasta com os PDFs padrão empacotados junto do instalador (ver electron-builder.yml extraResources). */
function bundledDocsRoot(): string {
  return app.isPackaged
    ? path.join(process.resourcesPath, "documentacao")
    : path.join(process.env.APP_ROOT ?? "", "resources", "documentacao");
}

/**
 * Na primeira execução, copia os PDFs padrão (empacotados com o instalador) pra dentro
 * da pasta de dados do usuário, que é onde de fato listamos/adicionamos/renomeamos depois.
 * Só roda uma vez (marcado por ".initialized"), pra não reimpor arquivos que o usuário
 * já tenha alterado ou removido.
 */
async function ensureDefaultsCopied(): Promise<void> {
  const root = documentacaoRoot();
  const marker = path.join(root, ".initialized");
  await fs.mkdir(root, { recursive: true });
  if (fsSync.existsSync(marker)) return;

  const bundledRoot = bundledDocsRoot();
  for (const categoria of CATEGORIAS) {
    const dest = categoriaDir(categoria);
    await fs.mkdir(dest, { recursive: true });
    try {
      const files = await fs.readdir(path.join(bundledRoot, categoria));
      for (const file of files) {
        const destPath = path.join(dest, file);
        if (!fsSync.existsSync(destPath)) {
          await fs.copyFile(path.join(bundledRoot, categoria, file), destPath);
        }
      }
    } catch {
      // Sem PDFs empacotados pra essa categoria (ex: rodando em dev sem a pasta resources) — segue sem defaults.
    }
  }
  await fs.writeFile(marker, new Date().toISOString(), "utf-8");
}

function displayName(fileName: string): string {
  return fileName.replace(/\.pdf$/i, "");
}

async function listDocs(categoria: DocCategoria): Promise<DocumentoInfo[]> {
  try {
    const entries = await fs.readdir(categoriaDir(categoria), { withFileTypes: true });
    return entries
      .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".pdf"))
      .map((e) => ({ nome: displayName(e.name), arquivo: e.name }))
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  } catch {
    return [];
  }
}

export function registerDocumentacaoHandlers(): void {
  ipcMain.handle("documentacao:list", async (_event, categoria: DocCategoria) => {
    await ensureDefaultsCopied();
    return listDocs(categoria);
  });

  ipcMain.handle("documentacao:open", async (_event, categoria: DocCategoria, arquivo: string) => {
    await shell.openPath(path.join(categoriaDir(categoria), arquivo));
  });

  ipcMain.handle("documentacao:add", async (_event, categoria: DocCategoria) => {
    const result = await dialog.showOpenDialog({
      properties: ["openFile", "multiSelections"],
      filters: [{ name: "PDF", extensions: ["pdf"] }],
    });
    if (result.canceled) return listDocs(categoria);

    const dest = categoriaDir(categoria);
    await fs.mkdir(dest, { recursive: true });
    for (const sourcePath of result.filePaths) {
      await fs.copyFile(sourcePath, path.join(dest, path.basename(sourcePath)));
    }
    return listDocs(categoria);
  });

  ipcMain.handle(
    "documentacao:rename",
    async (_event, categoria: DocCategoria, arquivo: string, novoNome: string) => {
      const dir = categoriaDir(categoria);
      const safeBase = sanitizeName(novoNome).replace(/\.pdf$/i, "");
      if (!safeBase) throw new Error("Nome inválido.");

      const oldPath = path.join(dir, arquivo);
      const newPath = path.join(dir, `${safeBase}.pdf`);
      if (oldPath === newPath) return listDocs(categoria);

      // Mesma lógica do rename de clientes: Windows não diferencia maiúsculas de
      // minúsculas, então uma troca só de caixa não é conflito de verdade.
      const isCaseOnlyChange = oldPath.toLowerCase() === newPath.toLowerCase();
      if (!isCaseOnlyChange && fsSync.existsSync(newPath)) {
        throw new Error(`Já existe um documento chamado "${safeBase}".`);
      }

      if (isCaseOnlyChange) {
        const tempPath = `${oldPath}__rename_tmp_${Date.now()}`;
        await fs.rename(oldPath, tempPath);
        await fs.rename(tempPath, newPath);
      } else {
        await fs.rename(oldPath, newPath);
      }
      return listDocs(categoria);
    },
  );
}
