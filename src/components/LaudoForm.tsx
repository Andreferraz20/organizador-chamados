import { useEffect, useState } from "react";
import { api, partsToDate } from "../lib/api";
import type { LaudoData, VisitaRef } from "../types";

interface Props {
  visitaRef: VisitaRef;
  tecnicoPadrao: string;
}

const EMPTY: Omit<LaudoData, "empresa" | "data" | "tipoVisita" | "geradoEm"> = {
  equipamento: "",
  problemaRelatado: "",
  diagnostico: "",
  servicoExecutado: "",
  pecasTrocadas: "",
  observacoes: "",
  tecnicoResponsavel: "",
};

export function LaudoForm({ visitaRef, tecnicoPadrao }: Props) {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.laudo.get(visitaRef).then((existing) => {
      if (cancelled) return;
      if (existing) {
        setForm({
          equipamento: existing.equipamento,
          problemaRelatado: existing.problemaRelatado,
          diagnostico: existing.diagnostico,
          servicoExecutado: existing.servicoExecutado,
          pecasTrocadas: existing.pecasTrocadas,
          observacoes: existing.observacoes,
          tecnicoResponsavel: existing.tecnicoResponsavel,
        });
      } else {
        setForm({ ...EMPTY, tecnicoResponsavel: tecnicoPadrao });
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [visitaRef, tecnicoPadrao]);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSavedMessage(null);
  }

  async function handleGenerate() {
    setSaving(true);
    setSavedMessage(null);
    try {
      const data: LaudoData = {
        ...form,
        empresa: visitaRef.empresa,
        data: partsToDate(visitaRef.mes, visitaRef.dia),
        tipoVisita: visitaRef.tipoVisita,
        geradoEm: new Date().toLocaleString("pt-BR"),
      };
      await api.laudo.generate(visitaRef, data);
      setSavedMessage("Laudo gerado com sucesso.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-400">Carregando laudo…</p>;
  }

  const fields: { key: keyof typeof form; label: string; multiline?: boolean }[] = [
    { key: "equipamento", label: "Equipamento" },
    { key: "tecnicoResponsavel", label: "Técnico Responsável" },
    { key: "problemaRelatado", label: "Problema Relatado", multiline: true },
    { key: "diagnostico", label: "Diagnóstico", multiline: true },
    { key: "servicoExecutado", label: "Serviço Executado", multiline: true },
    { key: "pecasTrocadas", label: "Peças Trocadas" },
    { key: "observacoes", label: "Observações", multiline: true },
  ];

  return (
    <div className="space-y-4">
      {fields.map((f) => (
        <div key={f.key}>
          <label className="mb-1 block text-xs font-medium uppercase text-slate-500">{f.label}</label>
          {f.multiline ? (
            <textarea
              value={form[f.key]}
              onChange={(e) => update(f.key, e.target.value)}
              rows={3}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          ) : (
            <input
              value={form[f.key]}
              onChange={(e) => update(f.key, e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          )}
        </div>
      ))}

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleGenerate}
          disabled={saving}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Gerando…" : "Gerar PDF"}
        </button>
        {savedMessage && <span className="text-sm text-green-600">{savedMessage}</span>}
      </div>
    </div>
  );
}
