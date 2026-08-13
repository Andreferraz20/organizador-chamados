import { useState } from "react";
import { api } from "../lib/api";
import { FileDropzone } from "../components/FileDropzone";
import { LaudoForm } from "../components/LaudoForm";
import type { VisitaRef } from "../types";

interface Props {
  visitaRef: VisitaRef;
  tecnicoPadrao: string;
  onBack: () => void;
}

type Tab = "fotos" | "videos" | "laudo";

export function Visita({ visitaRef, tecnicoPadrao, onBack }: Props) {
  const [tab, setTab] = useState<Tab>("fotos");

  return (
    <div className="flex h-full flex-col p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button onClick={onBack} className="text-sm text-slate-400 hover:text-slate-600">
            ← {visitaRef.empresa}
          </button>
          <h1 className="text-xl font-semibold text-slate-800">
            {visitaRef.dia}/{visitaRef.mes} — {visitaRef.tipoVisita}
          </h1>
        </div>
        <button
          onClick={() => api.arquivos.openInExplorer(visitaRef)}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Abrir pasta no Explorer
        </button>
      </div>

      <div className="mb-6 flex gap-1 border-b border-slate-200">
        {(
          [
            ["fotos", "Fotos"],
            ["videos", "Vídeos"],
            ["laudo", "Laudo Técnico"],
          ] as [Tab, string][]
        ).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={`px-4 py-2 text-sm font-medium ${
              tab === value
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === "fotos" && <FileDropzone visitaRef={visitaRef} categoria="fotos" label="Fotos" />}
        {tab === "videos" && <FileDropzone visitaRef={visitaRef} categoria="videos" label="Vídeos" />}
        {tab === "laudo" && <LaudoForm visitaRef={visitaRef} tecnicoPadrao={tecnicoPadrao} />}
      </div>
    </div>
  );
}
