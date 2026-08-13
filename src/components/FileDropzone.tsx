import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";
import type { FileEntry, VisitaRef } from "../types";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface Props {
  visitaRef: VisitaRef;
  categoria: "fotos" | "videos";
  label: string;
}

export function FileDropzone({ visitaRef, categoria, label }: Props) {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const list = await api.arquivos.list(visitaRef, categoria);
    setFiles(list);
  }, [visitaRef, categoria]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function addPaths(paths: string[]) {
    if (paths.length === 0) return;
    setBusy(true);
    try {
      const updated = await api.arquivos.add(visitaRef, categoria, paths);
      setFiles(updated);
    } finally {
      setBusy(false);
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const paths = Array.from(e.dataTransfer.files)
      .map((f) => (f as File & { path?: string }).path)
      .filter((p): p is string => Boolean(p));
    addPaths(paths);
  }

  async function handlePick() {
    const paths = await api.arquivos.pickFiles(categoria);
    addPaths(paths);
  }

  async function handleRemove(fileName: string) {
    await api.arquivos.remove(visitaRef, categoria, fileName);
    refresh();
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={handlePick}
        className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
          isDragging ? "border-blue-500 bg-blue-50" : "border-slate-300 hover:border-slate-400"
        }`}
      >
        <p className="text-sm text-slate-600">
          Arraste {label.toLowerCase()} aqui ou <span className="text-blue-600 underline">clique para selecionar</span>
        </p>
        {busy && <p className="mt-1 text-xs text-slate-400">Copiando arquivos…</p>}
      </div>

      {files.length > 0 && (
        <ul className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-200">
          {files.map((f) => (
            <li key={f.name} className="flex items-center justify-between px-3 py-2 text-sm">
              <span className="truncate text-slate-700">{f.name}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">{formatSize(f.sizeBytes)}</span>
                <button
                  onClick={() => handleRemove(f.name)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  remover
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {files.length === 0 && (
        <p className="mt-2 text-xs text-slate-400">Nenhum arquivo ainda.</p>
      )}
    </div>
  );
}
