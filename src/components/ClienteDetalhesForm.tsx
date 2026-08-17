import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { AutoGrowTextarea } from "./AutoGrowTextarea";
import { EmptyHint } from "./EmptyHint";
import type { ClienteDetalhes, ProblemaDetalhe } from "../types";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

interface Props {
  empresa: string;
}

const EMPTY: ClienteDetalhes = { problemas: [] };

export function ClienteDetalhesForm({ empresa }: Props) {
  const [form, setForm] = useState<ClienteDetalhes>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.clienteDetalhes.get(empresa).then((existing) => {
      if (cancelled) return;
      setForm(existing ?? EMPTY);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [empresa]);

  function updateProblema(index: number, field: keyof ProblemaDetalhe, value: string) {
    setForm((prev) => ({
      problemas: prev.problemas.map((p, i) => (i === index ? { ...p, [field]: value } : p)),
    }));
    setSavedMessage(null);
  }

  function addProblema() {
    setForm((prev) => ({
      problemas: [...prev.problemas, { titulo: "", descricao: "", data: todayIso() }],
    }));
  }

  function removeProblema(index: number) {
    setForm((prev) => ({ problemas: prev.problemas.filter((_, i) => i !== index) }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.clienteDetalhes.save(empresa, form);
      setSavedMessage("Salvo.");
      setTimeout(() => setSavedMessage(null), 1500);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-400 dark:text-slate-500">Carregando…</p>;
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
          Detalhes e Problemas do Cliente
        </label>
        <button
          onClick={addProblema}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          + Adicionar detalhe
        </button>
      </div>

      {form.problemas.length === 0 ? (
        <EmptyHint text="Nenhum detalhe adicionado." />
      ) : (
        <div className="space-y-3">
          {form.problemas.map((problema, index) => (
            <div
              key={index}
              className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center gap-2">
                <input
                  value={problema.titulo}
                  onChange={(e) => updateProblema(index, "titulo", e.target.value)}
                  placeholder="Título do problema"
                  className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 placeholder:font-normal placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
                <input
                  type="date"
                  value={problema.data}
                  onChange={(e) => updateProblema(index, "data", e.target.value)}
                  className="w-40 shrink-0 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
                <button
                  onClick={() => removeProblema(index)}
                  title="Remover detalhe"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600 dark:text-slate-500 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <AutoGrowTextarea
                value={problema.descricao}
                onChange={(e) => updateProblema(index, "descricao", e.target.value)}
                rows={4}
                placeholder="Detalhes do problema"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Salvando…" : "Salvar"}
        </button>
        {savedMessage && <span className="text-sm text-green-600 dark:text-green-400">{savedMessage}</span>}
      </div>
    </div>
  );
}
