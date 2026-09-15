import { useRef, useState } from "react";
import { api } from "../lib/api";
import { FileDropzone } from "../components/FileDropzone";
import { LaudoForm, type LaudoFormHandle } from "../components/LaudoForm";
import { guiaPara, LaudoGuiaModal } from "../components/LaudoGuia";
import type { VisitaRef } from "../types";

interface Props {
  visitaRef: VisitaRef;
  onBack: () => void;
  onGoToClientes: () => void;
  onGoHome: () => void;
}

type Tab = "laudo" | "midia";

const NOMES_MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

function formatDataLonga(ref: VisitaRef): string {
  const [ano, mesNum] = ref.mes.split("-");
  const nomeMes = NOMES_MESES[Number(mesNum) - 1] ?? mesNum;
  return `${ref.dia} de ${nomeMes} de ${ano}`;
}

export function Visita({ visitaRef, onBack, onGoToClientes, onGoHome }: Props) {
  const [tab, setTab] = useState<Tab>("laudo");
  const laudoRef = useRef<LaudoFormHandle>(null);
  const [savingLaudo, setSavingLaudo] = useState(false);
  const [laudoSalvo, setLaudoSalvo] = useState(false);
  const [showGuia, setShowGuia] = useState(false);

  const guia = guiaPara(visitaRef.tipoVisita);

  async function handleDelete() {
    const deleted = await api.visitas.delete(visitaRef);
    if (deleted) onBack();
  }

  async function handleSalvarLaudo() {
    setSavingLaudo(true);
    setLaudoSalvo(false);
    try {
      await laudoRef.current?.save();
      setLaudoSalvo(true);
      setTimeout(() => setLaudoSalvo(false), 1500);
    } finally {
      setSavingLaudo(false);
    }
  }

  return (
    <div className="flex h-full flex-col p-8">
      <div className="shrink-0 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="bg-slate-100 px-5 py-4 dark:bg-slate-800">
          <div className="mb-3 inline-flex overflow-hidden rounded-lg border border-slate-300 dark:border-slate-700">
            <button
              onClick={onGoToClientes}
              className="bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              ← Clientes
            </button>
            <button
              onClick={onBack}
              className="border-l border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-blue-400 dark:hover:bg-slate-800"
            >
              {visitaRef.empresa}
            </button>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">{visitaRef.tipoVisita}</h1>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{formatDataLonga(visitaRef)}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {laudoSalvo && <span className="text-xs font-medium text-green-600 dark:text-green-400">Laudo salvo.</span>}
              <button
                onClick={handleSalvarLaudo}
                disabled={savingLaudo}
                title="Salva o rascunho do laudo, mesmo com a aba de Fotos e Vídeos aberta"
                className="rounded-lg border border-slate-300 bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 dark:border-slate-700"
              >
                {savingLaudo ? "Salvando…" : "Salvar Laudo"}
              </button>
              <button
                onClick={handleDelete}
                className="rounded-lg border border-slate-300 bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 dark:border-slate-700"
              >
                Excluir Visita
              </button>
              {guia && (
                <button
                  onClick={() => setShowGuia(true)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Como preencher?
                </button>
              )}
              <button
                onClick={onGoHome}
                title="Voltar ao Menu Principal"
                className="rounded-lg border border-slate-300 bg-white p-2.5 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-[19px] w-[19px]">
                  <path d="M3 12 12 3l9 9" />
                  <path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex gap-1.5 pt-3">
            {(
              [
                ["laudo", "Laudo Técnico"],
                ["midia", "Fotos e Vídeos"],
              ] as [Tab, string][]
            ).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setTab(value)}
                className={`rounded-t-lg border px-4 py-2 text-sm font-semibold ${
                  tab === value
                    ? "border-slate-200 bg-white text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-blue-400"
                    : "border-transparent bg-slate-200/50 text-slate-500 hover:text-slate-700 dark:bg-slate-700/50 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/*
        As duas abas ficam sempre montadas (só escondidas via CSS) em vez de
        desmontadas na troca de aba. Antes, trocar pra "Fotos e Vídeos" sem
        salvar destruía o texto do laudo ainda não salvo, causando perda de
        dados ao voltar depois.
      */}
      <div className="flex-1 overflow-y-auto pt-6">
        <div className={tab === "laudo" ? "" : "hidden"}>
          <LaudoForm ref={laudoRef} visitaRef={visitaRef} onDeleted={onBack} />
        </div>
        <div className={tab === "midia" ? "" : "hidden"}>
          <FileDropzone visitaRef={visitaRef} />
        </div>
      </div>

      {showGuia && guia && <LaudoGuiaModal guia={guia} onClose={() => setShowGuia(false)} />}
    </div>
  );
}
