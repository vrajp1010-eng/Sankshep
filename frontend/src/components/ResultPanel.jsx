import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Download,
  Edit3,
  FileOutput,
  LoaderCircle,
  Presentation,
  RefreshCw,
  Square,
  Volume2,
} from "lucide-react";
import { FormatIcon } from "./FormatIcon";
import { OUTPUT_FORMATS } from "../constants";

function EmptyState({ compare }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-primary-700 shadow-sm">
        <FormatIcon name="summary" className="h-5 w-5" />
      </div>
      <h3 className="font-display text-lg font-semibold text-slate-900">
        {compare ? "Ready to compare" : "Generated results"}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">
        {compare
          ? "Choose two providers, then compare to review outputs side by side."
          : "Add a source, choose an output, and generate to see your document here."}
      </p>
    </div>
  );
}

function LoadingState({ label }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <LoaderCircle className="mb-4 h-8 w-8 animate-spin text-primary-700" strokeWidth={1.75} />
      <p className="font-display text-base font-semibold text-slate-900">Generating your content...</p>
      {label ? <p className="mt-1 text-sm text-slate-500">{label}</p> : null}
    </div>
  );
}

export default function ResultPanel({
  generationMode,
  selectedFormats,
  activeOutputFormat,
  setActiveOutputFormat,
  setIsEditingOutput,
  results,
  compareResults,
  isGenerating,
  generatingFormat,
  currentOutputText,
  outputWordCount,
  inputWordCount,
  isEditingOutput,
  editedOutput,
  setEditedOutput,
  setResults,
  speaking,
  pptxLoading,
  providers,
  selectedProvider,
  selectedProviders,
  speakText,
  handleCopyText,
  handleDownloadOutput,
  handleDownloadPptx,
  handleTransform,
  showToast,
}) {
  const currentFormatMeta = OUTPUT_FORMATS.find((format) => format.id === activeOutputFormat);
  const currentCompareList = compareResults[activeOutputFormat] || [];
  const providerMeta = providers.find((provider) => provider.id === selectedProvider);

  return (
    <section className="flex min-h-[520px] min-w-0 flex-1 flex-col">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-sm font-semibold text-slate-900">Generated results</h2>
        {generationMode === "single" && outputWordCount > 0 ? (
          <p className="text-xs text-slate-500">
            {outputWordCount} words
            {inputWordCount > 0
              ? ` · ${
                  outputWordCount < inputWordCount
                    ? `${Math.round((1 - outputWordCount / inputWordCount) * 100)}% shorter`
                    : `${Math.round((outputWordCount / inputWordCount - 1) * 100)}% longer`
                }`
              : ""}
          </p>
        ) : null}
      </div>

      {selectedFormats.length > 0 ? (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {selectedFormats.map((formatId) => {
            const meta = OUTPUT_FORMATS.find((format) => format.id === formatId);
            const hasResult =
              generationMode === "single"
                ? Boolean(results[formatId])
                : Boolean(compareResults[formatId]?.length);
            const current = activeOutputFormat === formatId;
            return (
              <button
                key={formatId}
                type="button"
                onClick={() => {
                  setActiveOutputFormat(formatId);
                  setIsEditingOutput(false);
                }}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-700 ${
                  current
                    ? "border-slate-900 bg-slate-900 text-white"
                    : hasResult
                      ? "border-slate-200 bg-white text-slate-800"
                      : "border-slate-200 bg-slate-50 text-slate-500"
                }`}
              >
                <FormatIcon name={meta?.icon} className="h-3.5 w-3.5" />
                {meta?.label}
              </button>
            );
          })}
        </div>
      ) : null}

      {generationMode === "single" && currentOutputText ? (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <FormatIcon name={currentFormatMeta?.icon} className="h-4 w-4 shrink-0" />
            <span className="truncate text-sm font-semibold text-slate-900">{currentFormatMeta?.label}</span>
            <span className="hidden text-xs text-slate-500 sm:inline">
              {providerMeta?.label || selectedProvider}
              {providerMeta?.model ? ` · ${providerMeta.model}` : ""}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <IconButton
              label={speaking ? "Stop listening" : "Listen"}
              onClick={() => speakText(isEditingOutput ? editedOutput : currentOutputText)}
            >
              {speaking ? <Square className="h-4 w-4" strokeWidth={1.75} /> : <Volume2 className="h-4 w-4" strokeWidth={1.75} />}
            </IconButton>
            {activeOutputFormat === "text_to_slides" ? (
              <button type="button" onClick={() => handleDownloadPptx(currentOutputText)} disabled={pptxLoading} className="btn-secondary h-9 px-3 text-xs">
                {pptxLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Presentation className="h-4 w-4" strokeWidth={1.75} />}
                Export
              </button>
            ) : null}
            <IconButton label="Copy" onClick={() => handleCopyText(isEditingOutput ? editedOutput : currentOutputText)}>
              <Copy className="h-4 w-4" strokeWidth={1.75} />
            </IconButton>
            <IconButton label="Download" onClick={() => handleDownloadOutput(isEditingOutput ? editedOutput : currentOutputText, "Sankshep", "md")}>
              <Download className="h-4 w-4" strokeWidth={1.75} />
            </IconButton>
            <IconButton
              label={isEditingOutput ? "Save edits" : "Edit"}
              onClick={() => {
                if (!isEditingOutput) {
                  setEditedOutput(currentOutputText);
                } else {
                  setResults((prev) => ({ ...prev, [activeOutputFormat]: editedOutput }));
                  showToast("Draft updated");
                }
                setIsEditingOutput(!isEditingOutput);
              }}
            >
              {isEditingOutput ? <CheckCircle2 className="h-4 w-4" strokeWidth={1.75} /> : <Edit3 className="h-4 w-4" strokeWidth={1.75} />}
            </IconButton>
            <IconButton label="Regenerate" onClick={handleTransform} disabled={isGenerating}>
              <RefreshCw className="h-4 w-4" strokeWidth={1.75} />
            </IconButton>
          </div>
        </div>
      ) : null}

      <div className="flex min-h-[360px] flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {generationMode === "single" ? (
          currentOutputText ? (
            isEditingOutput ? (
              <textarea
                aria-label="Edit generated content"
                value={editedOutput}
                onChange={(event) => setEditedOutput(event.target.value)}
                className="h-full min-h-[360px] w-full resize-none bg-transparent p-5 text-sm leading-relaxed text-slate-800 focus:outline-none"
              />
            ) : (
              <div className="document-body whitespace-pre-wrap p-5 text-sm leading-relaxed text-slate-800 sm:p-6">
                {currentOutputText}
                {isGenerating && generatingFormat === activeOutputFormat ? <span className="streaming-cursor" /> : null}
              </div>
            )
          ) : isGenerating ? (
            <LoadingState label={currentFormatMeta?.label} />
          ) : (
            <EmptyState compare={false} />
          )
        ) : isGenerating ? (
          <LoadingState label={selectedProviders.join(" · ")} />
        ) : currentCompareList.length > 0 ? (
          <div
            className={`grid flex-1 items-start gap-4 p-4 ${
              currentCompareList.length === 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
            }`}
          >
            {currentCompareList.map((item, index) => {
              const ok = item.status === "ok";
              const meta = providers.find((provider) => provider.id === item.provider);
              const words = ok && item.output ? item.output.trim().split(/\s+/).length : 0;
              return (
                <article
                  key={`${item.provider}-${index}`}
                  className={`flex min-w-0 flex-col rounded-xl border p-4 ${
                    ok ? "border-slate-200 bg-slate-50" : "border-rose-200 bg-rose-50"
                  }`}
                >
                  <header className="mb-3 flex items-start justify-between gap-2 border-b border-slate-200/80 pb-3">
                    <div className="min-w-0">
                      <p className="truncate font-display text-sm font-semibold text-slate-900">
                        {item.label || meta?.label || item.provider}
                      </p>
                      <p className="truncate text-xs text-slate-500">{item.model || meta?.model || "Standard"}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${ok ? "bg-emerald-50 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                      {ok ? "Ready" : "Error"}
                    </span>
                  </header>
                  <div className="max-h-[420px] flex-1 overflow-y-auto">
                    {ok ? (
                      <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{item.output}</div>
                    ) : (
                      <div className="flex flex-col items-center px-4 py-8 text-center">
                        <AlertCircle className="mb-2 h-6 w-6 text-rose-500" strokeWidth={1.75} />
                        <p className="text-sm font-medium text-rose-900">{item.error || "Provider request failed."}</p>
                      </div>
                    )}
                  </div>
                  {ok ? (
                    <footer className="mt-3 flex items-center justify-between border-t border-slate-200/80 pt-3">
                      <span className="text-xs text-slate-500">{words} words</span>
                      <div className="flex items-center gap-1">
                        <IconButton label="Listen" onClick={() => speakText(item.output)}>
                          <Volume2 className="h-4 w-4" strokeWidth={1.75} />
                        </IconButton>
                        <IconButton label="Copy" onClick={() => handleCopyText(item.output)}>
                          <Copy className="h-4 w-4" strokeWidth={1.75} />
                        </IconButton>
                        <IconButton label="Download" onClick={() => handleDownloadOutput(item.output, `Sankshep_${item.provider}`, "md")}>
                          <Download className="h-4 w-4" strokeWidth={1.75} />
                        </IconButton>
                        {activeOutputFormat === "text_to_slides" ? (
                          <IconButton label="Export presentation" onClick={() => handleDownloadPptx(item.output)}>
                            <FileOutput className="h-4 w-4" strokeWidth={1.75} />
                          </IconButton>
                        ) : null}
                      </div>
                    </footer>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState compare />
        )}
      </div>
    </section>
  );
}

function IconButton({ label, onClick, disabled, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-white hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-700 disabled:opacity-40"
    >
      {children}
    </button>
  );
}
