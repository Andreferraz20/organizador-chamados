import { useEffect, useState } from "react";
import { api } from "../lib/api";

interface Props {
  onOpenEmpresa: (empresa: string) => void;
  onOpenSettings: () => void;
}

export function Home({ onOpenEmpresa, onOpenSettings }: Props) {
  const [rootFolder, setRootFolder] = useState<string | null | undefined>(undefined);
  const [empresas, setEmpresas] = useState<string[]>([]);
  const [novoNome, setNovoNome] = useState("");
  const [creating, setCreating] = useState(false);

  async function refresh() {
    const settings = await api.settings.get();
    setRootFolder(settings.rootFolder);
    if (settings.rootFolder) {
      setEmpresas(await api.empresas.list());
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleCreate() {
    if (!novoNome.trim()) return;
    setCreating(true);
    try {
      await api.empresas.create(novoNome.trim());
      setNovoNome("");
      setEmpresas(await api.empresas.list());
    } finally {
      setCreating(false);
    }
  }

  if (rootFolder === undefined) {
    return <p className="p-8 text-sm text-slate-400">Carregando…</p>;
  }

  if (!rootFolder) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
        <h2 className="text-lg font-semibold text-slate-800">Configure a pasta raiz</h2>
        <p className="max-w-md text-sm text-slate-500">
          Antes de começar, escolha em Ajustes a pasta no seu PC onde os chamados (empresas, fotos,
          vídeos e laudos) serão guardados.
        </p>
        <button
          onClick={onOpenSettings}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Ir para Ajustes
        </button>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-800">Empresas / Locais</h1>
        <button onClick={onOpenSettings} className="text-sm text-slate-500 hover:text-slate-700">
          Ajustes
        </button>
      </div>

      <div className="mb-6 flex gap-2">
        <input
          value={novoNome}
          onChange={(e) => setNovoNome(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          placeholder="Nome da empresa ou local"
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        <button
          onClick={handleCreate}
          disabled={creating || !novoNome.trim()}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          + Nova Empresa/Local
        </button>
      </div>

      {empresas.length === 0 ? (
        <p className="text-sm text-slate-400">Nenhuma empresa cadastrada ainda.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {empresas.map((empresa) => (
            <li key={empresa}>
              <button
                onClick={() => onOpenEmpresa(empresa)}
                className="w-full rounded-lg border border-slate-200 px-4 py-6 text-left text-sm font-medium text-slate-700 hover:border-blue-400 hover:bg-blue-50"
              >
                {empresa}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
