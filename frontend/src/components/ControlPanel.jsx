import { Check, Columns3, Cpu, GitCompare, LoaderCircle, Sparkles } from "lucide-react";
import { FormatIcon } from "./FormatIcon";
import { DETAIL_OPTIONS, LANGUAGES, OUTPUT_FORMATS, TONE_OPTIONS } from "../constants";

export default function ControlPanel({
  selectedFormats,
  toggleFormat,
  onToggleSelectAll,
  generationMode,
  setGenerationMode,
  providers,
  selectedProvider,
  setSelectedProvider,
  selectedProviders,
  setCompareProvider,
  selectedTone,
  setSelectedTone,
  selectedDetail,
  setSelectedDetail,
  targetLanguage,
  setTargetLanguage,
  brandProfiles,
  selectedProfileIndex,
  setSelectedProfileIndex,
  isGenerating,
  sourceText,
  generatingFormat,
  onGenerate,
}) {
  const available = providers.filter((provider) => provider.available);
  const compareDisabled = generationMode === "compare" && selectedProviders.length < 2;
  const allSelected = selectedFormats.length === OUTPUT_FORMATS.length;

  return (
    <section className="flex flex-col gap-6">
      <div>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="font-display text-sm font-semibold text-slate-900">Select output</h2>
          <button
            type="button"
            onClick={onToggleSelectAll}
            className="text-xs font-medium text-primary-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-700"
          >
            {allSelected ? "Deselect all" : "Select all"}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {OUTPUT_FORMATS.map((format) => {
            const selected = selectedFormats.includes(format.id);
            return (
              <button
                key={format.id}
                type="button"
                onClick={() => toggleFormat(format.id)}
                aria-pressed={selected}
                className={`flex min-h-12 items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-700 ${
                  selected
                    ? "border-primary-700 bg-primary-100 text-slate-900"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                }`}
              >
                <FormatIcon name={format.icon} className="h-4 w-4 shrink-0" />
                <span className="min-w-0 flex-1 truncate font-medium">{format.label}</span>
                {selected ? <Check className="h-4 w-4 shrink-0 text-primary-700" strokeWidth={2} aria-hidden="true" /> : null}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-display text-sm font-semibold text-slate-900">Configure</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="brand-voice" className="mb-1 block text-xs font-medium text-slate-600">
              Audience
            </label>
            <select
              id="brand-voice"
              value={selectedProfileIndex}
              onChange={(event) => setSelectedProfileIndex(Number(event.target.value))}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:border-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-700/20"
            >
              {brandProfiles.map((profile, index) => (
                <option key={`${profile.name}-${index}`} value={index}>
                  {profile.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="tone" className="mb-1 block text-xs font-medium text-slate-600">
              Tone
            </label>
            <select
              id="tone"
              value={selectedTone}
              onChange={(event) => setSelectedTone(event.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:border-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-700/20"
            >
              {TONE_OPTIONS.map((tone) => (
                <option key={tone.id} value={tone.id}>
                  {tone.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="language" className="mb-1 block text-xs font-medium text-slate-600">
              Language
            </label>
            <select
              id="language"
              value={targetLanguage}
              onChange={(event) => setTargetLanguage(event.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:border-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-700/20"
            >
              {LANGUAGES.map((language) => (
                <option key={language} value={language}>
                  {language}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-slate-400">Applied when Translation is selected.</p>
          </div>

          <div>
            <label htmlFor="detail" className="mb-1 block text-xs font-medium text-slate-600">
              Detail
            </label>
            <select
              id="detail"
              value={selectedDetail}
              onChange={(event) => setSelectedDetail(event.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:border-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-700/20"
            >
              {DETAIL_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-display text-sm font-semibold text-slate-900">AI provider</h2>
        <div className="mb-3 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setGenerationMode("single")}
            className={`inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-medium sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-700 ${
              generationMode === "single" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
            }`}
          >
            <Cpu className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            <span className="hidden sm:inline">Single provider</span>
            <span className="sm:hidden">Single</span>
          </button>
          <button
            type="button"
            onClick={() => setGenerationMode("compare")}
            className={`inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-medium sm:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-700 ${
              generationMode === "compare" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
            }`}
          >
            <GitCompare className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            <span className="hidden sm:inline">Compare providers</span>
            <span className="sm:hidden">Compare</span>
          </button>
        </div>

        {generationMode === "single" ? (
          <div>
            <label htmlFor="provider" className="mb-1 block text-xs font-medium text-slate-600">
              Provider
            </label>
            {providers.length === 0 ? (
              <p className="text-sm text-slate-500">Looking up available providers...</p>
            ) : (
              <select
                id="provider"
                value={selectedProvider}
                onChange={(event) => setSelectedProvider(event.target.value)}
                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 focus:border-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-700/20"
              >
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.id} disabled={!provider.available}>
                    {provider.label}
                    {provider.model ? ` · ${provider.model}` : ""}
                    {provider.available ? "" : " (unavailable)"}
                  </option>
                ))}
              </select>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[0, 1].map((slot) => (
              <div key={slot}>
                <label htmlFor={`compare-provider-${slot}`} className="mb-1 block text-xs font-medium text-slate-600">
                  Provider {slot + 1}
                </label>
                <select
                  id={`compare-provider-${slot}`}
                  value={selectedProviders[slot] || ""}
                  onChange={(event) => setCompareProvider(slot, event.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 focus:border-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-700/20"
                >
                  {providers.map((provider) => (
                    <option key={provider.id} value={provider.id} disabled={!provider.available}>
                      {provider.label}
                      {provider.model ? ` · ${provider.model}` : ""}
                      {provider.available ? "" : " (unavailable)"}
                    </option>
                  ))}
                </select>
              </div>
            ))}
            {available.length < 2 ? (
              <p className="sm:col-span-2 text-xs text-slate-500">
                Comparison needs two available providers. Use a single provider if only one is configured.
              </p>
            ) : null}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onGenerate}
        disabled={isGenerating || !sourceText.trim() || compareDisabled}
        className="btn-primary sticky bottom-3 z-10 w-full shadow-card lg:static lg:shadow-sm"
      >
        {isGenerating ? (
          <>
            <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={1.75} aria-hidden="true" />
            Generating your content...
          </>
        ) : (
          <>
            {generationMode === "compare" ? (
              <Columns3 className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            ) : (
              <Sparkles className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            )}
            {generationMode === "compare" ? "Compare" : "Generate"}
          </>
        )}
      </button>
      {isGenerating && generatingFormat ? (
        <p className="text-center text-xs text-slate-500">
          Working on {OUTPUT_FORMATS.find((format) => format.id === generatingFormat)?.label || generatingFormat}
        </p>
      ) : null}
    </section>
  );
}
