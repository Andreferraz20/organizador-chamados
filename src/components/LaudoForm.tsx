import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { api, partsToDate } from "../lib/api";
import { AutoGrowTextarea } from "./AutoGrowTextarea";
import type { LaudoData, VisitaRef } from "../types";

interface Props {
  visitaRef: VisitaRef;
  onDeleted: () => void;
}

export interface LaudoFormHandle {
  /** Salva o rascunho do laudo. Exposto pra permitir salvar mesmo com a aba "Fotos e Vídeos" aberta. */
  save: () => Promise<void>;
}

const EMPTY: Omit<LaudoData, "empresa" | "data" | "tipoVisita" | "geradoEm"> = {
  numeroSerie: "",
  laudoTecnico: "",
  pecasSolicitadas: "",
  materialEstoque: "",
  acompanhante: "",
  testesRealizados: "",
  equipamentoInterditado: "",
  outroEquipamentoProblema: "",
  condicoesOrganizacao: "",
  testeLiberacao: "",
  atualizacaoCadastral: "",
  observacoes: "",
};

type CampoLaudo = keyof typeof EMPTY;

const CAMPOS_AVALIACAO_TECNICA: { key: CampoLaudo; label: string }[] = [
  { key: "numeroSerie", label: "1. Confirmar o número de série dos equipamentos avaliados e a sua sequência." },
  {
    key: "testesRealizados",
    label:
      "2. Descrever os testes e procedimentos realizados, indicar código (PN) das peças danificadas, se houver (anexar foto) e, indicar série do equipamento.",
  },
  {
    key: "materialEstoque",
    label:
      "3. Foi utilizado algum material do estoque técnico? Indicar equipamento (série e posição), código da peça (PN) e quantidade.",
  },
  { key: "equipamentoInterditado", label: "4. Indique série e posição do equipamento interditado (se houver)." },
  {
    key: "condicoesOrganizacao",
    label:
      "5. Indicar as condições de organização e limpeza dos equipamentos e espaço da lavanderia. Foi necessário tomar alguma ação?",
  },
  {
    key: "testeLiberacao",
    label:
      "6. Realizar teste de liberação dos equipamentos (APP/FICHA) a depender da forma de pagamento do cliente e fazer ciclo teste.",
  },
  { key: "acompanhante", label: "7. Indicar nome e cargo de quem acompanhou." },
  {
    key: "atualizacaoCadastral",
    label:
      "8. Atualização cadastral: Indicar nome, cargo e telefone do responsável pela administração do condomínio (Síndico/Gerente Predial)",
  },
  {
    key: "observacoes",
    label: "9. Observações gerais, sugestões e melhorias (Infra/Área Técnica/Identidade Visual e utilização).",
  },
];

const CAMPOS_CORRECAO_TECNICA: { key: CampoLaudo; label: string }[] = [
  { key: "numeroSerie", label: "1. Confirmar o número de série dos equipamentos avaliados e a sua sequência." },
  {
    key: "testesRealizados",
    label:
      "2. Descrever os testes e procedimentos realizados, indicar código (PN) das peças danificadas, se houver (anexar foto) e, indicar série do equipamento.",
  },
  {
    key: "materialEstoque",
    label:
      "3. Foi utilizado algum material do estoque técnico? Indicar equipamento (série e posição), código da peça (PN) e quantidade.",
  },
  {
    key: "outroEquipamentoProblema",
    label: "4. Existe algum outro equipamento com problema no local? Equipamento ficou interditado?",
  },
  {
    key: "condicoesOrganizacao",
    label:
      "5. Indicar as condições de organização e limpeza dos equipamentos e espaço da lavanderia. Foi necessário tomar alguma ação?",
  },
  {
    key: "testeLiberacao",
    label:
      "6. Realizar teste de liberação dos equipamentos (APP/FICHA) a depender da forma de pagamento do cliente e fazer ciclo teste.",
  },
  { key: "acompanhante", label: "7. Indicar nome e cargo de quem acompanhou." },
  {
    key: "atualizacaoCadastral",
    label:
      "8. Atualização cadastral: Indicar nome, cargo e telefone do responsável pela administração do condomínio (Síndico/Gerente Predial)",
  },
  {
    key: "observacoes",
    label: "9. Observações gerais, sugestões e melhorias (Infra/Área Técnica/Identidade Visual e utilização).",
  },
];

const CAMPOS_GENERICOS: { key: CampoLaudo; label: string }[] = [
  { key: "numeroSerie", label: "Número de Série dos Equipamentos" },
  { key: "laudoTecnico", label: "Laudo Técnico" },
  { key: "pecasSolicitadas", label: "Peças Solicitadas" },
  { key: "materialEstoque", label: "Foi utilizado algum material do estoque técnico?" },
  { key: "acompanhante", label: "Dados de quem acompanhou a visita técnica" },
];

function camposPara(tipoVisita: string): { key: CampoLaudo; label: string }[] {
  if (tipoVisita === "Avaliação Técnica") return CAMPOS_AVALIACAO_TECNICA;
  if (tipoVisita === "Correção Técnica") return CAMPOS_CORRECAO_TECNICA;
  return CAMPOS_GENERICOS;
}

export const LaudoForm = forwardRef<LaudoFormHandle, Props>(function LaudoForm({ visitaRef, onDeleted }, ref) {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [savingAction, setSavingAction] = useState<"save" | "generate" | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.laudo.get(visitaRef).then((existing) => {
      if (cancelled) return;
      setForm(
        existing
          ? {
              numeroSerie: existing.numeroSerie ?? "",
              laudoTecnico: existing.laudoTecnico ?? "",
              pecasSolicitadas: existing.pecasSolicitadas ?? "",
              materialEstoque: existing.materialEstoque ?? "",
              acompanhante: existing.acompanhante ?? "",
              testesRealizados: existing.testesRealizados ?? "",
              equipamentoInterditado: existing.equipamentoInterditado ?? "",
              outroEquipamentoProblema: existing.outroEquipamentoProblema ?? "",
              condicoesOrganizacao: existing.condicoesOrganizacao ?? "",
              testeLiberacao: existing.testeLiberacao ?? "",
              atualizacaoCadastral: existing.atualizacaoCadastral ?? "",
              observacoes: existing.observacoes ?? "",
            }
          : EMPTY,
      );
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [visitaRef]);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSavedMessage(null);
  }

  async function persist(generatePdf: boolean) {
    setSavingAction(generatePdf ? "generate" : "save");
    setSavedMessage(null);
    try {
      const data: LaudoData = {
        ...form,
        empresa: visitaRef.empresa,
        data: partsToDate(visitaRef.mes, visitaRef.dia),
        tipoVisita: visitaRef.tipoVisita,
        geradoEm: new Date().toLocaleString("pt-BR"),
      };
      if (generatePdf) {
        const pdfPath = await api.laudo.generate(visitaRef, data);
        await api.arquivos.openFile(pdfPath);
        setSavedMessage("PDF gerado com sucesso.");
      } else {
        await api.laudo.save(visitaRef, data);
        setSavedMessage("Rascunho salvo.");
      }
    } finally {
      setSavingAction(null);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.laudo.delete(visitaRef);
      onDeleted();
    } finally {
      setDeleting(false);
    }
  }

  useImperativeHandle(ref, () => ({
    save: () => persist(false),
  }));

  if (loading) {
    return <p className="text-sm text-slate-400 dark:text-slate-500">Carregando laudo…</p>;
  }

  const fields = camposPara(visitaRef.tipoVisita);

  return (
    <div className="space-y-4">
      {fields.map((f) => (
        <div key={f.key}>
          <label className="mb-1 block text-xs font-medium uppercase text-slate-500 dark:text-slate-400">{f.label}</label>
          <AutoGrowTextarea
            value={form[f.key]}
            onChange={(e) => update(f.key, e.target.value)}
            rows={3}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-600"
          />
        </div>
      ))}

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={() => persist(false)}
          disabled={savingAction !== null}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          {savingAction === "save" ? "Salvando…" : "Salvar"}
        </button>
        <button
          onClick={() => persist(true)}
          disabled={savingAction !== null}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {savingAction === "generate" ? "Gerando…" : "Gerar PDF"}
        </button>
        <button
          onClick={() => setConfirmDelete(true)}
          className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
        >
          Excluir laudo
        </button>
        {savedMessage && <span className="text-sm text-green-600 dark:text-green-400">{savedMessage}</span>}
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-800">
            <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-100">Excluir este laudo?</h3>
            <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
              Isso apaga a visita inteira: fotos, vídeos e o laudo. Não é possível desfazer.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Excluindo…" : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
