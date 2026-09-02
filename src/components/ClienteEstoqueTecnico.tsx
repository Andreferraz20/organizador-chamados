import { useEffect, useState } from "react";
import { api, formatDataCurta } from "../lib/api";
import { EmptyHint } from "./EmptyHint";
import { GatewayDetalhe } from "../pages/EstoqueTecnico";
import type { EstoqueVinculo, GatewayItem, PlacaWirelessItem, VisitaRef } from "../types";

interface Props {
  empresa: string;
  initialGatewayId?: string | null;
  onOpenVisita: (ref: VisitaRef, gatewayId?: string) => void;
}

/** Um registro pertence a esse cliente se veio de uma visita dele, ou (registro manual) o nome bate. */
function pertenceAoCliente(item: EstoqueVinculo, empresa: string): boolean {
  if (item.visitaRef) return item.visitaRef.empresa === empresa;
  return item.cliente.trim().toLowerCase() === empresa.trim().toLowerCase();
}

export function ClienteEstoqueTecnico({ empresa, initialGatewayId, onOpenVisita }: Props) {
  const [gateways, setGateways] = useState<GatewayItem[]>([]);
  const [placas, setPlacas] = useState<PlacaWirelessItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGatewayId, setSelectedGatewayId] = useState<string | null>(initialGatewayId ?? null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([api.estoque.listGateways(), api.estoque.listPlacas()]).then(([g, p]) => {
      if (cancelled) return;
      setGateways(g.filter((item) => pertenceAoCliente(item, empresa)));
      setPlacas(p.filter((item) => pertenceAoCliente(item, empresa)));
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [empresa]);

  if (selectedGatewayId) {
    return (
      <GatewayDetalhe
        id={selectedGatewayId}
        onBack={() => setSelectedGatewayId(null)}
        onOpenVisita={(ref) => onOpenVisita(ref, selectedGatewayId)}
      />
    );
  }

  if (loading) {
    return <p className="text-sm text-slate-400 dark:text-slate-500">Carregando…</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-6">
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Gateways
        </h2>
        <div className="space-y-2">
          {gateways.length === 0 ? (
            <EmptyHint text="Nenhuma troca de gateway registrada pra esse cliente." />
          ) : (
            gateways.map((g) => (
              <button
                key={g.id}
                onClick={() => setSelectedGatewayId(g.id)}
                className="block w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-left hover:border-blue-400 hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500 dark:hover:bg-slate-800"
              >
                <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {g.data ? formatDataCurta(g.data) : "Sem data"}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Placas Wireless
        </h2>
        <div className="space-y-2">
          {placas.length === 0 ? (
            <EmptyHint text="Nenhuma troca de placa wireless registrada pra esse cliente." />
          ) : (
            placas.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {p.data ? formatDataCurta(p.data) : "Sem data"}
                </div>
                {p.visitaRef && (
                  <button
                    onClick={() => onOpenVisita(p.visitaRef!)}
                    title="Acessar Laudo Técnico"
                    className="flex shrink-0 items-center gap-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-blue-500 dark:hover:bg-slate-800 dark:hover:text-blue-400"
                  >
                    Laudo Técnico
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                      <path d="M9 6l6 6-6 6" />
                    </svg>
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
