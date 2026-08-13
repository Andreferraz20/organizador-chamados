import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { AppSettings } from "../types";

interface Props {
  onBack: () => void;
  onSettingsChanged: (settings: AppSettings) => void;
}

export function Settings({ onBack, onSettingsChanged }: Props) {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [novoTipo, setNovoTipo] = useState("");
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

  function handleAddTipo() {
    if (!settings || !novoTipo.trim()) return;
    if (settings.tiposDeVisita.includes(novoTipo.trim())) {
      setNovoTipo("");
      return;
    }
    persist({ ...settings, tiposDeVisita: [...settings.tiposDeVisita, novoTipo.trim()] });
    setNovoTipo("");
  }

  function handleRemoveTipo(tipo: string) {
    if (!settings) return;
    persist({ ...settings, tiposDeVisita: settings.tiposDeVisita.filter((t) => t !== tipo) });
  }

  if (!settings) {
    return <p className="p-8 text-sm text-slate-400">Carregando…</p>;
  }

  return (
    <div className="mx-auto max-w-2xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <button onClick={onBack} className="text-sm text-slate-400 hover:text-slate-600">
          ← Voltar
        </button>
        {savedMessage && <span className="text-sm text-green-600">{savedMessage}</span>}
      </div>

      <h1 className="mb-6 text-xl font-semibold text-slate-800">Ajustes</h1>

      <section className="mb-8">
        <h2 className="mb-2 text-sm font-semibold uppercase text-slate-500">Pasta Raiz</h2>
        <p className="mb-2 text-sm text-slate-600">
          {settings.rootFolder ?? "Nenhuma pasta configurada"}
        </p>
        <button
          onClick={handleChooseRootFolder}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Escolher pasta
        </button>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-sm font-semibold uppercase text-slate-500">Tipos de Visita</h2>
        <ul className="mb-3 space-y-1">
          {settings.tiposDeVisita.map((tipo) => (
            <li key={tipo} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-sm">
              {tipo}
              <button onClick={() => handleRemoveTipo(tipo)} className="text-xs text-red-500 hover:text-red-700">
                remover
              </button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <input
            value={novoTipo}
            onChange={(e) => setNovoTipo(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddTipo()}
            placeholder="Novo tipo de visita"
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
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
        <h2 className="mb-2 text-sm font-semibold uppercase text-slate-500">Dados do Técnico</h2>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase text-slate-500">Nome</label>
            <input
              value={settings.tecnicoNome}
              onChange={(e) => setSettings({ ...settings, tecnicoNome: e.target.value })}
              onBlur={() => persist(settings)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase text-slate-500">Empresa</label>
            <input
              value={settings.tecnicoEmpresa}
              onChange={(e) => setSettings({ ...settings, tecnicoEmpresa: e.target.value })}
              onBlur={() => persist(settings)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
