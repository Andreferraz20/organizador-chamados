import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { EmptyHint } from "./EmptyHint";
import type { ClienteDados, Pessoa } from "../types";

interface Props {
  empresa: string;
}

function emptyDados(empresa: string): ClienteDados {
  return { nome: empresa, endereco: "", pessoas: [] };
}

export function ClienteDadosForm({ empresa }: Props) {
  const [form, setForm] = useState<ClienteDados>(() => emptyDados(empresa));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.clienteDados.get(empresa).then((existing) => {
      if (cancelled) return;
      setForm(existing ?? emptyDados(empresa));
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

  async function handleSave() {
    setSaving(true);
    try {
      await api.clienteDados.save(empresa, form);
      setSavedMessage("Salvo.");
      setTimeout(() => setSavedMessage(null), 1500);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-400 dark:text-slate-500">Carregando…</p>;
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <label className="mb-1 block text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
          Nome do Cliente
        </label>
        <input
          value={form.nome}
          onChange={(e) => update("nome", e.target.value)}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
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

      <div>
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

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Salvando…" : "Salvar"}
        </button>
        {savedMessage && <span className="text-sm text-green-600 dark:text-green-400">{savedMessage}</span>}
      </div>
    </div>
  );
}
