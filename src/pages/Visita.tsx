import { useState } from "react";
import { api } from "../lib/api";
import { FileDropzone } from "../components/FileDropzone";
import { LaudoForm } from "../components/LaudoForm";
import type { VisitaRef } from "../types";

interface Props {
  visitaRef: VisitaRef;
  onBack: () => void;
}

type Tab = "laudo" | "midia";

export function Visita({ visitaRef, onBack }: Props) {
  const [tab, setTab] = useState<Tab>("laudo");

  async function handleDelete() {
    const deleted = await api.visitas.delete(visitaRef);
    if (deleted) onBack();
  }

  return (
    <div className="flex h-full flex-col p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button
            onClick={onBack}
            className="mb-2 inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            ← {visitaRef.empresa}
          </button>
          <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
            {visitaRef.dia}/{visitaRef.mes} — {visitaRef.tipoVisita}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => api.arquivos.openInExplorer(visitaRef)}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Abrir pasta no Explorer
          </button>
          <button
            onClick={handleDelete}
            className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
          >
            Excluir visita
          </button>
        </div>
      </div>

      <div className="mb-6 flex gap-1 border-b border-slate-200 dark:border-slate-800">
        {(
          [
            ["laudo", "Laudo Técnico"],
            ["midia", "Fotos e Vídeos"],
          ] as [Tab, string][]
        ).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={`px-4 py-2 text-sm font-medium ${
              tab === value
                ? "border-b-2 border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === "laudo" && <LaudoForm visitaRef={visitaRef} onDeleted={onBack} />}
        {tab === "midia" && <FileDropzone visitaRef={visitaRef} />}
      </div>
    </div>
  );
}
