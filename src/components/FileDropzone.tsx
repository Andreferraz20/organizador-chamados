import { useCallback, useEffect, useRef, useState } from "react";
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

/** Separa nome-base e extensão (com o ponto), pra manter a extensão fixa ao renomear. */
function splitExt(fileName: string): { base: string; ext: string } {
  const dot = fileName.lastIndexOf(".");
  if (dot <= 0) return { base: fileName, ext: "" };
  return { base: fileName.slice(0, dot), ext: fileName.slice(dot) };
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
  const [renameTarget, setRenameTarget] = useState<FileEntry | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameError, setRenameError] = useState<string | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

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
    setSelected(new Set());
    refresh();
  }

  function selectOnly(path: string) {
    setSelected(new Set([path]));
  }

  function toggleSelect(path: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

  function setMarqueeSelection(paths: string[]) {
    setSelected(new Set(paths));
  }

  function startDragSelection(path: string) {
    const paths = selected.has(path) && selected.size > 1 ? Array.from(selected) : [path];
    if (!selected.has(path)) selectOnly(path);
    api.arquivos.startDrag(paths);
  }

  function openRename(file: FileEntry) {
    setRenameTarget(file);
    setRenameValue(splitExt(file.name).base);
    setRenameError(null);
  }

  async function confirmRename() {
    if (!renameTarget) return;
    const { ext } = splitExt(renameTarget.name);
    const newName = renameValue.trim();
    if (!newName) return;
    setRenaming(true);
    setRenameError(null);
    try {
      await api.arquivos.rename(visitaRef, renameTarget.name, `${newName}${ext}`);
      setRenameTarget(null);
      setSelected(new Set());
      refresh();
    } catch (error) {
      setRenameError(error instanceof Error ? error.message : "Não foi possível renomear.");
    } finally {
      setRenaming(false);
    }
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
        <div className="mt-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
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
          {selected.size > 0 ? (
            <span className="text-xs text-blue-600 dark:text-blue-400">
              {selected.size} selecionado{selected.size > 1 ? "s" : ""} — arraste para enviar
            </span>
          ) : (
            <span className="text-xs text-slate-400 dark:text-slate-500">
              Arraste sobre as fotos pra selecionar várias
            </span>
          )}
        </div>
      )}

      {files.length > 0 ? (
        <div className="mt-3 grid grid-cols-2 divide-x divide-slate-200 rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
          <MediaColumn
            title="Fotos"
            files={fotos}
            thumbSize={thumbSize}
            selected={selected}
            onOpen={(f) => api.arquivos.openFile(f.path)}
            onContextMenu={(f, e) => setContextMenu({ file: f, x: e.clientX, y: e.clientY })}
            onRemove={handleRemove}
            onSelectOnly={selectOnly}
            onToggleSelect={toggleSelect}
            onMarqueeSelect={setMarqueeSelection}
            onClearSelection={() => setSelected(new Set())}
            onStartDrag={startDragSelection}
          />
          <MediaColumn
            title="Vídeos"
            files={videos}
            thumbSize={thumbSize}
            selected={selected}
            onOpen={(f) => api.arquivos.openFile(f.path)}
            onContextMenu={(f, e) => setContextMenu({ file: f, x: e.clientX, y: e.clientY })}
            onRemove={handleRemove}
            onSelectOnly={selectOnly}
            onToggleSelect={toggleSelect}
            onMarqueeSelect={setMarqueeSelection}
            onClearSelection={() => setSelected(new Set())}
            onStartDrag={startDragSelection}
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
            onClick={() => openRename(contextMenu.file)}
            className="block w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Renomear
          </button>
          <button
            onClick={() => api.arquivos.showInFolder(contextMenu.file.path)}
            className="block w-full px-3 py-1.5 text-left text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Abrir local do arquivo
          </button>
          <button
            onClick={() => handleRemove(contextMenu.file.name)}
            className="block w-full px-3 py-1.5 text-left text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
          >
            Remover
          </button>
        </div>
      )}

      {renameTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-800">
            <h3 className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">Renomear arquivo</h3>
            <div className="flex items-center gap-1">
              <input
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && confirmRename()}
                className="min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
              <span className="shrink-0 text-sm text-slate-500 dark:text-slate-400">{splitExt(renameTarget.name).ext}</span>
            </div>
            {renameError && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{renameError}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setRenameTarget(null)}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                onClick={confirmRename}
                disabled={renaming || !renameValue.trim()}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {renaming ? "Renomeando…" : "Renomear"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface Marquee {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

function MediaColumn({
  title,
  files,
  thumbSize,
  selected,
  onOpen,
  onContextMenu,
  onRemove,
  onSelectOnly,
  onToggleSelect,
  onMarqueeSelect,
  onClearSelection,
  onStartDrag,
}: {
  title: string;
  files: FileEntry[];
  thumbSize: number;
  selected: Set<string>;
  onOpen: (file: FileEntry) => void;
  onContextMenu: (file: FileEntry, e: React.MouseEvent) => void;
  onRemove: (fileName: string) => void;
  onSelectOnly: (path: string) => void;
  onToggleSelect: (path: string) => void;
  onMarqueeSelect: (paths: string[]) => void;
  onClearSelection: () => void;
  onStartDrag: (path: string) => void;
}) {
  const gridRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [marquee, setMarquee] = useState<Marquee | null>(null);

  function handleGridMouseDown(e: React.MouseEvent) {
    if (e.button !== 0 || e.target !== gridRef.current) return;
    const container = gridRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;
    let moved = false;
    setMarquee({ x0: startX, y0: startY, x1: startX, y1: startY });

    function handleMove(ev: MouseEvent) {
      const curX = ev.clientX - rect.left;
      const curY = ev.clientY - rect.top;
      if (Math.abs(curX - startX) > 3 || Math.abs(curY - startY) > 3) moved = true;
      setMarquee({ x0: startX, y0: startY, x1: curX, y1: curY });

      const selLeft = Math.min(startX, curX) + rect.left;
      const selRight = Math.max(startX, curX) + rect.left;
      const selTop = Math.min(startY, curY) + rect.top;
      const selBottom = Math.max(startY, curY) + rect.top;
      const hits: string[] = [];
      itemRefs.current.forEach((el, path) => {
        const r = el.getBoundingClientRect();
        if (r.left < selRight && r.right > selLeft && r.top < selBottom && r.bottom > selTop) {
          hits.push(path);
        }
      });
      onMarqueeSelect(hits);
    }

    function handleUp() {
      if (!moved) onClearSelection();
      setMarquee(null);
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    }

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
  }

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
        <div
          ref={gridRef}
          onMouseDown={handleGridMouseDown}
          className="relative grid select-none gap-3"
          style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${thumbSize}px, 1fr))` }}
        >
          {files.map((f) => {
            const isSelected = selected.has(f.path);
            return (
            <div
              key={f.name}
              ref={(el) => {
                if (el) itemRefs.current.set(f.path, el);
                else itemRefs.current.delete(f.path);
              }}
              draggable
              onMouseDown={(e) => {
                if (e.shiftKey || e.metaKey || e.ctrlKey) {
                  onToggleSelect(f.path);
                } else if (!isSelected) {
                  onSelectOnly(f.path);
                }
              }}
              onDragStart={(e) => {
                e.preventDefault();
                onStartDrag(f.path);
              }}
              onDoubleClick={() => onOpen(f)}
              onContextMenu={(e) => {
                e.preventDefault();
                onContextMenu(f, e);
              }}
              title={f.name}
              className={`group relative cursor-pointer overflow-hidden rounded-lg border bg-slate-100 dark:bg-slate-900 ${
                isSelected
                  ? "border-blue-500 ring-2 ring-blue-400"
                  : "border-slate-200 dark:border-slate-800"
              }`}
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
            );
          })}
          {marquee && (
            <div
              className="pointer-events-none absolute z-10 border border-blue-500 bg-blue-500/20"
              style={{
                left: Math.min(marquee.x0, marquee.x1),
                top: Math.min(marquee.y0, marquee.y1),
                width: Math.abs(marquee.x1 - marquee.x0),
                height: Math.abs(marquee.y1 - marquee.y0),
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
