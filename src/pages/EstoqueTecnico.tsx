import { useEffect, useState } from "react";
import { api, formatDataCurta } from "../lib/api";
import { EmptyHint } from "../components/EmptyHint";
import type { GatewayItem, PlacaWirelessItem, VisitaRef } from "../types";

interface Props {
  onBack: () => void;
  onOpenVisita: (ref: VisitaRef, gatewayId?: string) => void;
  initialGatewayId?: string | null;
}

/** Tela de consulta geral (Menu Principal) — somente leitura. Adicionar/remover é feito na aba do cliente. */
export function EstoqueTecnico({ onBack, onOpenVisita, initialGatewayId }: Props) {
  const [gateways, setGateways] = useState<GatewayItem[]>([]);
  const [placas, setPlacas] = useState<PlacaWirelessItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGatewayId, setSelectedGatewayId] = useState<string | null>(initialGatewayId ?? null);

  async function refresh() {
    setLoading(true);
    const [g, p] = await Promise.all([api.estoque.listGateways(), api.estoque.listPlacas()]);
    setGateways(g);
    setPlacas(p);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  if (selectedGatewayId) {
    return (
      <GatewayDetalhe
        id={selectedGatewayId}
        readOnly
        onBack={() => setSelectedGatewayId(null)}
        onOpenVisita={(ref) => onOpenVisita(ref, selectedGatewayId)}
      />
    );
  }

  return (
    <div className="flex h-full flex-col p-8">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="mb-2 inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          ← Menu
        </button>
        <h1 className="text-xl font-semibold uppercase tracking-wide text-slate-800 dark:text-slate-100">
          Estoque Técnico
        </h1>
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
          Consulta geral. Para adicionar ou remover um uso de estoque, acesse a aba "Estoque Técnico" dentro do
          cliente.
        </p>
      </div>

      <div className="grid flex-1 grid-cols-2 gap-6 overflow-hidden">
        <div className="flex flex-col overflow-hidden">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Gateways
          </h2>
          <div className="flex-1 space-y-2 overflow-y-auto">
            {loading ? (
              <p className="text-sm text-slate-400 dark:text-slate-500">Carregando…</p>
            ) : gateways.length === 0 ? (
              <EmptyHint text="Nenhum gateway registrado ainda." />
            ) : (
              gateways.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setSelectedGatewayId(g.id)}
                  className="block w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-left hover:border-blue-400 hover:bg-blue-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500 dark:hover:bg-slate-800"
                >
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{g.cliente}</div>
                  <div className="text-xs text-slate-400 dark:text-slate-500">
                    {g.data ? formatDataCurta(g.data) : "Sem data"}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="flex flex-col overflow-hidden">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Placas Wireless
          </h2>
          <div className="flex-1 space-y-2 overflow-y-auto">
            {loading ? (
              <p className="text-sm text-slate-400 dark:text-slate-500">Carregando…</p>
            ) : placas.length === 0 ? (
              <EmptyHint text="Nenhuma placa wireless registrada ainda." />
            ) : (
              placas.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div>
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{p.cliente}</div>
                    <div className="text-xs text-slate-400 dark:text-slate-500">
                      {p.data ? formatDataCurta(p.data) : "Sem data"}
                    </div>
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
    </div>
  );
}

interface GatewayDetalheProps {
  id: string;
  onBack: () => void;
  onOpenVisita: (ref: VisitaRef) => void;
  /** Modo consulta (Menu Principal): sem edição dos IDs e sem opção de excluir. */
  readOnly?: boolean;
  onDelete?: () => void;
}

export function GatewayDetalhe({ id, onBack, onOpenVisita, readOnly, onDelete }: GatewayDetalheProps) {
  const [item, setItem] = useState<GatewayItem | null>(null);
  const [idAnterior, setIdAnterior] = useState("");
  const [idNovo, setIdNovo] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.estoque.listGateways().then((list) => {
      if (cancelled) return;
      const found = list.find((g) => g.id === id) ?? null;
      setItem(found);
      setIdAnterior(found?.idAnterior ?? "");
      setIdNovo(found?.idNovo ?? "");
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await api.estoque.saveGateway(id, { idAnterior, idNovo });
      setItem(updated);
      setSavedMessage("Salvo.");
      setTimeout(() => setSavedMessage(null), 1500);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-full flex-col p-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <button
            onClick={onBack}
            className="mb-2 inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            ← Gateways
          </button>
          <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{item?.cliente}</h1>
        </div>
        {!readOnly && onDelete && (
          <button
            onClick={onDelete}
            title="Excluir"
            className="rounded-md p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:text-slate-500 dark:hover:bg-red-950/40 dark:hover:text-red-400"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16Z" />
            </svg>
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-slate-400 dark:text-slate-500">Carregando…</p>
      ) : !item ? (
        <p className="text-sm text-slate-400 dark:text-slate-500">Registro não encontrado.</p>
      ) : (
        <div className="max-w-md space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
              Data
            </label>
            <p className="text-sm text-slate-700 dark:text-slate-200">
              {item.data ? formatDataCurta(item.data) : "Não informada"}
              {item.visitaRef && (
                <span className="text-slate-400 dark:text-slate-500"> (baseada no laudo técnico)</span>
              )}
            </p>
          </div>

          {readOnly ? (
            <>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                  ID do Gateway Anterior
                </label>
                <p className="text-sm text-slate-700 dark:text-slate-200">{item.idAnterior || "—"}</p>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                  ID do Gateway Novo
                </label>
                <p className="text-sm text-slate-700 dark:text-slate-200">{item.idNovo || "—"}</p>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                  ID do Gateway Anterior
                </label>
                <input
                  value={idAnterior}
                  onChange={(e) => setIdAnterior(e.target.value)}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                  ID do Gateway Novo
                </label>
                <input
                  value={idNovo}
                  onChange={(e) => setIdNovo(e.target.value)}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Salvando…" : "Salvar"}
                </button>
                {savedMessage && <span className="text-sm text-green-600 dark:text-green-400">{savedMessage}</span>}
              </div>
            </>
          )}

          {item.visitaRef && (
            <button
              onClick={() => onOpenVisita(item.visitaRef!)}
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400"
            >
              Acessar Laudo Técnico →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
