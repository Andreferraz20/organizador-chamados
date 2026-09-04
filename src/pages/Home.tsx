import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { EmptyHint } from "../components/EmptyHint";
import { TIPOS_MAQUINA, calcularBocas } from "../components/ClienteDadosForm";
import type { NumeroSerie } from "../types";

interface Props {
  onBack: () => void;
  onOpenCliente: (empresa: string) => void;
}

export function Home({ onBack, onOpenCliente }: Props) {
  const [rootFolder, setRootFolder] = useState<string | null | undefined>(undefined);
  const [empresas, setEmpresas] = useState<string[]>([]);
  const [busca, setBusca] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  async function refresh() {
    const settings = await api.settings.get();
    setRootFolder(settings.rootFolder);
    if (settings.rootFolder) {
      setEmpresas(await api.empresas.list());
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleDelete(empresa: string) {
    const deleted = await api.empresas.delete(empresa);
    if (deleted) {
      setEmpresas(await api.empresas.list());
    }
  }

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

      <div className="mb-6">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar cliente…"
          className="w-full max-w-md rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
      </div>

      {(() => {
        const filtradas = empresas.filter((e) => e.toLowerCase().includes(busca.trim().toLowerCase()));
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
    setNumerosSerie((prev) => [...prev, { numero: "", tipoMaquina: "" }]);
  }

  function updateNumeroSerie(index: number, field: keyof NumeroSerie, value: string) {
    setNumerosSerie((prev) => prev.map((n, i) => (i === index ? { ...n, [field]: value } : n)));
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
                      value={ns.numero}
                      onChange={(e) => updateNumeroSerie(index, "numero", e.target.value)}
                      placeholder="Número de série"
                      className="min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
                    />
                    <select
                      value={ns.tipoMaquina}
                      onChange={(e) => updateNumeroSerie(index, "tipoMaquina", e.target.value)}
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
