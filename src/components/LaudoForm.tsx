import { useEffect, useState } from "react";
import { api, partsToDate } from "../lib/api";
import { AutoGrowTextarea } from "./AutoGrowTextarea";
import type { LaudoData, VisitaRef } from "../types";

interface Props {
  visitaRef: VisitaRef;
  acompanhantePadrao: string;
}

const EMPTY: Omit<LaudoData, "empresa" | "data" | "tipoVisita" | "geradoEm"> = {
  numeroSerie: "",
  laudoTecnico: "",
  pecasSolicitadas: "",
  materialEstoque: "",
  acompanhante: "",
};

export function LaudoForm({ visitaRef, acompanhantePadrao }: Props) {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [savingAction, setSavingAction] = useState<"save" | "generate" | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.laudo.get(visitaRef).then((existing) => {
      if (cancelled) return;
      if (existing) {
        setForm({
          numeroSerie: existing.numeroSerie ?? "",
          laudoTecnico: existing.laudoTecnico ?? "",
          pecasSolicitadas: existing.pecasSolicitadas ?? "",
          materialEstoque: existing.materialEstoque ?? "",
          acompanhante: existing.acompanhante ?? "",
        });
      } else {
        setForm({ ...EMPTY, acompanhante: acompanhantePadrao });
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [visitaRef, acompanhantePadrao]);

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

  if (loading) {
    return <p className="text-sm text-slate-400 dark:text-slate-500">Carregando laudo…</p>;
  }

  const fields: { key: keyof typeof form; label: string; multiline?: boolean; rows?: number; placeholder?: string }[] = [
    { key: "numeroSerie", label: "Número de Série dos Equipamentos", multiline: true, rows: 6 },
    { key: "laudoTecnico", label: "Laudo Técnico", multiline: true, rows: 6 },
    { key: "pecasSolicitadas", label: "Peças Solicitadas", multiline: true, rows: 3 },
    { key: "materialEstoque", label: "Foi utilizado algum material do estoque técnico?", multiline: true, rows: 3 },
    { key: "acompanhante", label: "Dados de quem acompanhou a visita técnica", multiline: true, rows: 3 },
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
              rows={f.rows ?? 3}
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
        {savedMessage && <span className="text-sm text-green-600 dark:text-green-400">{savedMessage}</span>}
      </div>
    </div>
  );
}
