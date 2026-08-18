import { useEffect, useState } from "react";
import { api, formatMesLabel } from "../lib/api";
import { AutoGrowTextarea } from "./AutoGrowTextarea";
import { EmptyHint } from "./EmptyHint";
import type { ClienteDetalhes, LaudoRef, VisitaRef } from "../types";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

interface Props {
  empresa: string;
  onOpenVisita: (ref: VisitaRef) => void;
}

const EMPTY: ClienteDetalhes = { problemas: [] };

export function ClienteDetalhesForm({ empresa, onOpenVisita }: Props) {
  const [form, setForm] = useState<ClienteDetalhes>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [pickerIndex, setPickerIndex] = useState<number | null>(null);

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

  function updateProblema(index: number, field: "titulo" | "descricao" | "data", value: string) {
    setForm((prev) => ({
      problemas: prev.problemas.map((p, i) => (i === index ? { ...p, [field]: value } : p)),
    }));
    setSavedMessage(null);
  }

  function setLaudoRef(index: number, laudoRef: LaudoRef | null) {
    setForm((prev) => ({
      problemas: prev.problemas.map((p, i) => (i === index ? { ...p, laudoRef } : p)),
    }));
    setSavedMessage(null);
  }

  function addProblema() {
    setForm((prev) => ({
      problemas: [...prev.problemas, { titulo: "", descricao: "", data: todayIso(), laudoRef: null }],
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

              {problema.laudoRef ? (
                <div className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs dark:border-blue-900 dark:bg-blue-950/40">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-400">
                    <path d="M21.44 11.05l-9.19 9.19a5 5 0 01-7.07-7.07l9.19-9.19a3 3 0 014.24 4.24l-9.2 9.19a1 1 0 01-1.41-1.41l8.49-8.48" />
                  </svg>
                  <button
                    onClick={() =>
                      onOpenVisita({
                        empresa,
                        mes: problema.laudoRef!.mes,
                        dia: problema.laudoRef!.dia,
                        tipoVisita: problema.laudoRef!.tipoVisita,
                      })
                    }
                    className="flex-1 text-left text-blue-700 hover:underline dark:text-blue-300"
                  >
                    Anexado ao laudo de {problema.laudoRef.dia}/{problema.laudoRef.mes} — {problema.laudoRef.tipoVisita}
                  </button>
                  <button
                    onClick={() => setLaudoRef(index, null)}
                    title="Desanexar"
                    className="shrink-0 text-blue-400 hover:text-red-600 dark:text-blue-500 dark:hover:text-red-400"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setPickerIndex(index)}
                  className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                >
                  + Anexar laudo de uma visita
                </button>
              )}
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

      {pickerIndex !== null && (
        <LaudoPicker
          empresa={empresa}
          onSelect={(ref) => {
            setLaudoRef(pickerIndex, ref);
            setPickerIndex(null);
          }}
          onClose={() => setPickerIndex(null)}
        />
      )}
    </div>
  );
}

interface MesGroup {
  mes: string;
  visitas: { dia: string; tipoVisita: string }[];
}

function LaudoPicker({
  empresa,
  onSelect,
  onClose,
}: {
  empresa: string;
  onSelect: (ref: LaudoRef) => void;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [grupos, setGrupos] = useState<MesGroup[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const meses = await api.visitas.listMeses(empresa);
      const ordenados = [...meses].sort((a, b) => b.localeCompare(a));
      const result: MesGroup[] = [];
      for (const mes of ordenados) {
        const doMes = await api.visitas.listVisitas(empresa, mes);
        const visitas = [...doMes].sort((a, b) => b.dia.localeCompare(a.dia));
        if (visitas.length > 0) result.push({ mes, visitas });
      }
      if (cancelled) return;
      setGrupos(result);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [empresa]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-800">
        <h3 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">Anexar laudo de uma visita</h3>

        {loading ? (
          <p className="text-sm text-slate-400 dark:text-slate-500">Carregando…</p>
        ) : grupos.length === 0 ? (
          <EmptyHint text="Nenhuma visita técnica registrada ainda." />
        ) : (
          <div className="max-h-72 space-y-3 overflow-y-auto">
            {grupos.map((grupo) => (
              <div key={grupo.mes}>
                <p className="mb-1 px-1 text-xs font-semibold uppercase text-slate-400 dark:text-slate-500">
                  {formatMesLabel(grupo.mes)}
                </p>
                <div className="space-y-1">
                  {grupo.visitas.map((v) => (
                    <button
                      key={`${grupo.mes}-${v.dia}-${v.tipoVisita}`}
                      onClick={() => onSelect({ mes: grupo.mes, dia: v.dia, tipoVisita: v.tipoVisita })}
                      className="block w-full rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      Dia {v.dia} — {v.tipoVisita}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
