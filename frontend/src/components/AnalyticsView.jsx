import { BarChart3, RefreshCw } from "lucide-react";
import { FormatIcon } from "./FormatIcon";
import { OUTPUT_FORMATS } from "../constants";

export default function AnalyticsView({ analytics, history, providers, onRefresh }) {
  const topFormats = analytics.top_formats || [];
  const maxCount = Math.max(1, ...topFormats.map((item) => item.count || 0));
  const recent = history.slice(0, 6);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-900 sm:text-3xl">Analytics</h1>
          <p className="mt-1 text-sm text-slate-500">Usage across formats, word counts, and recent activity.</p>
        </div>
        <button type="button" onClick={onRefresh} className="btn-secondary h-11 px-4">
          <RefreshCw className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Transformations" value={analytics.total_runs || history.length} />
        <Stat label="Input words" value={(analytics.total_input_words || 0).toLocaleString()} />
        <Stat label="Output words" value={(analytics.total_output_words || 0).toLocaleString()} />
        <Stat
          label="Available providers"
          value={providers.filter((provider) => provider.available).length}
          hint={providers.filter((provider) => provider.available).map((provider) => provider.label).join(", ") || "None configured"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 flex items-center gap-2 font-display text-sm font-semibold text-slate-900">
            <BarChart3 className="h-4 w-4 text-primary-700" strokeWidth={1.75} aria-hidden="true" />
            Most-used formats
          </h2>
          {topFormats.length === 0 ? (
            <p className="text-sm text-slate-500">No usage data yet.</p>
          ) : (
            <ul className="space-y-3">
              {topFormats.map((item) => {
                const baseType = String(item.type || "").split(":")[0];
                const meta = OUTPUT_FORMATS.find((format) => format.id === baseType);
                const width = `${Math.max(8, ((item.count || 0) / maxCount) * 100)}%`;
                return (
                  <li key={item.type}>
                    <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                      <span className="inline-flex min-w-0 items-center gap-2 font-medium text-slate-800">
                        <FormatIcon name={meta?.icon || "summary"} className="h-4 w-4" />
                        <span className="truncate">{meta?.label || baseType}</span>
                      </span>
                      <span className="text-xs text-slate-500">{item.count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-primary-700" style={{ width }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 font-display text-sm font-semibold text-slate-900">Recent activity</h2>
          {recent.length === 0 ? (
            <p className="text-sm text-slate-500">Generate content to populate this list.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recent.map((row, index) => {
                const baseType = String(row.transformation_type || "").split(":")[0];
                const meta = OUTPUT_FORMATS.find((format) => format.id === baseType);
                return (
                  <li key={`${row.created_at}-${index}`} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <span className="inline-flex min-w-0 items-center gap-2 text-sm text-slate-800">
                      <FormatIcon name={meta?.icon || "summary"} className="h-4 w-4" />
                      <span className="truncate">{meta?.label || baseType}</span>
                    </span>
                    <span className="shrink-0 text-xs text-slate-500">{row.created_at}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
      {hint ? <p className="mt-2 truncate text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}
