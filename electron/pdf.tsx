import { ipcMain } from "electron";
import fs from "node:fs/promises";
import path from "node:path";
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { ensureContext, visitaPath } from "./fs-ops";

interface VisitaRef {
  empresa: string;
  mes: string;
  dia: string;
  tipoVisita: string;
}

interface LaudoData {
  empresa: string;
  data: string;
  tipoVisita: string;
  numeroSerie: string;
  laudoTecnico: string;
  pecasSolicitadas: string;
  materialEstoque: string;
  acompanhante: string;
  testesRealizados: string;
  equipamentoInterditado: string;
  outroEquipamentoProblema: string;
  condicoesOrganizacao: string;
  testeLiberacao: string;
  atualizacaoCadastral: string;
  observacoes: string;
  geradoEm: string;
}

type CampoLaudo = keyof Omit<LaudoData, "empresa" | "data" | "tipoVisita" | "geradoEm">;

const CAMPOS_AVALIACAO_TECNICA: { key: CampoLaudo; label: string }[] = [
  { key: "numeroSerie", label: "Confirmar o número de série dos equipamentos avaliados e a sua sequência." },
  {
    key: "testesRealizados",
    label:
      "Descrever os testes e procedimentos realizados, indicar código (PN) das peças danificadas, se houver (anexar foto) e, indicar série do equipamento.",
  },
  {
    key: "materialEstoque",
    label:
      "Foi utilizado algum material do estoque técnico? Indicar equipamento (série e posição), código da peça (PN) e quantidade.",
  },
  { key: "equipamentoInterditado", label: "Indique série e posição do equipamento interditado (se houver)." },
  {
    key: "condicoesOrganizacao",
    label:
      "Indicar as condições de organização e limpeza dos equipamentos e espaço da lavanderia. Foi necessário tomar alguma ação?",
  },
  {
    key: "testeLiberacao",
    label:
      "Realizar teste de liberação dos equipamentos (APP/FICHA) a depender da forma de pagamento do cliente e fazer ciclo teste.",
  },
  { key: "acompanhante", label: "Indicar nome e cargo de quem acompanhou." },
  {
    key: "atualizacaoCadastral",
    label:
      "Atualização cadastral: Indicar nome, cargo e telefone do responsável pela administração do condomínio (Síndico/Gerente Predial)",
  },
  {
    key: "observacoes",
    label: "Observações gerais, sugestões e melhorias (Infra/Área Técnica/Identidade Visual e utilização).",
  },
];

const CAMPOS_CORRECAO_TECNICA: { key: CampoLaudo; label: string }[] = [
  { key: "numeroSerie", label: "Confirmar o número de série dos equipamentos avaliados e a sua sequência." },
  {
    key: "testesRealizados",
    label:
      "Descrever os testes e procedimentos realizados, indicar código (PN) das peças danificadas, se houver (anexar foto) e, indicar série do equipamento.",
  },
  {
    key: "materialEstoque",
    label:
      "Foi utilizado algum material do estoque técnico? Indicar equipamento (série e posição), código da peça (PN) e quantidade.",
  },
  {
    key: "outroEquipamentoProblema",
    label: "Existe algum outro equipamento com problema no local? Equipamento ficou interditado?",
  },
  {
    key: "condicoesOrganizacao",
    label:
      "Indicar as condições de organização e limpeza dos equipamentos e espaço da lavanderia. Foi necessário tomar alguma ação?",
  },
  {
    key: "testeLiberacao",
    label:
      "Realizar teste de liberação dos equipamentos (APP/FICHA) a depender da forma de pagamento do cliente e fazer ciclo teste.",
  },
  { key: "acompanhante", label: "Indicar nome e cargo de quem acompanhou." },
  {
    key: "atualizacaoCadastral",
    label:
      "Atualização cadastral: Indicar nome, cargo e telefone do responsável pela administração do condomínio (Síndico/Gerente Predial)",
  },
  {
    key: "observacoes",
    label: "Observações gerais, sugestões e melhorias (Infra/Área Técnica/Identidade Visual e utilização).",
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

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: "Helvetica" },
  title: { fontSize: 18, marginBottom: 4, fontFamily: "Helvetica-Bold" },
  subtitle: { fontSize: 11, marginBottom: 20, color: "#555555" },
  section: { marginBottom: 14 },
  label: { fontSize: 9, color: "#777777", marginBottom: 2, textTransform: "uppercase" },
  value: { fontSize: 11, marginBottom: 2 },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, fontSize: 8, color: "#999999" },
});

function MultilineField({ label, value }: { label: string; value: string }) {
  const lines = value ? value.split("\n") : ["-"];
  return (
    <View style={styles.section}>
      <Text style={styles.label}>{label}</Text>
      {lines.map((line, i) => (
        <Text key={i} style={styles.value}>
          {line || " "}
        </Text>
      ))}
    </View>
  );
}

function LaudoDocument({ data }: { data: LaudoData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Laudo Técnico</Text>
        <Text style={styles.subtitle}>
          {data.empresa} — {data.data} — {data.tipoVisita}
        </Text>

        {camposPara(data.tipoVisita).map((f) => (
          <MultilineField key={f.key} label={f.label} value={data[f.key]} />
        ))}

        <Text style={styles.footer}>Gerado em {data.geradoEm}</Text>
      </Page>
    </Document>
  );
}

export function registerPdfHandlers(): void {
  ipcMain.handle("laudo:generate", async (_event, ref: VisitaRef, data: LaudoData) => {
    const { root, tiposDeVisita } = await ensureContext();
    const laudoDir = path.join(visitaPath(root, ref, tiposDeVisita), "laudo");
    await fs.mkdir(laudoDir, { recursive: true });

    const jsonPath = path.join(laudoDir, "laudo.json");
    await fs.writeFile(jsonPath, JSON.stringify(data, null, 2), "utf-8");

    const pdfPath = path.join(laudoDir, "laudo.pdf");
    const buffer = await renderToBuffer(<LaudoDocument data={data} />);
    await fs.writeFile(pdfPath, buffer);

    return pdfPath;
  });
}
