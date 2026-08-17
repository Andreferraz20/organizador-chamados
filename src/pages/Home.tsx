import { useEffect, useState } from "react";
import { api } from "../lib/api";

interface Props {
  onBack: () => void;
  onOpenCliente: (empresa: string) => void;
  onOpenSettings: () => void;
}

export function Home({ onBack, onOpenCliente, onOpenSettings }: Props) {
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
    const nome = novoNome.trim();
    setCreating(true);
    try {
      await api.empresas.create(nome);
      setNovoNome("");
      onOpenCliente(nome);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(empresa: string) {
    const deleted = await api.empresas.delete(empresa);
    if (deleted) {
      setEmpresas(await api.empresas.list());
    }
  }

  if (rootFolder === undefined) {
    return <p className="p-8 text-sm text-slate-400 dark:text-slate-500">Carregando…</p>;
  }

  if (!rootFolder) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Configure a pasta raiz</h2>
        <p className="max-w-md text-sm text-slate-500 dark:text-slate-400">
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
      <div className="mb-6">
        <button
          onClick={onBack}
          className="mb-2 inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          ← Menu
        </button>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">Clientes</h1>
          <button onClick={onOpenSettings} className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
            Ajustes
          </button>
        </div>
      </div>

      <div className="mb-6 flex gap-2">
        <input
          value={novoNome}
          onChange={(e) => setNovoNome(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          placeholder="Nome do cliente"
          className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
        <button
          onClick={handleCreate}
          disabled={creating || !novoNome.trim()}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          + Novo Cliente
        </button>
      </div>

      {empresas.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-slate-500">Nenhum cliente cadastrado ainda.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {empresas.map((empresa) => (
            <li key={empresa} className="group relative">
              <button
                onClick={() => onOpenCliente(empresa)}
                className="flex w-full min-h-24 items-center rounded-xl border border-slate-200 bg-white px-4 py-6 text-left text-sm font-medium text-slate-700 shadow-sm transition hover:border-blue-400 hover:bg-blue-50 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-500 dark:hover:bg-slate-800"
              >
                {empresa}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(empresa);
                }}
                title="Excluir cliente"
                className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-slate-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 dark:text-slate-500 dark:hover:bg-red-950/40 dark:hover:text-red-400"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                  <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16Z" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
