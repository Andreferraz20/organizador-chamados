import { useEffect, useState } from "react";
import { api, formatDataCurta, formatMesLabel } from "../lib/api";
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

type DeleteTarget = { tipo: "gateway" | "placa"; id: string; label: string };

/** Aba dentro do cliente — aqui é onde se adiciona/remove um uso de estoque (Gateway/Placa Wireless). */
export function ClienteEstoqueTecnico({ empresa, initialGatewayId, onOpenVisita }: Props) {
  const [gateways, setGateways] = useState<GatewayItem[]>([]);
  const [placas, setPlacas] = useState<PlacaWirelessItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGatewayId, setSelectedGatewayId] = useState<string | null>(initialGatewayId ?? null);
  const [showAddGateway, setShowAddGateway] = useState(false);
  const [showAddPlaca, setShowAddPlaca] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function refresh() {
    setLoading(true);
    const [g, p] = await Promise.all([api.estoque.listGateways(), api.estoque.listPlacas()]);
    setGateways(g.filter((item) => pertenceAoCliente(item, empresa)));
    setPlacas(p.filter((item) => pertenceAoCliente(item, empresa)));
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, [empresa]);

  async function handleAddGateway(vinculo: EstoqueVinculo) {
    const item = await api.estoque.createGateway(vinculo);
    setShowAddGateway(false);
    await refresh();
    setSelectedGatewayId(item.id);
  }

  async function handleAddPlaca(vinculo: EstoqueVinculo) {
    await api.estoque.createPlaca(vinculo);
    setShowAddPlaca(false);
    refresh();
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.tipo === "gateway") {
        await api.estoque.deleteGateway(deleteTarget.id);
        if (selectedGatewayId === deleteTarget.id) setSelectedGatewayId(null);
      } else {
        await api.estoque.deletePlaca(deleteTarget.id);
      }
      setDeleteTarget(null);
      await refresh();
    } finally {
      setDeleting(false);
    }
  }

  if (selectedGatewayId) {
    return (
      <>
        <GatewayDetalhe
          id={selectedGatewayId}
          onBack={() => {
            setSelectedGatewayId(null);
            refresh();
          }}
          onOpenVisita={(ref) => onOpenVisita(ref, selectedGatewayId)}
          onDelete={() => {
            const g = gateways.find((item) => item.id === selectedGatewayId);
            setDeleteTarget({ tipo: "gateway", id: selectedGatewayId, label: g?.cliente ?? empresa });
          }}
        />
        {deleteTarget && (
          <ConfirmDeleteModal target={deleteTarget} deleting={deleting} onCancel={() => setDeleteTarget(null)} onConfirm={confirmDelete} />
        )}
      </>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Gateways
            </h2>
            <button
              onClick={() => setShowAddGateway(true)}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
            >
              + Adicionar Gateway
            </button>
          </div>
          <div className="space-y-2">
            {loading ? (
              <p className="text-sm text-slate-400 dark:text-slate-500">Carregando…</p>
            ) : gateways.length === 0 ? (
              <EmptyHint text="Nenhuma troca de gateway registrada pra esse cliente." />
            ) : (
              gateways.map((g) => (
                <div
                  key={g.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white pr-2 dark:border-slate-800 dark:bg-slate-900"
                >
                  <button
                    onClick={() => setSelectedGatewayId(g.id)}
                    className="flex-1 px-4 py-3 text-left hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      {g.data ? formatDataCurta(g.data) : "Sem data"}
                    </div>
                  </button>
                  <button
                    onClick={() => setDeleteTarget({ tipo: "gateway", id: g.id, label: g.cliente })}
                    title="Remover"
                    className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:text-slate-500 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16Z" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Placas Wireless
            </h2>
            <button
              onClick={() => setShowAddPlaca(true)}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
            >
              + Adicionar Placa Wireless
            </button>
          </div>
          <div className="space-y-2">
            {loading ? (
              <p className="text-sm text-slate-400 dark:text-slate-500">Carregando…</p>
            ) : placas.length === 0 ? (
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
                  <div className="flex shrink-0 items-center gap-1">
                    {p.visitaRef && (
                      <button
                        onClick={() => onOpenVisita(p.visitaRef!)}
                        title="Acessar Laudo Técnico"
                        className="flex items-center gap-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-blue-500 dark:hover:bg-slate-800 dark:hover:text-blue-400"
                      >
                        Laudo Técnico
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                          <path d="M9 6l6 6-6 6" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => setDeleteTarget({ tipo: "placa", id: p.id, label: p.cliente })}
                      title="Remover"
                      className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:text-slate-500 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16Z" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showAddGateway && (
        <VinculoModal
          empresa={empresa}
          title="Adicionar Gateway"
          onClose={() => setShowAddGateway(false)}
          onConfirm={handleAddGateway}
        />
      )}
      {showAddPlaca && (
        <VinculoModal
          empresa={empresa}
          title="Adicionar Placa Wireless"
          onClose={() => setShowAddPlaca(false)}
          onConfirm={handleAddPlaca}
        />
      )}
      {deleteTarget && (
        <ConfirmDeleteModal target={deleteTarget} deleting={deleting} onCancel={() => setDeleteTarget(null)} onConfirm={confirmDelete} />
      )}
    </div>
  );
}

function ConfirmDeleteModal({
  target,
  deleting,
  onCancel,
  onConfirm,
}: {
  target: DeleteTarget;
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const tipoLabel = target.tipo === "gateway" ? "gateway" : "placa wireless";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-800">
        <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
          Remover este uso de estoque?
        </h3>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          Isso remove o registro de {tipoLabel} de "{target.label}". Não é possível desfazer.
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? "Removendo…" : "Remover"}
          </button>
        </div>
      </div>
    </div>
  );
}

interface MesGroup {
  mes: string;
  visitas: { dia: string; tipoVisita: string }[];
}

function VinculoModal({
  empresa,
  title,
  onClose,
  onConfirm,
}: {
  empresa: string;
  title: string;
  onClose: () => void;
  onConfirm: (vinculo: EstoqueVinculo) => void;
}) {
  const [modo, setModo] = useState<"visita" | "manual">("visita");
  const [grupos, setGrupos] = useState<MesGroup[]>([]);
  const [loadingGrupos, setLoadingGrupos] = useState(true);
  const [dataManual, setDataManual] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoadingGrupos(true);
    (async () => {
      const meses = await api.visitas.listMeses(empresa);
      const ordenados = [...meses].sort((a, b) => b.localeCompare(a));
      const result: MesGroup[] = [];
      for (const mes of ordenados) {
        const doMes = await api.visitas.listVisitas(empresa, mes);
        const visitas = [...doMes].sort((a, b) => b.dia.localeCompare(a.dia));
        if (visitas.length > 0) result.push({ mes, visitas });
      }
      if (cancelled) return;
      setGrupos(result);
      setLoadingGrupos(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [empresa]);

  function selecionarVisita(mes: string, dia: string, tipoVisita: string) {
    const [ano, mesNum] = mes.split("-");
    onConfirm({
      cliente: empresa,
      data: `${ano}-${mesNum}-${dia}`,
      visitaRef: { empresa, mes, dia, tipoVisita },
    });
  }

  function confirmarManual() {
    onConfirm({ cliente: empresa, data: dataManual || null, visitaRef: null });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-800">
        <h3 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</h3>

        <div className="mb-3 flex gap-1 rounded-md border border-slate-200 p-1 dark:border-slate-700">
          <button
            onClick={() => setModo("visita")}
            className={`flex-1 rounded px-3 py-1.5 text-xs font-medium ${
              modo === "visita"
                ? "bg-blue-600 text-white"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
            }`}
          >
            Vincular a uma visita
          </button>
          <button
            onClick={() => setModo("manual")}
            className={`flex-1 rounded px-3 py-1.5 text-xs font-medium ${
              modo === "manual"
                ? "bg-blue-600 text-white"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
            }`}
          >
            Preencher manualmente
          </button>
        </div>

        {modo === "visita" ? (
          loadingGrupos ? (
            <p className="text-sm text-slate-400 dark:text-slate-500">Carregando…</p>
          ) : grupos.length === 0 ? (
            <EmptyHint text="Esse cliente não tem visitas técnicas registradas." />
          ) : (
            <div className="max-h-72 space-y-3 overflow-y-auto">
              {grupos.map((grupo) => (
                <div key={grupo.mes}>
                  <p className="mb-1 px-1 text-xs font-semibold uppercase text-slate-400 dark:text-slate-500">
                    {formatMesLabel(grupo.mes)}
                  </p>
                  <div className="space-y-1">
                    {grupo.visitas.map((v) => (
                      <button
                        key={`${grupo.mes}-${v.dia}-${v.tipoVisita}`}
                        onClick={() => selecionarVisita(grupo.mes, v.dia, v.tipoVisita)}
                        className="block w-full rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                      >
                        Dia {v.dia} — {v.tipoVisita}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div>
            <label className="mb-1 block text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
              Data (opcional)
            </label>
            <input
              type="date"
              value={dataManual}
              onChange={(e) => setDataManual(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancelar
          </button>
          {modo === "manual" && (
            <button
              onClick={confirmarManual}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Adicionar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
