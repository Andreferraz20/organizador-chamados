import { useCallback, useEffect, useState } from "react";
import { api, toMediaUrl } from "../lib/api";
import type { FileEntry, VisitaRef } from "../types";

const THUMB_SIZE_KEY = "organizador-chamados:thumb-size";
const MIN_THUMB = 80;
const MAX_THUMB = 260;

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isVideo(mimeType: string): boolean {
  return mimeType.startsWith("video/");
}

function loadThumbSize(): number {
  const stored = Number(localStorage.getItem(THUMB_SIZE_KEY));
  return stored >= MIN_THUMB && stored <= MAX_THUMB ? stored : 140;
}

interface Props {
  visitaRef: VisitaRef;
}

interface ContextMenuState {
  file: FileEntry;
  x: number;
  y: number;
}

export function FileDropzone({ visitaRef }: Props) {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [thumbSize, setThumbSize] = useState(loadThumbSize);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const refresh = useCallback(async () => {
    const list = await api.arquivos.list(visitaRef);
    setFiles(list);
  }, [visitaRef]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    localStorage.setItem(THUMB_SIZE_KEY, String(thumbSize));
  }, [thumbSize]);

  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener("click", close);
    window.addEventListener("contextmenu", close);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("contextmenu", close);
    };
  }, [contextMenu]);

  async function addPaths(paths: string[]) {
    if (paths.length === 0) return;
    setBusy(true);
    try {
      const updated = await api.arquivos.add(visitaRef, paths);
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
    const paths = await api.arquivos.pickFiles();
    addPaths(paths);
  }

  async function handleRemove(fileName: string) {
    await api.arquivos.remove(visitaRef, fileName);
    refresh();
  }

  const fotos = files.filter((f) => !isVideo(f.mimeType));
  const videos = files.filter((f) => isVideo(f.mimeType));

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
          isDragging
            ? "border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/30"
            : "border-slate-300 hover:border-slate-400 dark:border-slate-700 dark:hover:border-slate-600"
        }`}
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Arraste fotos ou vídeos aqui ou <span className="text-blue-600 underline dark:text-blue-400">clique para selecionar</span>
        </p>
        {busy && <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Copiando arquivos…</p>}
      </div>

      {files.length > 0 && (
        <div className="mt-4 flex items-center gap-2">
          <label className="text-xs text-slate-500 dark:text-slate-400">Tamanho do preview</label>
          <input
            type="range"
            min={MIN_THUMB}
            max={MAX_THUMB}
            step={10}
            value={thumbSize}
            onChange={(e) => setThumbSize(Number(e.target.value))}
            className="w-40"
          />
        </div>
      )}

      {files.length > 0 ? (
        <div className="mt-3 grid grid-cols-2 divide-x divide-slate-200 rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
          <MediaColumn
            title="Fotos"
            files={fotos}
            thumbSize={thumbSize}
            onOpen={(f) => api.arquivos.openFile(f.path)}
            onContextMenu={(f, e) => setContextMenu({ file: f, x: e.clientX, y: e.clientY })}
            onRemove={handleRemove}
          />
          <MediaColumn
            title="Vídeos"
            files={videos}
            thumbSize={thumbSize}
            onOpen={(f) => api.arquivos.openFile(f.path)}
            onContextMenu={(f, e) => setContextMenu({ file: f, x: e.clientX, y: e.clientY })}
            onRemove={handleRemove}
          />
        </div>
      ) : (
        <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">Nenhum arquivo ainda.</p>
      )}

      {contextMenu && (
        <div
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed z-50 w-52 overflow-hidden rounded-md border border-slate-200 bg-white py-1 text-sm shadow-lg dark:border-slate-700 dark:bg-slate-800"
        >
          <button
            onClick={() => api.arquivos.openFile(contextMenu.file.path)}
            className="block w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Abrir
          </button>
          <button
            onClick={() => api.arquivos.showInFolder(contextMenu.file.path)}
            className="block w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Ver local do arquivo
          </button>
          <button
            onClick={() => handleRemove(contextMenu.file.name)}
            className="block w-full px-3 py-1.5 text-left text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
          >
            Remover
          </button>
        </div>
      )}
    </div>
  );
}

function MediaColumn({
  title,
  files,
  thumbSize,
  onOpen,
  onContextMenu,
  onRemove,
}: {
  title: string;
  files: FileEntry[];
  thumbSize: number;
  onOpen: (file: FileEntry) => void;
  onContextMenu: (file: FileEntry, e: React.MouseEvent) => void;
  onRemove: (fileName: string) => void;
}) {
  return (
    <div className="p-3">
      <h3 className="mb-2 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
        {title} ({files.length})
      </h3>
      {files.length === 0 ? (
        <p className="text-xs text-slate-400 dark:text-slate-500">
          {title === "Fotos" ? "Nenhuma foto ainda." : "Nenhum vídeo ainda."}
        </p>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${thumbSize}px, 1fr))` }}>
          {files.map((f) => (
            <div
              key={f.name}
              onDoubleClick={() => onOpen(f)}
              onContextMenu={(e) => {
                e.preventDefault();
                onContextMenu(f, e);
              }}
              title={f.name}
              className="group relative cursor-pointer overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900"
              style={{ aspectRatio: "1 / 1" }}
            >
              {isVideo(f.mimeType) ? (
                <video src={toMediaUrl(f.path)} muted preload="metadata" className="h-full w-full object-cover" />
              ) : (
                <img src={toMediaUrl(f.path)} loading="lazy" className="h-full w-full object-cover" />
              )}

              {isVideo(f.mimeType) && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/50">
                    <svg viewBox="0 0 24 24" fill="white" className="ml-0.5 h-4 w-4">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              )}

              <div className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-2 py-1 text-[11px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                {f.name} · {formatSize(f.sizeBytes)}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(f.name);
                }}
                title="Remover"
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition hover:bg-red-600 group-hover:opacity-100"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
