import { useEffect, useState } from "react";
import { api, formatDataCurta, formatMesLabel } from "../lib/api";
import { EmptyHint } from "../components/EmptyHint";
import type { EstoqueVinculo, GatewayItem, PlacaWirelessItem, VisitaRef } from "../types";

interface Props {
  onBack: () => void;
  onOpenVisita: (ref: VisitaRef) => void;
}

export function EstoqueTecnico({ onBack, onOpenVisita }: Props) {
  const [gateways, setGateways] = useState<GatewayItem[]>([]);
  const [placas, setPlacas] = useState<PlacaWirelessItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddGateway, setShowAddGateway] = useState(false);
  const [showAddPlaca, setShowAddPlaca] = useState(false);
  const [selectedGatewayId, setSelectedGatewayId] = useState<string | null>(null);

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

  if (selectedGatewayId) {
    return (
      <GatewayDetalhe
        id={selectedGatewayId}
        onBack={() => {
          setSelectedGatewayId(null);
          refresh();
        }}
        onOpenVisita={onOpenVisita}
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
      </div>

      <div className="grid flex-1 grid-cols-2 gap-6 overflow-hidden">
        <div className="flex flex-col overflow-hidden">
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

      {showAddGateway && (
        <VinculoModal
          title="Adicionar Gateway"
          onClose={() => setShowAddGateway(false)}
          onConfirm={handleAddGateway}
        />
      )}
      {showAddPlaca && (
        <VinculoModal
          title="Adicionar Placa Wireless"
          onClose={() => setShowAddPlaca(false)}
          onConfirm={handleAddPlaca}
        />
      )}
    </div>
  );
}

function GatewayDetalhe({
  id,
  onBack,
  onOpenVisita,
}: {
  id: string;
  onBack: () => void;
  onOpenVisita: (ref: VisitaRef) => void;
}) {
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
      <div className="mb-6">
        <button
          onClick={onBack}
          className="mb-2 inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          ← Gateways
        </button>
        <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{item?.cliente}</h1>
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

interface MesGroup {
  mes: string;
  visitas: { dia: string; tipoVisita: string }[];
}

function VinculoModal({
  title,
  onClose,
  onConfirm,
}: {
  title: string;
  onClose: () => void;
  onConfirm: (vinculo: EstoqueVinculo) => void;
}) {
  const [modo, setModo] = useState<"visita" | "manual">("visita");
  const [empresas, setEmpresas] = useState<string[]>([]);
  const [buscaCliente, setBuscaCliente] = useState("");
  const [empresaSelecionada, setEmpresaSelecionada] = useState<string | null>(null);
  const [grupos, setGrupos] = useState<MesGroup[]>([]);
  const [loadingGrupos, setLoadingGrupos] = useState(false);
  const [clienteManual, setClienteManual] = useState("");
  const [dataManual, setDataManual] = useState("");

  useEffect(() => {
    api.empresas.list().then(setEmpresas);
  }, []);

  useEffect(() => {
    if (!empresaSelecionada) {
      setGrupos([]);
      return;
    }
    let cancelled = false;
    setLoadingGrupos(true);
    (async () => {
      const meses = await api.visitas.listMeses(empresaSelecionada);
      const ordenados = [...meses].sort((a, b) => b.localeCompare(a));
      const result: MesGroup[] = [];
      for (const mes of ordenados) {
        const doMes = await api.visitas.listVisitas(empresaSelecionada, mes);
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
  }, [empresaSelecionada]);

  function selecionarVisita(mes: string, dia: string, tipoVisita: string) {
    const [ano, mesNum] = mes.split("-");
    onConfirm({
      cliente: empresaSelecionada!,
      data: `${ano}-${mesNum}-${dia}`,
      visitaRef: { empresa: empresaSelecionada!, mes, dia, tipoVisita },
    });
  }

  function confirmarManual() {
    if (!clienteManual.trim()) return;
    onConfirm({ cliente: clienteManual.trim(), data: dataManual || null, visitaRef: null });
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
          !empresaSelecionada ? (
            <div>
              <input
                autoFocus
                value={buscaCliente}
                onChange={(e) => setBuscaCliente(e.target.value)}
                placeholder="Buscar cliente…"
                className="mb-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
              <div className="max-h-64 space-y-1 overflow-y-auto">
                {empresas.length === 0 ? (
                  <EmptyHint text="Nenhum cliente cadastrado ainda." />
                ) : (
                  (() => {
                    const filtradas = empresas.filter((e) =>
                      e.toLowerCase().includes(buscaCliente.trim().toLowerCase()),
                    );
                    return filtradas.length === 0 ? (
                      <EmptyHint text="Nenhum cliente encontrado." />
                    ) : (
                      filtradas.map((e) => (
                        <button
                          key={e}
                          onClick={() => setEmpresaSelecionada(e)}
                          className="block w-full rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                        >
                          {e}
                        </button>
                      ))
                    );
                  })()
                )}
              </div>
            </div>
          ) : (
            <div>
              <button
                onClick={() => {
                  setEmpresaSelecionada(null);
                  setBuscaCliente("");
                }}
                className="mb-2 text-xs text-blue-600 hover:underline dark:text-blue-400"
              >
                ← Trocar cliente
              </button>
              {loadingGrupos ? (
                <p className="text-sm text-slate-400 dark:text-slate-500">Carregando…</p>
              ) : grupos.length === 0 ? (
                <EmptyHint text="Esse cliente não tem visitas técnicas registradas." />
              ) : (
                <div className="max-h-64 space-y-3 overflow-y-auto">
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
              )}
            </div>
          )
        ) : (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                Cliente
              </label>
              <input
                autoFocus
                value={clienteManual}
                onChange={(e) => setClienteManual(e.target.value)}
                placeholder="Nome do cliente"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </div>
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
              disabled={!clienteManual.trim()}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Adicionar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
