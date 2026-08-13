import { useEffect, useState } from "react";
import { api, dateToParts, formatMesLabel, todayParts } from "../lib/api";
import type { VisitaRef } from "../types";

interface Props {
  empresa: string;
  tiposDeVisita: string[];
  onBack: () => void;
  onOpenVisita: (ref: VisitaRef) => void;
}

export function Empresa({ empresa, tiposDeVisita, onBack, onOpenVisita }: Props) {
  const [meses, setMeses] = useState<string[]>([]);
  const [selectedMes, setSelectedMes] = useState<string | null>(null);
  const [dias, setDias] = useState<string[]>([]);
  const [selectedDia, setSelectedDia] = useState<string | null>(null);
  const [tipos, setTipos] = useState<string[]>([]);

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
    setSelectedDia(null);
    setDias([]);
    setTipos([]);
    if (selectedMes) {
      api.visitas.listDias(empresa, selectedMes).then(setDias);
    }
  }, [empresa, selectedMes]);

  useEffect(() => {
    setTipos([]);
    if (selectedMes && selectedDia) {
      api.visitas.listTipos(empresa, selectedMes, selectedDia).then(setTipos);
    }
  }, [empresa, selectedMes, selectedDia]);

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
    <div className="flex h-full flex-col p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button onClick={onBack} className="text-sm text-slate-400 hover:text-slate-600">
            ← Empresas
          </button>
          <h1 className="text-xl font-semibold text-slate-800">{empresa}</h1>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Nova Visita
        </button>
      </div>

      {showForm && (
        <div className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase text-slate-500">Data</label>
            <input
              type="date"
              value={novaData}
              onChange={(e) => setNovaData(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase text-slate-500">Tipo de Visita</label>
            <select
              value={novoTipo}
              onChange={(e) => setNovoTipo(e.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
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

      <div className="grid flex-1 grid-cols-3 gap-4 overflow-hidden">
        <Column title="Mês">
          {meses.map((mes) => (
            <ColumnItem key={mes} active={mes === selectedMes} onClick={() => setSelectedMes(mes)}>
              {formatMesLabel(mes)}
            </ColumnItem>
          ))}
          {meses.length === 0 && <EmptyHint text="Nenhuma visita ainda" />}
        </Column>

        <Column title="Dia">
          {selectedMes &&
            dias.map((dia) => (
              <ColumnItem key={dia} active={dia === selectedDia} onClick={() => setSelectedDia(dia)}>
                Dia {dia}
              </ColumnItem>
            ))}
          {selectedMes && dias.length === 0 && <EmptyHint text="Nenhum dia ainda" />}
        </Column>

        <Column title="Tipo de Visita">
          {selectedMes &&
            selectedDia &&
            tipos.map((tipo) => (
              <ColumnItem
                key={tipo}
                active={false}
                onClick={() => onOpenVisita({ empresa, mes: selectedMes, dia: selectedDia, tipoVisita: tipo })}
              >
                {tipo}
              </ColumnItem>
            ))}
          {selectedMes && selectedDia && tipos.length === 0 && <EmptyHint text="Nenhum tipo ainda" />}
        </Column>
      </div>
    </div>
  );
}

function Column({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-slate-200">
      <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase text-slate-500">
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
        active ? "bg-blue-100 text-blue-700" : "text-slate-700 hover:bg-slate-100"
      }`}
    >
      {children}
    </button>
  );
}

function EmptyHint({ text }: { text: string }) {
  return <p className="px-3 py-2 text-xs text-slate-400">{text}</p>;
}
