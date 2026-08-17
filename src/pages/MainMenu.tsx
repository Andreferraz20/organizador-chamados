interface Props {
  onOpenAtendimentos: () => void;
}

export function MainMenu({ onOpenAtendimentos }: Props) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-10 p-8">
      <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100">Área do Técnico</h1>
      <div className="flex flex-wrap items-stretch justify-center gap-4">
        <MenuOption label="Atendimentos" onClick={onOpenAtendimentos} />
        <MenuOption label="Estoque Técnico" comingSoon />
        <MenuOption label="Pedido de Ferramentas" comingSoon />
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
      <span>{label}</span>
      {comingSoon && <span className="text-xs font-normal uppercase tracking-wide">Em breve</span>}
    </button>
  );
}
