import { useEffect, useState } from "react";
import { api } from "./lib/api";
import { useTheme } from "./lib/theme";
import { MainMenu } from "./pages/MainMenu";
import { Home } from "./pages/Home";
import { Cliente } from "./pages/Cliente";
import { Visita } from "./pages/Visita";
import { Settings } from "./pages/Settings";
import type { AppSettings, VisitaRef } from "./types";

type Route =
  | { name: "menu" }
  | { name: "home" }
  | { name: "cliente"; empresa: string }
  | { name: "visita"; ref: VisitaRef }
  | { name: "settings" };

function BackToMenuBar({ onClick }: { onClick: () => void }) {
  return (
    <div className="flex shrink-0 justify-end border-b border-slate-200 bg-white px-4 py-2 dark:border-slate-800 dark:bg-slate-900">
      <button
        onClick={onClick}
        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        Voltar ao Menu Principal
      </button>
    </div>
  );
}

function ThemeToggle({ theme, onToggle }: { theme: "light" | "dark"; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      title={theme === "dark" ? "Mudar para modo claro" : "Mudar para modo escuro"}
      className="fixed bottom-4 right-4 z-50 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-md hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
    >
      {theme === "dark" ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
        </svg>
      )}
    </button>
  );
}

export default function App() {
  const [route, setRoute] = useState<Route>({ name: "menu" });
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const { theme, toggle } = useTheme();

  useEffect(() => {
    if (!api) return;
    api.settings.get().then(setSettings);
  }, []);

  if (!api) {
    return (
      <div className="flex h-screen items-center justify-center bg-white p-8 text-center dark:bg-slate-950">
        <p className="max-w-md text-sm text-slate-500 dark:text-slate-400">
          Este aplicativo precisa ser aberto pela janela do Electron (não funciona direto num
          navegador comum), pois depende de acesso ao sistema de arquivos do seu PC.
        </p>
      </div>
    );
  }

  const tiposDeVisita = (settings?.tiposDeVisita ?? []).map((t) => t.label);
  const acompanhantePadrao = [settings?.tecnicoNome, settings?.tecnicoEmpresa].filter(Boolean).join(" - ");

  return (
    <div className="flex h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <ThemeToggle theme={theme} onToggle={toggle} />

      {route.name !== "menu" && <BackToMenuBar onClick={() => setRoute({ name: "menu" })} />}

      <div className="flex-1 overflow-y-auto">
        {route.name === "menu" && <MainMenu onOpenAtendimentos={() => setRoute({ name: "home" })} />}

        {route.name === "home" && (
          <Home
            onBack={() => setRoute({ name: "menu" })}
            onOpenCliente={(empresa) => setRoute({ name: "cliente", empresa })}
            onOpenSettings={() => setRoute({ name: "settings" })}
          />
        )}

        {route.name === "cliente" && (
          <Cliente
            empresa={route.empresa}
            tiposDeVisita={tiposDeVisita}
            onBack={() => setRoute({ name: "home" })}
            onOpenVisita={(ref) => setRoute({ name: "visita", ref })}
            onRenamed={(newEmpresa) => setRoute({ name: "cliente", empresa: newEmpresa })}
          />
        )}

        {route.name === "visita" && (
          <Visita
            visitaRef={route.ref}
            acompanhantePadrao={acompanhantePadrao}
            onBack={() => setRoute({ name: "cliente", empresa: route.ref.empresa })}
          />
        )}

        {route.name === "settings" && (
          <Settings onBack={() => setRoute({ name: "home" })} onSettingsChanged={setSettings} />
        )}
      </div>
    </div>
  );
}
