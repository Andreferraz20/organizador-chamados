import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { EmptyHint } from "../components/EmptyHint";
import { TIPOS_MAQUINA, calcularBocas, trocarTipoNaNumeracao } from "../components/ClienteDadosForm";
import type { NumeroSerie } from "../types";

interface Props {
  onBack: () => void;
  onOpenCliente: (empresa: string) => void;
}

interface VisitaResumoGlobal {
  empresa: string;
  /** Formato AAAA-MM-DD */
  data: string;
  tipoVisita: string;
}

/** Palavras que não flexionam no plural (preposições, artigos, conjunções). */
const PALAVRAS_INVARIAVEIS = new Set([
  "de", "da", "do", "das", "dos", "e", "em", "a", "o", "as", "os", "com", "para", "por",
]);

function pluralizarPalavra(palavra: string): string {
  const minuscula = palavra.toLowerCase();
  if (minuscula.endsWith("ção")) return palavra.slice(0, -3) + "ções";
  if (minuscula.endsWith("ão")) return palavra.slice(0, -2) + "ões";
  if (/[rz]$/i.test(palavra)) return palavra + "es";
  if (minuscula.endsWith("m")) return palavra.slice(0, -1) + "ns";
  if (minuscula.endsWith("l")) return palavra.slice(0, -1) + "is";
  if (/[aeiouáéíóúâêôãõ]$/i.test(palavra)) return palavra + "s";
  return palavra + "s";
}

function hojeISO(): string {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

/** Pluraliza um tipo de visita configurado livremente pelo técnico (ex: "Avaliação Técnica" -> "Avaliações Técnicas"). */
function pluralizarTipo(label: string): string {
  return label
    .split(" ")
    .map((palavra) => (PALAVRAS_INVARIAVEIS.has(palavra.toLowerCase()) ? palavra : pluralizarPalavra(palavra)))
    .join(" ");
}

export function Home({ onBack, onOpenCliente }: Props) {
  const [rootFolder, setRootFolder] = useState<string | null | undefined>(undefined);
  const [empresas, setEmpresas] = useState<string[]>([]);
  const [busca, setBusca] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const [tiposDeVisita, setTiposDeVisita] = useState<string[]>([]);
  const [showFiltros, setShowFiltros] = useState(false);
  const [todasVisitas, setTodasVisitas] = useState<VisitaResumoGlobal[]>([]);
  const [visitasCarregadas, setVisitasCarregadas] = useState(false);
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [tiposSelecionados, setTiposSelecionados] = useState<string[]>([]);

  async function refresh() {
    const settings = await api.settings.get();
    setRootFolder(settings.rootFolder);
    setTiposDeVisita(settings.tiposDeVisita.map((t) => t.label));
    if (settings.rootFolder) {
      setEmpresas(await api.empresas.list());
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (showFiltros && !visitasCarregadas) {
      api.visitas.listTodas().then((visitas) => {
        setTodasVisitas(visitas);
        setVisitasCarregadas(true);
      });
    }
  }, [showFiltros, visitasCarregadas]);

  async function handleDelete(empresa: string) {
    const deleted = await api.empresas.delete(empresa);
    if (deleted) {
      setEmpresas(await api.empresas.list());
    }
  }

  function toggleTipoSelecionado(tipo: string) {
    setTiposSelecionados((prev) => (prev.includes(tipo) ? prev.filter((t) => t !== tipo) : [...prev, tipo]));
  }

  const filtroAtivo = Boolean(dataInicio && dataFim);
  const visitasNoPeriodo = filtroAtivo
    ? todasVisitas.filter((v) => v.data >= dataInicio && v.data <= dataFim)
    : [];
  const visitasFiltradas =
    tiposSelecionados.length === 0
      ? visitasNoPeriodo
      : visitasNoPeriodo.filter((v) => tiposSelecionados.includes(v.tipoVisita));
  const empresasComVisita = new Set(visitasFiltradas.map((v) => v.empresa));
  const tiposParaContagem = tiposSelecionados.length === 0 ? tiposDeVisita : tiposSelecionados;

  if (rootFolder === undefined) {
    return <p className="p-8 text-sm text-slate-400 dark:text-slate-500">Carregando…</p>;
  }

  if (!rootFolder) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Configure a pasta raiz</h2>
        <p className="max-w-md text-sm text-slate-500 dark:text-slate-400">
          Antes de começar, escolha em Ajustes (engrenagem no Menu Principal) a pasta no seu PC onde
          os chamados (empresas, fotos, vídeos e laudos) serão guardados.
        </p>
        <button
          onClick={onBack}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Voltar ao Menu Principal
        </button>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="mb-2 inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          ← Menu
        </button>
        <h1 className="text-xl font-semibold uppercase tracking-wide text-slate-800 dark:text-slate-100">Clientes</h1>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar cliente…"
          className="w-full max-w-md rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
        <button
          onClick={() => setShowFiltros(true)}
          className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium ${
            filtroAtivo
              ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-900/30 dark:text-blue-300"
              : "border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          }`}
        >
          Filtros
          {filtroAtivo && <span className="h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />}
        </button>
      </div>

      {showFiltros && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-800">
            <h3 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">Filtrar Clientes</h3>

            <div className="max-h-[70vh] space-y-5 overflow-y-auto pr-1">
              <div>
                <label className="mb-2 block text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                  Filtrar por Data
                </label>
                <div className="flex flex-wrap items-end gap-3">
                  <div>
                    <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Do dia</label>
                    <input
                      type="date"
                      value={dataInicio}
                      max={hojeISO()}
                      onChange={(e) => setDataInicio(e.target.value)}
                      className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 [&::-webkit-calendar-picker-indicator]:ml-1 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:rounded [&::-webkit-calendar-picker-indicator]:bg-blue-100 [&::-webkit-calendar-picker-indicator]:p-1 [&::-webkit-calendar-picker-indicator]:opacity-100 dark:[&::-webkit-calendar-picker-indicator]:bg-blue-200"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Até o dia</label>
                    <input
                      type="date"
                      value={dataFim}
                      max={hojeISO()}
                      onChange={(e) => setDataFim(e.target.value)}
                      className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 [&::-webkit-calendar-picker-indicator]:ml-1 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:rounded [&::-webkit-calendar-picker-indicator]:bg-blue-100 [&::-webkit-calendar-picker-indicator]:p-1 [&::-webkit-calendar-picker-indicator]:opacity-100 dark:[&::-webkit-calendar-picker-indicator]:bg-blue-200"
                    />
                  </div>
                </div>
              </div>

              {filtroAtivo && (
                <div>
                  <label className="mb-2 block text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                    Tipos de Visita
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setTiposSelecionados([])}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                        tiposSelecionados.length === 0
                          ? "border-blue-500 bg-blue-100 text-blue-700 dark:border-blue-500 dark:bg-blue-900/40 dark:text-blue-300"
                          : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                      }`}
                    >
                      Todas
                    </button>
                    {tiposDeVisita.map((tipo) => (
                      <button
                        key={tipo}
                        onClick={() => toggleTipoSelecionado(tipo)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                          tiposSelecionados.includes(tipo)
                            ? "border-blue-500 bg-blue-100 text-blue-700 dark:border-blue-500 dark:bg-blue-900/40 dark:text-blue-300"
                            : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                        }`}
                      >
                        {tipo}
                      </button>
                    ))}
                  </div>

                  {visitasCarregadas && (
                    <div className="mt-4 space-y-1.5 border-t border-slate-200 pt-3 dark:border-slate-700">
                      {tiposParaContagem.map((tipo) => (
                        <div
                          key={tipo}
                          className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-1.5 text-sm dark:bg-slate-900"
                        >
                          <span className="text-slate-600 dark:text-slate-300">{pluralizarTipo(tipo)}</span>
                          <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                            {visitasNoPeriodo.filter((v) => v.tipoVisita === tipo).length}
                          </span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between rounded-md bg-blue-50 px-3 py-1.5 text-sm font-medium dark:bg-blue-900/20">
                        <span className="text-blue-800 dark:text-blue-200">Total no período</span>
                        <span className="rounded-full bg-blue-600 px-2.5 py-0.5 text-xs font-semibold text-white">
                          {visitasFiltradas.length} em {empresasComVisita.size} cliente(s)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between">
              {filtroAtivo ? (
                <button
                  onClick={() => {
                    setDataInicio("");
                    setDataFim("");
                    setTiposSelecionados([]);
                  }}
                  className="text-xs font-medium text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                >
                  Limpar filtro
                </button>
              ) : (
                <span />
              )}
              <button
                onClick={() => setShowFiltros(false)}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {(() => {
        const filtradas = empresas
          .filter((e) => e.toLowerCase().includes(busca.trim().toLowerCase()))
          .filter((e) => !filtroAtivo || empresasComVisita.has(e));
        if (empresas.length === 0) return <EmptyHint text="Nenhum cliente cadastrado ainda." />;
        if (filtradas.length === 0) return <EmptyHint text="Nenhum cliente encontrado." />;
        return (
          <ul className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {filtradas.map((empresa) => (
              <li key={empresa} className="group relative">
                <button
                  onClick={() => onOpenCliente(empresa)}
                  className="flex w-full min-h-24 items-center rounded-xl border border-slate-200 bg-white px-4 py-6 text-left text-sm font-medium text-slate-700 shadow-sm transition hover:border-blue-400 hover:bg-blue-50 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-500 dark:hover:bg-slate-800"
                >
                  {empresa}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(empresa);
                  }}
                  title="Excluir cliente"
                  className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-slate-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 dark:text-slate-500 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16Z" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        );
      })()}

      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-16 right-4 z-40 rounded-full bg-blue-600 px-5 py-3 text-sm font-medium text-white shadow-lg hover:bg-blue-700"
      >
        + Adicionar Cliente
      </button>

      {showAdd && (
        <AdicionarClienteModal
          empresasExistentes={empresas}
          onClose={() => setShowAdd(false)}
          onCreated={(nome) => {
            setShowAdd(false);
            onOpenCliente(nome);
          }}
        />
      )}
    </div>
  );
}

function AdicionarClienteModal({
  empresasExistentes,
  onClose,
  onCreated,
}: {
  empresasExistentes: string[];
  onClose: () => void;
  onCreated: (nome: string) => void;
}) {
  const [nome, setNome] = useState("");
  const [endereco, setEndereco] = useState("");
  const [numerosSerie, setNumerosSerie] = useState<NumeroSerie[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addNumeroSerie() {
    setNumerosSerie((prev) => [...prev, { numero: "", tipoMaquina: "", numeracao: "" }]);
  }

  function updateNumeroSerie(index: number, field: keyof NumeroSerie, value: string) {
    setNumerosSerie((prev) => prev.map((n, i) => (i === index ? { ...n, [field]: value } : n)));
  }

  function updateTipoMaquina(index: number, novoTipo: string) {
    setNumerosSerie((prev) =>
      prev.map((n, i) =>
        i === index
          ? { ...n, tipoMaquina: novoTipo, numeracao: trocarTipoNaNumeracao(n.numeracao, n.tipoMaquina, novoTipo) }
          : n,
      ),
    );
  }

  function removeNumeroSerie(index: number) {
    setNumerosSerie((prev) => prev.filter((_, i) => i !== index));
  }

  const quantidadeBocas = calcularBocas(numerosSerie);

  async function handleCreate() {
    const nomeTrim = nome.trim();
    if (!nomeTrim) return;
    if (empresasExistentes.some((e) => e.toLowerCase() === nomeTrim.toLowerCase())) {
      setError(`Já existe um cliente chamado "${nomeTrim}".`);
      return;
    }
    setCreating(true);
    setError(null);
    try {
      await api.empresas.create(nomeTrim);
      await api.clienteDados.save(nomeTrim, {
        nome: nomeTrim,
        endereco: endereco.trim(),
        codigoLavanderia: "",
        quantidadeBocas: String(quantidadeBocas),
        numerosSerie,
        pessoas: [],
      });
      onCreated(nomeTrim);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Não foi possível criar o cliente.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-800">
        <h3 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">Adicionar Cliente</h3>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
              Nome do Cliente
            </label>
            <input
              autoFocus
              value={nome}
              onChange={(e) => setNome(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
              Endereço <span className="normal-case text-slate-400 dark:text-slate-500">(opcional)</span>
            </label>
            <input
              value={endereco}
              onChange={(e) => setEndereco(e.target.value.toUpperCase())}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                Números de Série <span className="normal-case text-slate-400">(opcional)</span>
              </label>
              <button
                onClick={addNumeroSerie}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                + Adicionar
              </button>
            </div>

            {numerosSerie.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Pode deixar em branco e preencher depois em Dados do Cliente.
              </p>
            ) : (
              <div className="space-y-2">
                {numerosSerie.map((ns, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      value={ns.numeracao}
                      onChange={(e) => updateNumeroSerie(index, "numeracao", e.target.value.toUpperCase())}
                      maxLength={5}
                      title="Numeração da máquina na lavanderia"
                      placeholder="Nº"
                      className="w-16 shrink-0 rounded-md border border-slate-300 bg-white px-2 py-2 text-center text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                    />
                    <input
                      value={ns.numero}
                      onChange={(e) => updateNumeroSerie(index, "numero", e.target.value)}
                      placeholder="Número de série"
                      className="min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                    />
                    <select
                      value={ns.tipoMaquina}
                      onChange={(e) => updateTipoMaquina(index, e.target.value)}
                      className="shrink-0 rounded-md border border-slate-300 bg-white px-2 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    >
                      <option value="">Tipo de máquina</option>
                      {TIPOS_MAQUINA.map((tipo) => (
                        <option key={tipo} value={tipo}>
                          {tipo}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => removeNumeroSerie(index)}
                      title="Remover"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600 dark:text-slate-500 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                        <path d="M18 6 6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Quantidade de Bocas calculada: {quantidadeBocas}
                </p>
              </div>
            )}
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            disabled={!nome.trim() || creating}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {creating ? "Criando…" : "Adicionar"}
          </button>
        </div>
      </div>
    </div>
  );
}
