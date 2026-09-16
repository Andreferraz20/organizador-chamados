import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { ClienteDadosForm } from "../components/ClienteDadosForm";
import { ClienteDetalhesForm } from "../components/ClienteDetalhesForm";
import { VisitasTecnicas } from "../components/VisitasTecnicas";
import { VisitasRecorrencia } from "../components/VisitasRecorrencia";
import { ClienteEstoqueTecnico } from "../components/ClienteEstoqueTecnico";
import type { VisitaRef } from "../types";

interface Props {
  empresa: string;
  tiposDeVisita: string[];
  initialTab?: Tab;
  initialGatewayId?: string | null;
  onBack: () => void;
  /** voltarParaTab garante que o botão de voltar da visita retorne pra aba de onde a navegação partiu. */
  onOpenVisita: (ref: VisitaRef, voltarParaTab: Tab, gatewayId?: string) => void;
  onRenamed: (newEmpresa: string) => void;
  onGoHome: () => void;
}

export type Tab = "dados" | "detalhes" | "visitas" | "recorrencia" | "estoque";

const TABS: [Tab, string][] = [
  ["dados", "Dados do Cliente"],
  ["detalhes", "Detalhes do Cliente"],
  ["visitas", "Visitas Técnicas"],
  ["recorrencia", "Recorrência de Visitas"],
  ["estoque", "Estoque Técnico"],
];

export function Cliente({
  empresa,
  tiposDeVisita,
  initialTab,
  initialGatewayId,
  onBack,
  onOpenVisita,
  onRenamed,
  onGoHome,
}: Props) {
  const [tab, setTab] = useState<Tab>(initialTab ?? "dados");
  const [visitasInitialMes, setVisitasInitialMes] = useState<string | null>(null);
  const [endereco, setEndereco] = useState("");

  useEffect(() => {
    if (tab === "visitas" && visitasInitialMes) {
      setVisitasInitialMes(null);
    }
  }, [tab, visitasInitialMes]);

  useEffect(() => {
    let cancelled = false;
    api.clienteDados.get(empresa).then((dados) => {
      if (!cancelled) setEndereco(dados?.endereco ?? "");
    });
    return () => {
      cancelled = true;
    };
  }, [empresa]);

  function handleOpenMes(mes: string) {
    setVisitasInitialMes(mes);
    setTab("visitas");
  }

  return (
    <div className="flex h-full flex-col p-8">
      <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <div className="shrink-0 px-6 pt-5">
          <div className="flex items-start justify-between">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              ← Clientes
            </button>
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

          <h1 className="mt-3 text-xl font-bold text-slate-800 dark:text-slate-100">{empresa}</h1>
          {endereco && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{endereco}</p>}

          <div className="mt-4 flex gap-1.5">
            {TABS.map(([value, label]) => (
              <button
                key={value}
                onClick={() => setTab(value)}
                className={`relative top-px rounded-t-lg border px-4 py-2 text-sm font-semibold ${
                  tab === value
                    ? "border-slate-200 border-b-white bg-white text-blue-600 dark:border-slate-700 dark:border-b-slate-900 dark:bg-slate-900 dark:text-blue-400"
                    : "border-transparent bg-slate-200/50 text-slate-500 hover:text-slate-700 dark:bg-slate-700/50 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto border-t border-slate-200 p-6 dark:border-slate-700">
          {tab === "dados" && <ClienteDadosForm empresa={empresa} onRenamed={onRenamed} />}
          {tab === "detalhes" && (
            <ClienteDetalhesForm empresa={empresa} onOpenVisita={(ref) => onOpenVisita(ref, "detalhes")} />
          )}
          {tab === "visitas" && (
            <VisitasTecnicas
              empresa={empresa}
              tiposDeVisita={tiposDeVisita}
              onOpenVisita={(ref) => onOpenVisita(ref, "visitas")}
              initialMes={visitasInitialMes}
            />
          )}
          {tab === "recorrencia" && (
            <VisitasRecorrencia empresa={empresa} tiposDeVisita={tiposDeVisita} onOpenMes={handleOpenMes} />
          )}
          {tab === "estoque" && (
            <ClienteEstoqueTecnico
              empresa={empresa}
              initialGatewayId={initialGatewayId}
              onOpenVisita={(ref, gatewayId) => onOpenVisita(ref, "estoque", gatewayId)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
