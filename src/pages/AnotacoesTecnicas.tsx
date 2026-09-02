import { useEffect, useState } from "react";
import { api, toMediaUrl } from "../lib/api";
import { AutoGrowTextarea } from "../components/AutoGrowTextarea";
import { EmptyHint } from "../components/EmptyHint";
import type { AnotacaoTecnica, FileEntry } from "../types";

interface Props {
  onBack: () => void;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function AnotacoesTecnicas({ onBack }: Props) {
  const [anotacoes, setAnotacoes] = useState<AnotacaoTecnica[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  async function refresh() {
    setLoading(true);
    setAnotacoes(await api.anotacoes.list());
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleCreate() {
    setCreating(true);
    try {
      const nova = await api.anotacoes.create({ titulo: "", data: todayIso(), texto: "" });
      setAnotacoes((prev) => [nova, ...prev]);
      setExpandedId(nova.id);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    const deleted = await api.anotacoes.delete(id);
    if (deleted) {
      setAnotacoes((prev) => prev.filter((a) => a.id !== id));
      if (expandedId === id) setExpandedId(null);
    }
  }

  return (
    <div className="flex h-full flex-col p-8">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="mb-2 inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          ← Menu
        </button>
        <h1 className="text-xl font-semibold uppercase tracking-wide text-slate-800 dark:text-slate-100">
          Anotações Técnicas
        </h1>
      </div>

      <div className="mb-6">
        <button
          onClick={handleCreate}
          disabled={creating}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {creating ? "Criando…" : "+ Nova Anotação"}
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400 dark:text-slate-500">Carregando…</p>
      ) : anotacoes.length === 0 ? (
        <EmptyHint text="Nenhuma anotação ainda." />
      ) : (
        <div className="max-w-3xl flex-1 space-y-2 overflow-y-auto">
          {anotacoes.map((a) => (
            <AnotacaoCard
              key={a.id}
              anotacao={a}
              expanded={expandedId === a.id}
              onToggle={() => setExpandedId(expandedId === a.id ? null : a.id)}
              onDelete={() => handleDelete(a.id)}
              onSaved={(updated) =>
                setAnotacoes((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AnotacaoCard({
  anotacao,
  expanded,
  onToggle,
  onDelete,
  onSaved,
}: {
  anotacao: AnotacaoTecnica;
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onSaved: (updated: AnotacaoTecnica) => void;
}) {
  const [titulo, setTitulo] = useState(anotacao.titulo);
  const [data, setData] = useState(anotacao.data);
  const [texto, setTexto] = useState(anotacao.texto);
  const [tab, setTab] = useState<"anotacao" | "anexos">("anotacao");
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await api.anotacoes.save(anotacao.id, { titulo, data, texto });
      onSaved(updated);
      setDirty(false);
      setSavedMessage("Salvo.");
      setTimeout(() => setSavedMessage(null), 1500);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2 px-4 py-3">
        <button
          onClick={onToggle}
          className="shrink-0 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`h-4 w-4 transition-transform ${expanded ? "rotate-90" : ""}`}
          >
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
        <input
          value={titulo}
          onChange={(e) => {
            setTitulo(e.target.value);
            setDirty(true);
          }}
          placeholder="Título da anotação"
          className="min-w-0 flex-1 bg-transparent text-sm font-medium text-slate-800 placeholder:font-normal placeholder:text-slate-400 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500"
        />
        <input
          type="date"
          value={data}
          onChange={(e) => {
            setData(e.target.value);
            setDirty(true);
          }}
          className="shrink-0 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-600 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
        />
        <button
          onClick={onDelete}
          title="Excluir anotação"
          className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:text-slate-500 dark:hover:bg-red-950/40 dark:hover:text-red-400"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16Z" />
          </svg>
        </button>
      </div>

      {expanded && (
        <div className="border-t border-slate-200 px-4 py-3 dark:border-slate-800">
          <div className="mb-3 flex gap-1 border-b border-slate-200 dark:border-slate-800">
            {(["anotacao", "anexos"] as const).map((value) => (
              <button
                key={value}
                onClick={() => setTab(value)}
                className={`px-3 py-1.5 text-xs font-medium ${
                  tab === value
                    ? "border-b-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                {value === "anotacao" ? "Anotação" : "Anexos"}
              </button>
            ))}
          </div>

          {tab === "anotacao" ? (
            <div className="space-y-3">
              <AutoGrowTextarea
                value={texto}
                onChange={(e) => {
                  setTexto(e.target.value);
                  setDirty(true);
                }}
                rows={5}
                placeholder="Escreva a anotação…"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving || !dirty}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Salvando…" : "Salvar"}
                </button>
                {savedMessage && <span className="text-sm text-green-600 dark:text-green-400">{savedMessage}</span>}
              </div>
            </div>
          ) : (
            <AnexosPanel anotacaoId={anotacao.id} />
          )}
        </div>
      )}
    </div>
  );
}

function AnexosPanel({ anotacaoId }: { anotacaoId: string }) {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    setLoading(true);
    setFiles(await api.anotacoes.listAnexos(anotacaoId));
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, [anotacaoId]);

  async function handleAdd() {
    const paths = await api.arquivos.pickFiles();
    if (paths.length === 0) return;
    setBusy(true);
    try {
      setFiles(await api.anotacoes.addAnexos(anotacaoId, paths));
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(fileName: string) {
    await api.anotacoes.removeAnexo(anotacaoId, fileName);
    refresh();
  }

  return (
    <div>
      <button
        onClick={handleAdd}
        disabled={busy}
        className="mb-3 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        {busy ? "Adicionando…" : "+ Adicionar imagem"}
      </button>

      {loading ? (
        <p className="text-sm text-slate-400 dark:text-slate-500">Carregando…</p>
      ) : files.length === 0 ? (
        <EmptyHint text="Nenhum anexo ainda." />
      ) : (
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
          {files.map((f) => (
            <div
              key={f.name}
              className="group relative cursor-pointer overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900"
              style={{ aspectRatio: "1 / 1" }}
              onDoubleClick={() => api.arquivos.openFile(f.path)}
              title={f.name}
            >
              {f.mimeType.startsWith("video/") ? (
                <video src={toMediaUrl(f.path)} muted preload="metadata" className="h-full w-full object-cover" />
              ) : (
                <img src={toMediaUrl(f.path)} loading="lazy" className="h-full w-full object-cover" />
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(f.name);
                }}
                title="Remover"
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition hover:bg-red-600 group-hover:opacity-100"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
