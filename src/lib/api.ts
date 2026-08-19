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

const NOMES_MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export function formatMesLabel(mes: string): string {
  const [ano, mesNum] = mes.split("-");
  const index = Number(mesNum) - 1;
  return `${NOMES_MESES[index] ?? mesNum} ${ano}`;
}

/** Só o nome do mês, sem o ano (pra quando o ano já aparece como cabeçalho do grupo). */
export function formatMesNomeOnly(mes: string): string {
  const [, mesNum] = mes.split("-");
  const index = Number(mesNum) - 1;
  return NOMES_MESES[index] ?? mesNum;
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

/**
 * URL pro protocolo customizado "media://" que exibe previews de arquivos locais.
 * O caminho vai inteiro num query param (não no path da URL) porque o parser de
 * URL do Chromium não dá o mesmo tratamento de "host vazio" que dá pro file://,
 * e acaba lendo o primeiro pedaço do caminho (ex: "C:") como host.
 */
export function toMediaUrl(filePath: string): string {
  return `media://local/?path=${encodeURIComponent(filePath)}`;
}
