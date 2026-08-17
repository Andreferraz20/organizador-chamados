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
  geradoEm: string;
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

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value || "-"}</Text>
    </View>
  );
}

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

        <MultilineField label="Número de Série dos Equipamentos" value={data.numeroSerie} />
        <MultilineField label="Laudo Técnico" value={data.laudoTecnico} />
        <MultilineField label="Peças Solicitadas" value={data.pecasSolicitadas} />
        <MultilineField label="Foi utilizado algum material do estoque técnico?" value={data.materialEstoque} />
        <Field label="Dados de quem acompanhou a visita técnica" value={data.acompanhante} />

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
