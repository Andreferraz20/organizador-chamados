import type { VisitaRef } from "../types";

export const api = window.app;

export function todayParts(): { mes: string; dia: string } {
  const now = new Date();
  const ano = now.getFullYear();
  const mes = String(now.getMonth() + 1).padStart(2, "0");
  const dia = String(now.getDate()).padStart(2, "0");
  return { mes: `${ano}-${mes}`, dia };
}

export function dateToParts(isoDate: string): { mes: string; dia: string } {
  const [ano, mes, dia] = isoDate.split("-");
  return { mes: `${ano}-${mes}`, dia };
}

export function partsToDate(mes: string, dia: string): string {
  return `${mes}-${dia}`;
}

export function formatMesLabel(mes: string): string {
  const [ano, mesNum] = mes.split("-");
  const meses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];
  const index = Number(mesNum) - 1;
  return `${meses[index] ?? mesNum} ${ano}`;
}

export function visitaLabel(ref: VisitaRef): string {
  return `${ref.dia}/${ref.mes} — ${ref.tipoVisita}`;
}
