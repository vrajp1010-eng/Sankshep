import { BarChart3, History, LayoutDashboard, Menu, Settings, X } from "lucide-react";

const NAV = [
  { id: "workspace", label: "Workspace", Icon: LayoutDashboard },
  { id: "history", label: "History", Icon: History },
  { id: "analytics", label: "Analytics", Icon: BarChart3 },
];

export default function Header({
  activeTab,
  onNavigate,
  engineStatus,
  providerLabel,
  modelLabel,
  menuOpen,
  setMenuOpen,
  onOpenSettings,
  onLoadDemo,
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => onNavigate("workspace")}
          className="flex min-w-0 items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-700"
          aria-label="Sankshep.ai home"
        >
          <img src="/sankshep-mark.svg" alt="" className="h-8 w-8 shrink-0 rounded-lg" />
          <span className="truncate font-display text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">
            Sankshep.ai
          </span>
        </button>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
          {NAV.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-700 ${
                activeTab === id
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
              {label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div
            className="hidden max-w-[min(240px,32vw)] items-center gap-2 truncate rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600 md:flex"
            title={modelLabel || providerLabel}
          >
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${engineStatus.online ? "bg-emerald-500" : "bg-rose-500"}`}
              aria-hidden="true"
            />
            <span className="truncate font-medium text-slate-800">
              {providerLabel || engineStatus.engine}
            </span>
            {modelLabel ? <span className="truncate text-slate-500">{modelLabel}</span> : null}
          </div>

          <button
            type="button"
            onClick={onLoadDemo}
            className="hidden rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-700 sm:inline-flex"
          >
            Load demo
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-700"
            aria-label="Settings"
          >
            <Settings className="h-4 w-4" strokeWidth={1.75} />
          </button>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-700 lg:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="h-5 w-5" strokeWidth={1.75} /> : <Menu className="h-5 w-5" strokeWidth={1.75} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 lg:hidden">
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {NAV.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  onNavigate(id);
                  setMenuOpen(false);
                }}
                className={`flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium ${
                  activeTab === id ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                {label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                onLoadDemo();
                setMenuOpen(false);
              }}
              className="flex min-h-11 items-center rounded-xl px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Load demo
            </button>
            <div className="mt-1 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600 md:hidden">
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${engineStatus.online ? "bg-emerald-500" : "bg-rose-500"}`}
                aria-hidden="true"
              />
              <span className="truncate">
                {providerLabel || engineStatus.engine}
                {modelLabel ? ` · ${modelLabel}` : ""}
              </span>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
