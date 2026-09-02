interface Props {
  onOpenAtendimentos: () => void;
  onOpenEstoqueTecnico: () => void;
  onOpenAnotacoesTecnicas: () => void;
  onOpenDocumentacao: () => void;
  onOpenSettings: () => void;
}

export function MainMenu({
  onOpenAtendimentos,
  onOpenEstoqueTecnico,
  onOpenAnotacoesTecnicas,
  onOpenDocumentacao,
  onOpenSettings,
}: Props) {
  return (
    <div className="relative flex h-full flex-col items-center justify-center gap-10 p-8">
      <button
        onClick={onOpenSettings}
        title="Ajustes"
        className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100">Área do Técnico</h1>

      <div className="flex flex-col items-center gap-4">
        <div className="flex items-stretch justify-center gap-4">
          <MenuOption label="Atendimentos" onClick={onOpenAtendimentos} />
          <MenuOption label="Estoque Técnico" onClick={onOpenEstoqueTecnico} />
          <MenuOption label="Anotações Técnicas" onClick={onOpenAnotacoesTecnicas} />
        </div>
        <div className="flex items-stretch justify-center gap-4">
          <MenuOption label="Documentação" onClick={onOpenDocumentacao} />
          <MenuOption label="Códigos de Erros" comingSoon />
        </div>
      </div>
    </div>
  );
}

function MenuOption({ label, onClick, comingSoon }: { label: string; onClick?: () => void; comingSoon?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={comingSoon}
      className={`flex w-56 flex-col items-center justify-center gap-2 rounded-xl border px-6 py-10 text-center text-base font-semibold transition ${
        comingSoon
          ? "cursor-default border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-600"
          : "border-slate-200 bg-white text-slate-700 shadow-sm hover:border-blue-400 hover:bg-blue-50 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-500 dark:hover:bg-slate-800"
      }`}
    >
      <span className="uppercase tracking-wide">{label}</span>
      {comingSoon && <span className="text-xs font-normal uppercase tracking-wide">Em breve</span>}
    </button>
  );
}
