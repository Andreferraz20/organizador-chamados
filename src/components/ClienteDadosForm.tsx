import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { EmptyHint } from "./EmptyHint";
import type { ClienteDados, NumeroSerie, Pessoa } from "../types";

const TIPOS_MAQUINA = [
  "Lavadora Individual",
  "Secadora Individual",
  "Topload",
  "Lava/Seca Stack",
  "Secadora Dupla",
];

interface Props {
  empresa: string;
  onRenamed: (newEmpresa: string) => void;
}

function emptyDados(empresa: string): ClienteDados {
  return { nome: empresa, endereco: "", quantidadeBocas: "", numerosSerie: [], pessoas: [] };
}

export function ClienteDadosForm({ empresa, onRenamed }: Props) {
  const [form, setForm] = useState<ClienteDados>(() => emptyDados(empresa));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.clienteDados.get(empresa).then((existing) => {
      if (cancelled) return;
      // Merge por cima do padrão pra clientes salvos antes de campos novos existirem
      // (ex: numerosSerie, quantidadeBocas) não quebrarem o formulário.
      setForm({ ...emptyDados(empresa), ...existing });
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [empresa]);

  function update<K extends keyof ClienteDados>(key: K, value: ClienteDados[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSavedMessage(null);
  }

  function updatePessoa(index: number, field: keyof Pessoa, value: string) {
    setForm((prev) => ({
      ...prev,
      pessoas: prev.pessoas.map((p, i) => (i === index ? { ...p, [field]: value } : p)),
    }));
    setSavedMessage(null);
  }

  function addPessoa() {
    setForm((prev) => ({
      ...prev,
      pessoas: [...prev.pessoas, { nome: "", contato: "", cargo: "", email: "" }],
    }));
  }

  function removePessoa(index: number) {
    setForm((prev) => ({ ...prev, pessoas: prev.pessoas.filter((_, i) => i !== index) }));
  }

  function updateNumeroSerie(index: number, field: keyof NumeroSerie, value: string) {
    setForm((prev) => ({
      ...prev,
      numerosSerie: prev.numerosSerie.map((n, i) => (i === index ? { ...n, [field]: value } : n)),
    }));
    setSavedMessage(null);
  }

  function addNumeroSerie() {
    setForm((prev) => ({
      ...prev,
      numerosSerie: [...prev.numerosSerie, { numero: "", tipoMaquina: "" }],
    }));
  }

  function removeNumeroSerie(index: number) {
    setForm((prev) => ({ ...prev, numerosSerie: prev.numerosSerie.filter((_, i) => i !== index) }));
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      const trimmedNome = form.nome.trim();
      let targetEmpresa = empresa;
      let dataToSave = form;
      if (trimmedNome && trimmedNome !== empresa) {
        targetEmpresa = await api.empresas.rename(empresa, trimmedNome);
        dataToSave = { ...form, nome: targetEmpresa };
        setForm(dataToSave);
      }
      await api.clienteDados.save(targetEmpresa, dataToSave);
      if (targetEmpresa !== empresa) onRenamed(targetEmpresa);
      setSavedMessage("Salvo.");
      setTimeout(() => setSavedMessage(null), 1500);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-400 dark:text-slate-500">Carregando…</p>;
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div className="max-w-md space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
            Nome do Cliente
          </label>
          <input
            value={form.nome}
            onChange={(e) => update("nome", e.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            Ao salvar com um nome diferente, a pasta do cliente é renomeada junto.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
            Endereço
          </label>
          <input
            value={form.endereco}
            onChange={(e) => update("endereco", e.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 divide-x divide-slate-200 rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
        <div className="space-y-6 p-4">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
              Quantidade de Bocas
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={form.quantidadeBocas}
              onChange={(e) => update("quantidadeBocas", e.target.value.replace(/\D/g, ""))}
              className="w-12 rounded-md border border-slate-300 bg-white px-2 py-2 text-center text-sm text-slate-800 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                Números de Série
              </label>
              <button
                onClick={addNumeroSerie}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                + Adicionar
              </button>
            </div>

            {form.numerosSerie.length === 0 ? (
              <EmptyHint text="Nenhum número de série adicionado." />
            ) : (
              <div className="space-y-2">
                {form.numerosSerie.map((ns, index) => (
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
              </div>
            )}
          </div>
        </div>

        <div className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
              Pessoas de Contato
            </label>
            <button
              onClick={addPessoa}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              + Adicionar pessoa
            </button>
          </div>

          {form.pessoas.length === 0 ? (
            <EmptyHint text="Nenhuma pessoa adicionada." />
          ) : (
            <div className="space-y-2">
              {form.pessoas.map((pessoa, index) => (
                <div
                  key={index}
                  className="relative rounded-lg border border-slate-200 bg-slate-50 p-3 pr-10 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                        Nome
                      </label>
                      <input
                        value={pessoa.nome}
                        onChange={(e) => updatePessoa(index, "nome", e.target.value)}
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                        Contato
                      </label>
                      <input
                        value={pessoa.contato}
                        onChange={(e) => updatePessoa(index, "contato", e.target.value)}
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                        Cargo
                      </label>
                      <input
                        value={pessoa.cargo}
                        onChange={(e) => updatePessoa(index, "cargo", e.target.value)}
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                        E-mail
                      </label>
                      <input
                        type="email"
                        value={pessoa.email}
                        onChange={(e) => updatePessoa(index, "email", e.target.value)}
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => removePessoa(index)}
                    title="Remover pessoa"
                    className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-600 dark:text-slate-500 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Salvando…" : "Salvar"}
        </button>
        {savedMessage && <span className="text-sm text-green-600 dark:text-green-400">{savedMessage}</span>}
        {saveError && <span className="text-sm text-red-600 dark:text-red-400">{saveError}</span>}
      </div>
    </div>
  );
}
