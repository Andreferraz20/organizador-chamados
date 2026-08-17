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

/** Sugestão de sigla pra pasta a partir do nome do tipo de visita (ex: "Troca de Bomba" -> "TROCADEBOMBA"). */
export function suggestSigla(label: string): string {
  const normalized = label
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();
  return normalized.slice(0, 14);
}

/** URL pro protocolo customizado "media://" que exibe previews de arquivos locais. */
export function toMediaUrl(filePath: string): string {
  const encoded = filePath
    .replace(/\\/g, "/")
    .split("/")
    .map(encodeURIComponent)
    .join("/");
  return `media:///${encoded}`;
}
