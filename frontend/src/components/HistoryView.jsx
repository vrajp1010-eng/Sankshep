import { History, RefreshCw } from "lucide-react";
import { FormatIcon } from "./FormatIcon";
import { OUTPUT_FORMATS } from "../constants";

export default function HistoryView({ history, historyFilter, setHistoryFilter, onRefresh }) {
  const rows = history.filter((row) =>
    row.transformation_type.toLowerCase().includes(historyFilter.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-900 sm:text-3xl">History</h1>
          <p className="mt-1 text-sm text-slate-500">Recent transformations from this workspace.</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <label className="sr-only" htmlFor="history-filter">
            Filter history
          </label>
          <input
            id="history-filter"
            type="search"
            placeholder="Filter by format"
            value={historyFilter}
            onChange={(event) => setHistoryFilter(event.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-700/20 sm:w-56"
          />
          <button type="button" onClick={onRefresh} className="btn-secondary h-11 px-4">
            <RefreshCw className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            Refresh
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
          <History className="mb-3 h-8 w-8 text-slate-300" strokeWidth={1.75} />
          <p className="font-medium text-slate-800">No history yet</p>
          <p className="mt-1 text-sm text-slate-500">Generate content in Workspace to see activity here.</p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white md:block">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Provider / model</th>
                  <th className="px-4 py-3 text-right font-medium">Input</th>
                  <th className="px-4 py-3 text-right font-medium">Output</th>
                  <th className="px-4 py-3 text-right font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row, index) => {
                  const parsed = parseHistoryType(row.transformation_type);
                  return (
                    <tr key={`${row.created_at}-${index}`} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-2 font-medium text-slate-900">
                          <FormatIcon name={parsed.icon} className="h-4 w-4" />
                          {parsed.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{parsed.provider || "—"}</td>
                      <td className="px-4 py-3 text-right text-slate-600">{row.input_words} words</td>
                      <td className="px-4 py-3 text-right font-medium text-slate-900">{row.output_words} words</td>
                      <td className="px-4 py-3 text-right text-slate-500">{row.created_at}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <ul className="grid gap-3 md:hidden">
            {rows.map((row, index) => {
              const parsed = parseHistoryType(row.transformation_type);
              return (
                <li key={`${row.created_at}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex items-center gap-2 font-medium text-slate-900">
                      <FormatIcon name={parsed.icon} className="h-4 w-4" />
                      {parsed.label}
                    </span>
                    <span className="shrink-0 text-right text-xs text-slate-500 whitespace-nowrap">{row.created_at}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{parsed.provider || "Provider not recorded"}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    Input {row.input_words} words · Output {row.output_words} words
                  </p>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

function parseHistoryType(value) {
  const [baseType, provider] = String(value || "").split(":");
  const meta = OUTPUT_FORMATS.find((format) => format.id === baseType);
  return {
    label: meta?.label || baseType,
    icon: meta?.icon || "summary",
    provider: provider || null,
  };
}
