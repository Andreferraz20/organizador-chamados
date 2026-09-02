import { useEffect, useState } from "react";
import { ClienteDadosForm } from "../components/ClienteDadosForm";
import { ClienteDetalhesForm } from "../components/ClienteDetalhesForm";
import { VisitasTecnicas } from "../components/VisitasTecnicas";
import { VisitasRecorrencia } from "../components/VisitasRecorrencia";
import type { VisitaRef } from "../types";

interface Props {
  empresa: string;
  tiposDeVisita: string[];
  onBack: () => void;
  onOpenVisita: (ref: VisitaRef) => void;
  onRenamed: (newEmpresa: string) => void;
}

type Tab = "dados" | "detalhes" | "visitas" | "recorrencia";

const TABS: [Tab, string][] = [
  ["dados", "Dados do Cliente"],
  ["detalhes", "Detalhes do Cliente"],
  ["visitas", "Visitas Técnicas"],
  ["recorrencia", "Recorrência de Visitas"],
];

export function Cliente({ empresa, tiposDeVisita, onBack, onOpenVisita, onRenamed }: Props) {
  const [tab, setTab] = useState<Tab>("dados");
  const [visitasInitialMes, setVisitasInitialMes] = useState<string | null>(null);

  useEffect(() => {
    if (tab === "visitas" && visitasInitialMes) {
      setVisitasInitialMes(null);
    }
  }, [tab, visitasInitialMes]);

  function handleOpenMes(mes: string) {
    setVisitasInitialMes(mes);
    setTab("visitas");
  }

  return (
    <div className="flex h-full flex-col p-8">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="mb-2 inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          ← Clientes
        </button>
        <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{empresa}</h1>
      </div>

      <div className="mb-6 flex gap-1 border-b border-slate-200 dark:border-slate-800">
        {TABS.map(([value, label]) => (
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
        {tab === "dados" && <ClienteDadosForm empresa={empresa} onRenamed={onRenamed} />}
        {tab === "detalhes" && <ClienteDetalhesForm empresa={empresa} onOpenVisita={onOpenVisita} />}
        {tab === "visitas" && (
          <VisitasTecnicas
            empresa={empresa}
            tiposDeVisita={tiposDeVisita}
            onOpenVisita={onOpenVisita}
            initialMes={visitasInitialMes}
          />
        )}
        {tab === "recorrencia" && (
          <VisitasRecorrencia empresa={empresa} tiposDeVisita={tiposDeVisita} onOpenMes={handleOpenMes} />
        )}
      </div>
    </div>
  );
}
