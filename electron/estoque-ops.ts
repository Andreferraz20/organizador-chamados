import { ipcMain } from "electron";
import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import { ensureContext, sanitizeName, ESTOQUE_TECNICO_DIR } from "./fs-ops";

interface VisitaRef {
  empresa: string;
  mes: string;
  dia: string;
  tipoVisita: string;
}

interface EstoqueVinculo {
  cliente: string;
  data: string | null;
  visitaRef: VisitaRef | null;
}

interface GatewayDados {
  idAnterior: string;
  idNovo: string;
}

const GATEWAYS_DIR = "Gateways";
const PLACAS_DIR = "Placas Wireless";

function gatewaysDir(root: string): string {
  return path.join(root, ESTOQUE_TECNICO_DIR, GATEWAYS_DIR);
}

function placasDir(root: string): string {
  return path.join(root, ESTOQUE_TECNICO_DIR, PLACAS_DIR);
}

/** Nome de exibição/pasta: "Cliente - DD-MM" quando há data, senão só "Cliente". */
function folderLabel(vinculo: EstoqueVinculo): string {
  if (vinculo.data) {
    const [, mes, dia] = vinculo.data.split("-");
    return `${vinculo.cliente} - ${dia}-${mes}`;
  }
  return vinculo.cliente;
}

async function uniqueFolderName(baseDir: string, label: string): Promise<string> {
  const safe = sanitizeName(label) || "Sem nome";
  let candidate = safe;
  let i = 2;
  while (fsSync.existsSync(path.join(baseDir, candidate))) {
    candidate = `${safe} (${i})`;
    i++;
  }
  return candidate;
}

async function listItems<T extends object>(dir: string): Promise<(T & { id: string })[]> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const folders = entries.filter((e) => e.isDirectory());
    const items: ((T & { id: string }) | null)[] = await Promise.all(
      folders.map(async (f) => {
        try {
          const raw = await fs.readFile(path.join(dir, f.name, "dados.json"), "utf-8");
          return { ...(JSON.parse(raw) as T), id: f.name };
        } catch {
          return null;
        }
      }),
    );
    return items.filter((i) => i !== null) as (T & { id: string })[];
  } catch {
    return [];
  }
}

async function createItem<T extends object>(
  dir: string,
  vinculo: EstoqueVinculo,
  extra: T,
): Promise<EstoqueVinculo & T & { id: string }> {
  await fs.mkdir(dir, { recursive: true });
  const id = await uniqueFolderName(dir, folderLabel(vinculo));
  const folder = path.join(dir, id);
  await fs.mkdir(folder, { recursive: true });
  const dados = { ...vinculo, ...extra };
  await fs.writeFile(path.join(folder, "dados.json"), JSON.stringify(dados, null, 2), "utf-8");
  return { ...dados, id };
}

async function updateItem<T extends object>(dir: string, id: string, patch: Partial<T>): Promise<unknown> {
  const folder = path.join(dir, id);
  const raw = await fs.readFile(path.join(folder, "dados.json"), "utf-8");
  const dados = { ...JSON.parse(raw), ...patch };
  await fs.writeFile(path.join(folder, "dados.json"), JSON.stringify(dados, null, 2), "utf-8");
  return { ...dados, id };
}

export function registerEstoqueHandlers(): void {
  ipcMain.handle("estoque:listGateways", async () => {
    const { root } = await ensureContext();
    return listItems<EstoqueVinculo & GatewayDados>(gatewaysDir(root));
  });

  ipcMain.handle("estoque:createGateway", async (_event, vinculo: EstoqueVinculo) => {
    const { root } = await ensureContext();
    return createItem<GatewayDados>(gatewaysDir(root), vinculo, { idAnterior: "", idNovo: "" });
  });

  ipcMain.handle("estoque:saveGateway", async (_event, id: string, dados: GatewayDados) => {
    const { root } = await ensureContext();
    return updateItem<GatewayDados>(gatewaysDir(root), id, dados);
  });

  ipcMain.handle("estoque:listPlacas", async () => {
    const { root } = await ensureContext();
    return listItems<EstoqueVinculo>(placasDir(root));
  });

  ipcMain.handle("estoque:createPlaca", async (_event, vinculo: EstoqueVinculo) => {
    const { root } = await ensureContext();
    return createItem<Record<string, never>>(placasDir(root), vinculo, {});
  });
}
