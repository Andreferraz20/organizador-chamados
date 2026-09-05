import { useEffect, useState } from "react";
import { api, partsToDate } from "../lib/api";
import { AutoGrowTextarea } from "./AutoGrowTextarea";
import type { LaudoData, VisitaRef } from "../types";

interface Props {
  visitaRef: VisitaRef;
  onDeleted: () => void;
}

const EMPTY: Omit<LaudoData, "empresa" | "data" | "tipoVisita" | "geradoEm"> = {
  numeroSerie: "",
  laudoTecnico: "",
  pecasSolicitadas: "",
  materialEstoque: "",
  acompanhante: "",
};

export function LaudoForm({ visitaRef, onDeleted }: Props) {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [savingAction, setSavingAction] = useState<"save" | "generate" | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.laudo.get(visitaRef).then((existing) => {
      if (cancelled) return;
      setForm(
        existing
          ? {
              numeroSerie: existing.numeroSerie ?? "",
              laudoTecnico: existing.laudoTecnico ?? "",
              pecasSolicitadas: existing.pecasSolicitadas ?? "",
              materialEstoque: existing.materialEstoque ?? "",
              acompanhante: existing.acompanhante ?? "",
            }
          : EMPTY,
      );
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [visitaRef]);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSavedMessage(null);
  }

  async function persist(generatePdf: boolean) {
    setSavingAction(generatePdf ? "generate" : "save");
    setSavedMessage(null);
    try {
      const data: LaudoData = {
        ...form,
        empresa: visitaRef.empresa,
        data: partsToDate(visitaRef.mes, visitaRef.dia),
        tipoVisita: visitaRef.tipoVisita,
        geradoEm: new Date().toLocaleString("pt-BR"),
      };
      if (generatePdf) {
        await api.laudo.generate(visitaRef, data);
        setSavedMessage("PDF gerado com sucesso.");
      } else {
        await api.laudo.save(visitaRef, data);
        setSavedMessage("Rascunho salvo.");
      }
    } finally {
      setSavingAction(null);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.laudo.delete(visitaRef);
      onDeleted();
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-400 dark:text-slate-500">Carregando laudo…</p>;
  }

  const fields: { key: keyof typeof form; label: string; multiline?: boolean; placeholder?: string }[] = [
    { key: "numeroSerie", label: "Número de Série dos Equipamentos", multiline: true },
    { key: "laudoTecnico", label: "Laudo Técnico", multiline: true },
    { key: "pecasSolicitadas", label: "Peças Solicitadas", multiline: true },
    { key: "materialEstoque", label: "Foi utilizado algum material do estoque técnico?", multiline: true },
    { key: "acompanhante", label: "Dados de quem acompanhou a visita técnica", multiline: true },
  ];

  return (
    <div className="space-y-4">
      {fields.map((f) => (
        <div key={f.key}>
          <label className="mb-1 block text-xs font-medium uppercase text-slate-500 dark:text-slate-400">{f.label}</label>
          {f.multiline ? (
            <AutoGrowTextarea
              value={form[f.key]}
              onChange={(e) => update(f.key, e.target.value)}
              rows={3}
              placeholder={f.placeholder}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-600"
            />
          ) : (
            <input
              value={form[f.key]}
              onChange={(e) => update(f.key, e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          )}
        </div>
      ))}

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={() => persist(false)}
          disabled={savingAction !== null}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          {savingAction === "save" ? "Salvando…" : "Salvar"}
        </button>
        <button
          onClick={() => persist(true)}
          disabled={savingAction !== null}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {savingAction === "generate" ? "Gerando…" : "Gerar PDF"}
        </button>
        <button
          onClick={() => setConfirmDelete(true)}
          className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
        >
          Excluir laudo
        </button>
        {savedMessage && <span className="text-sm text-green-600 dark:text-green-400">{savedMessage}</span>}
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-800">
            <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">Excluir este laudo?</h3>
            <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
              Isso apaga a visita inteira: fotos, vídeos e o laudo. Não é possível desfazer.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Excluindo…" : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
