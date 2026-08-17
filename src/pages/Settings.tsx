import { useEffect, useState } from "react";
import { api, suggestSigla } from "../lib/api";
import type { AppSettings } from "../types";

interface Props {
  onBack: () => void;
  onSettingsChanged: (settings: AppSettings) => void;
}

export function Settings({ onBack, onSettingsChanged }: Props) {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [novoNome, setNovoNome] = useState("");
  const [novaSigla, setNovaSigla] = useState("");
  const [siglaTocada, setSiglaTocada] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    api.settings.get().then(setSettings);
  }, []);

  async function persist(next: AppSettings) {
    setSettings(next);
    const saved = await api.settings.save(next);
    onSettingsChanged(saved);
    setSavedMessage("Salvo.");
    setTimeout(() => setSavedMessage(null), 1500);
  }

  async function handleChooseRootFolder() {
    if (!settings) return;
    const folder = await api.settings.chooseRootFolder();
    if (folder) {
      persist({ ...settings, rootFolder: folder });
    }
  }

  function handleNomeChange(value: string) {
    setNovoNome(value);
    if (!siglaTocada) setNovaSigla(suggestSigla(value));
  }

  function handleSiglaChange(value: string) {
    setSiglaTocada(true);
    setNovaSigla(value.toUpperCase());
  }

  function handleAddTipo() {
    if (!settings || !novoNome.trim()) return;
    const label = novoNome.trim();
    if (settings.tiposDeVisita.some((t) => t.label === label)) {
      setNovoNome("");
      setNovaSigla("");
      setSiglaTocada(false);
      return;
    }
    const sigla = (novaSigla.trim() || suggestSigla(label)).toUpperCase();
    persist({ ...settings, tiposDeVisita: [...settings.tiposDeVisita, { label, sigla }] });
    setNovoNome("");
    setNovaSigla("");
    setSiglaTocada(false);
  }

  function handleRemoveTipo(label: string) {
    if (!settings) return;
    persist({ ...settings, tiposDeVisita: settings.tiposDeVisita.filter((t) => t.label !== label) });
  }

  function updateSiglaExistente(label: string, sigla: string) {
    if (!settings) return;
    setSettings({
      ...settings,
      tiposDeVisita: settings.tiposDeVisita.map((t) => (t.label === label ? { ...t, sigla: sigla.toUpperCase() } : t)),
    });
  }

  if (!settings) {
    return <p className="p-8 text-sm text-slate-400 dark:text-slate-500">Carregando…</p>;
  }

  return (
    <div className="mx-auto max-w-2xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          ← Voltar
        </button>
        {savedMessage && <span className="text-sm text-green-600 dark:text-green-400">{savedMessage}</span>}
      </div>

      <h1 className="mb-6 text-xl font-semibold text-slate-800 dark:text-slate-100">Ajustes</h1>

      <section className="mb-8">
        <h2 className="mb-2 text-sm font-semibold uppercase text-slate-500 dark:text-slate-400">Pasta Raiz</h2>
        <p className="mb-2 text-sm text-slate-600 dark:text-slate-300">
          {settings.rootFolder ?? "Nenhuma pasta configurada"}
        </p>
        <button
          onClick={handleChooseRootFolder}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Escolher pasta
        </button>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-sm font-semibold uppercase text-slate-500 dark:text-slate-400">Tipos de Visita</h2>
        <p className="mb-3 text-xs text-slate-400 dark:text-slate-500">
          A sigla é usada no nome da pasta criada no Windows (ex: 13-08-2026-CORRETIVA). Pode editar a
          qualquer momento.
        </p>
        <ul className="mb-3 space-y-1">
          {settings.tiposDeVisita.map((tipo) => (
            <li
              key={tipo.label}
              className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 dark:border-slate-800 dark:text-slate-300"
            >
              <span className="flex-1">{tipo.label}</span>
              <input
                value={tipo.sigla}
                onChange={(e) => updateSiglaExistente(tipo.label, e.target.value)}
                onBlur={() => persist(settings)}
                className="w-32 rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium uppercase text-slate-700 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
              <button onClick={() => handleRemoveTipo(tipo.label)} className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
                remover
              </button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <input
            value={novoNome}
            onChange={(e) => handleNomeChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddTipo()}
            placeholder="Novo tipo de visita"
            className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
          <input
            value={novaSigla}
            onChange={(e) => handleSiglaChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddTipo()}
            placeholder="Sigla"
            className="w-28 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium uppercase text-slate-800 placeholder:normal-case placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
          <button
            onClick={handleAddTipo}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Adicionar
          </button>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase text-slate-500 dark:text-slate-400">Dados do Técnico</h2>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Nome</label>
            <input
              value={settings.tecnicoNome}
              onChange={(e) => setSettings({ ...settings, tecnicoNome: e.target.value })}
              onBlur={() => persist(settings)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Empresa</label>
            <input
              value={settings.tecnicoEmpresa}
              onChange={(e) => setSettings({ ...settings, tecnicoEmpresa: e.target.value })}
              onBlur={() => persist(settings)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
