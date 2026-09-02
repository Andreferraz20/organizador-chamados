import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { EmptyHint } from "../components/EmptyHint";
import type { DocCategoria, DocumentoInfo } from "../types";

const CATEGORIAS: { value: DocCategoria; label: string }[] = [
  { value: "infraestrutura", label: "Infraestrutura" },
  { value: "tecnico", label: "Técnico" },
  { value: "usuario", label: "Usuário" },
];

interface Props {
  onBack: () => void;
}

export function Documentacao({ onBack }: Props) {
  const [categoria, setCategoria] = useState<DocCategoria | null>(null);

  if (!categoria) {
    return (
      <div className="relative flex h-full flex-col items-center justify-center gap-10 p-8">
        <button
          onClick={onBack}
          className="absolute left-6 top-6 inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          ← Menu
        </button>
        <h1 className="text-3xl font-bold uppercase tracking-wide text-slate-800 dark:text-slate-100">
          Documentação
        </h1>
        <div className="flex items-stretch justify-center gap-4">
          {CATEGORIAS.map((c) => (
            <button
              key={c.value}
              onClick={() => setCategoria(c.value)}
              className="flex w-56 flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-10 text-center text-base font-semibold text-slate-700 shadow-sm transition hover:border-blue-400 hover:bg-blue-50 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-500 dark:hover:bg-slate-800"
            >
              <span className="uppercase tracking-wide">{c.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <DocumentosLista
      categoria={categoria}
      label={CATEGORIAS.find((c) => c.value === categoria)!.label}
      onBack={() => setCategoria(null)}
    />
  );
}

function DocumentosLista({
  categoria,
  label,
  onBack,
}: {
  categoria: DocCategoria;
  label: string;
  onBack: () => void;
}) {
  const [docs, setDocs] = useState<DocumentoInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [renameTarget, setRenameTarget] = useState<DocumentoInfo | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameError, setRenameError] = useState<string | null>(null);
  const [renaming, setRenaming] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.documentacao.list(categoria).then((list) => {
      if (cancelled) return;
      setDocs(list);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [categoria]);

  async function handleAdd() {
    setAdding(true);
    try {
      setDocs(await api.documentacao.add(categoria));
    } finally {
      setAdding(false);
    }
  }

  function openRename(doc: DocumentoInfo) {
    setRenameTarget(doc);
    setRenameValue(doc.nome);
    setRenameError(null);
  }

  async function confirmRename() {
    if (!renameTarget) return;
    const novoNome = renameValue.trim();
    if (!novoNome) return;
    setRenaming(true);
    setRenameError(null);
    try {
      setDocs(await api.documentacao.rename(categoria, renameTarget.arquivo, novoNome));
      setRenameTarget(null);
    } catch (error) {
      setRenameError(error instanceof Error ? error.message : "Não foi possível renomear.");
    } finally {
      setRenaming(false);
    }
  }

  return (
    <div className="mx-auto flex h-full max-w-2xl flex-col p-8">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="mb-2 inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          ← Documentação
        </button>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{label}</h1>
          <button
            onClick={handleAdd}
            disabled={adding}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {adding ? "Adicionando…" : "+ Adicionar documento"}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400 dark:text-slate-500">Carregando…</p>
      ) : docs.length === 0 ? (
        <EmptyHint text="Nenhum documento nessa categoria ainda." />
      ) : (
        <div className="flex-1 space-y-2 overflow-y-auto">
          {docs.map((doc) => (
            <div
              key={doc.arquivo}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900"
            >
              <button
                onClick={() => api.documentacao.open(categoria, doc.arquivo)}
                className="flex flex-1 items-center gap-3 text-left text-sm font-medium text-slate-700 hover:text-blue-600 dark:text-slate-200 dark:hover:text-blue-400"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-5 w-5 shrink-0 text-red-500"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6" />
                </svg>
                <span>{doc.nome}</span>
              </button>
              <button
                onClick={() => openRename(doc)}
                title="Renomear"
                className="ml-3 shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {renameTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-800">
            <h3 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">Renomear documento</h3>
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && confirmRename()}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            {renameError && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{renameError}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setRenameTarget(null)}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                onClick={confirmRename}
                disabled={renaming || !renameValue.trim()}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {renaming ? "Renomeando…" : "Renomear"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
