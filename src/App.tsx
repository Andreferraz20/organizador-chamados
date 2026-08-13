import { useEffect, useState } from "react";
import { api } from "./lib/api";
import { Home } from "./pages/Home";
import { Empresa } from "./pages/Empresa";
import { Visita } from "./pages/Visita";
import { Settings } from "./pages/Settings";
import type { AppSettings, VisitaRef } from "./types";

type Route =
  | { name: "home" }
  | { name: "empresa"; empresa: string }
  | { name: "visita"; ref: VisitaRef }
  | { name: "settings" };

export default function App() {
  const [route, setRoute] = useState<Route>({ name: "home" });
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    if (!api) return;
    api.settings.get().then(setSettings);
  }, []);

  if (!api) {
    return (
      <div className="flex h-screen items-center justify-center bg-white p-8 text-center">
        <p className="max-w-md text-sm text-slate-500">
          Este aplicativo precisa ser aberto pela janela do Electron (não funciona direto num
          navegador comum), pois depende de acesso ao sistema de arquivos do seu PC.
        </p>
      </div>
    );
  }

  const tiposDeVisita = settings?.tiposDeVisita ?? [];
  const tecnicoPadrao = settings?.tecnicoNome ?? "";

  return (
    <div className="h-screen bg-white">
      {route.name === "home" && (
        <Home
          onOpenEmpresa={(empresa) => setRoute({ name: "empresa", empresa })}
          onOpenSettings={() => setRoute({ name: "settings" })}
        />
      )}

      {route.name === "empresa" && (
        <Empresa
          empresa={route.empresa}
          tiposDeVisita={tiposDeVisita}
          onBack={() => setRoute({ name: "home" })}
          onOpenVisita={(ref) => setRoute({ name: "visita", ref })}
        />
      )}

      {route.name === "visita" && (
        <Visita
          visitaRef={route.ref}
          tecnicoPadrao={tecnicoPadrao}
          onBack={() => setRoute({ name: "empresa", empresa: route.ref.empresa })}
        />
      )}

      {route.name === "settings" && (
        <Settings onBack={() => setRoute({ name: "home" })} onSettingsChanged={setSettings} />
      )}
    </div>
  );
}
