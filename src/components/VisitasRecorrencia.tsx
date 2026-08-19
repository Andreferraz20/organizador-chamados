import { useEffect, useState } from "react";
import { api, formatMesNomeOnly } from "../lib/api";
import { EmptyHint } from "./EmptyHint";

interface Props {
  empresa: string;
  tiposDeVisita: string[];
}

interface MesInfo {
  mes: string;
  visitas: { dia: string; tipoVisita: string }[];
}

export function VisitasRecorrencia({ empresa, tiposDeVisita }: Props) {
  const [loading, setLoading] = useState(true);
  const [porMes, setPorMes] = useState<MesInfo[]>([]);
  const [expandido, setExpandido] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const meses = await api.visitas.listMeses(empresa);
      const result: MesInfo[] = [];
      for (const mes of meses) {
        const visitas = await api.visitas.listVisitas(empresa, mes);
        result.push({ mes, visitas });
      }
      if (cancelled) return;
      result.sort((a, b) => b.mes.localeCompare(a.mes));
      setPorMes(result);
      setExpandido(null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [empresa]);

  if (loading) {
    return <p className="text-sm text-slate-400 dark:text-slate-500">Carregando…</p>;
  }

  if (porMes.length === 0) {
    return <EmptyHint text="Nenhuma visita técnica registrada ainda." />;
  }

  const porAno = new Map<string, MesInfo[]>();
  for (const info of porMes) {
    const ano = info.mes.slice(0, 4);
    if (!porAno.has(ano)) porAno.set(ano, []);
    porAno.get(ano)!.push(info);
  }

  return (
    <div className="max-w-2xl space-y-6">
      {Array.from(porAno.entries()).map(([ano, infos]) => (
        <div key={ano}>
          <h3 className="mb-2 text-lg font-semibold text-slate-800 dark:text-slate-100">{ano}</h3>
          <div className="space-y-2">
            {infos.map((info) => {
              const isOpen = expandido === info.mes;
              return (
                <div
                  key={info.mes}
                  className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800"
                >
                  <button
                    onClick={() => setExpandido(isOpen ? null : info.mes)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <span>{formatMesNomeOnly(info.mes)}</span>
                    <span className="text-slate-400 dark:text-slate-500">
                      {info.visitas.length} visita{info.visitas.length !== 1 ? "s" : ""}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="space-y-1.5 border-t border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                      {tiposDeVisita.map((tipo) => {
                        const count = info.visitas.filter((v) => v.tipoVisita === tipo).length;
                        return (
                          <div key={tipo} className="flex items-center justify-between text-sm">
                            <span className="text-slate-600 dark:text-slate-300">{tipo}</span>
                            <span className="text-slate-500 dark:text-slate-400">
                              {count} visita{count !== 1 ? "s" : ""}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
