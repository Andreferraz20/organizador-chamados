import { ipcMain } from "electron";
import fs from "node:fs/promises";
import path from "node:path";
import React from "react";
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { ensureRootFolder, visitaPath } from "./fs-ops";

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
  equipamento: string;
  problemaRelatado: string;
  diagnostico: string;
  servicoExecutado: string;
  pecasTrocadas: string;
  observacoes: string;
  tecnicoResponsavel: string;
  geradoEm: string;
}

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: "Helvetica" },
  title: { fontSize: 18, marginBottom: 4, fontFamily: "Helvetica-Bold" },
  subtitle: { fontSize: 11, marginBottom: 20, color: "#555555" },
  section: { marginBottom: 14 },
  label: { fontSize: 9, color: "#777777", marginBottom: 2, textTransform: "uppercase" },
  value: { fontSize: 11, marginBottom: 2 },
  row: { flexDirection: "row", marginBottom: 14, gap: 24 },
  col: { flex: 1 },
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

function LaudoDocument({ data }: { data: LaudoData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Laudo Técnico</Text>
        <Text style={styles.subtitle}>
          {data.empresa} — {data.data} — {data.tipoVisita}
        </Text>

        <View style={styles.row}>
          <View style={styles.col}>
            <Field label="Equipamento" value={data.equipamento} />
          </View>
          <View style={styles.col}>
            <Field label="Técnico Responsável" value={data.tecnicoResponsavel} />
          </View>
        </View>

        <Field label="Problema Relatado" value={data.problemaRelatado} />
        <Field label="Diagnóstico" value={data.diagnostico} />
        <Field label="Serviço Executado" value={data.servicoExecutado} />
        <Field label="Peças Trocadas" value={data.pecasTrocadas} />
        <Field label="Observações" value={data.observacoes} />

        <Text style={styles.footer}>Gerado em {data.geradoEm}</Text>
      </Page>
    </Document>
  );
}

export function registerPdfHandlers(): void {
  ipcMain.handle("laudo:generate", async (_event, ref: VisitaRef, data: LaudoData) => {
    const root = await ensureRootFolder();
    const laudoDir = path.join(visitaPath(root, ref), "laudo");
    await fs.mkdir(laudoDir, { recursive: true });

    const jsonPath = path.join(laudoDir, "laudo.json");
    await fs.writeFile(jsonPath, JSON.stringify(data, null, 2), "utf-8");

    const pdfPath = path.join(laudoDir, "laudo.pdf");
    const buffer = await renderToBuffer(<LaudoDocument data={data} />);
    await fs.writeFile(pdfPath, buffer);

    return pdfPath;
  });
}
