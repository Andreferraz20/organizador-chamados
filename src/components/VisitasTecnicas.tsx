import { useEffect, useState } from "react";
import { api, dateToParts, formatMesLabel, todayParts } from "../lib/api";
import { EmptyHint } from "./EmptyHint";
import type { VisitaRef } from "../types";

interface Props {
  empresa: string;
  tiposDeVisita: string[];
  onOpenVisita: (ref: VisitaRef) => void;
  initialMes?: string | null;
}

interface VisitaResumo {
  dia: string;
  tipoVisita: string;
}

export function VisitasTecnicas({ empresa, tiposDeVisita, onOpenVisita, initialMes }: Props) {
  const [meses, setMeses] = useState<string[]>([]);
  const [selectedMes, setSelectedMes] = useState<string | null>(initialMes ?? null);
  const [visitas, setVisitas] = useState<VisitaResumo[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [novaData, setNovaData] = useState(() => {
    const { mes, dia } = todayParts();
    return `${mes}-${dia}`;
  });
  const [novoTipo, setNovoTipo] = useState(tiposDeVisita[0] ?? "");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    api.visitas.listMeses(empresa).then(setMeses);
  }, [empresa]);

  useEffect(() => {
    setVisitas([]);
    if (selectedMes) {
      api.visitas.listVisitas(empresa, selectedMes).then(setVisitas);
    }
  }, [empresa, selectedMes]);

  async function handleCreateVisita() {
    if (!novoTipo.trim()) return;
    setCreating(true);
    try {
      const { mes, dia } = dateToParts(novaData);
      const ref: VisitaRef = { empresa, mes, dia, tipoVisita: novoTipo.trim() };
      await api.visitas.create(ref);
      setShowForm(false);
      onOpenVisita(ref);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 flex items-center justify-end">
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Nova Visita
        </button>
      </div>

      {showForm && (
        <div className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Data</label>
            <input
              type="date"
              value={novaData}
              onChange={(e) => setNovaData(e.target.value)}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Tipo de Visita</label>
            <select
              value={novoTipo}
              onChange={(e) => setNovoTipo(e.target.value)}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              {tiposDeVisita.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleCreateVisita}
            disabled={creating}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {creating ? "Criando…" : "Criar visita"}
          </button>
        </div>
      )}

      <div className="grid flex-1 grid-cols-2 gap-4 overflow-hidden">
        <Column title="Mês">
          {meses.map((mes) => (
            <ColumnItem key={mes} active={mes === selectedMes} onClick={() => setSelectedMes(mes)}>
              {formatMesLabel(mes)}
            </ColumnItem>
          ))}
          {meses.length === 0 && <EmptyHint text="Nenhuma visita ainda" />}
        </Column>

        <Column title="Visitas">
          {selectedMes &&
            visitas.map((v) => (
              <ColumnItem
                key={`${v.dia}-${v.tipoVisita}`}
                active={false}
                onClick={() => onOpenVisita({ empresa, mes: selectedMes, dia: v.dia, tipoVisita: v.tipoVisita })}
              >
                Dia {v.dia} — {v.tipoVisita}
              </ColumnItem>
            ))}
          {selectedMes && visitas.length === 0 && <EmptyHint text="Nenhuma visita ainda" />}
          {!selectedMes && <EmptyHint text="Escolha um mês" />}
        </Column>
      </div>
    </div>
  );
}

function Column({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-400">
        {title}
      </div>
      <div className="flex-1 overflow-y-auto p-2">{children}</div>
    </div>
  );
}

function ColumnItem({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`mb-1 block w-full rounded-md px-3 py-2 text-left text-sm ${
        active
          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
          : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      }`}
    >
      {children}
    </button>
  );
}
