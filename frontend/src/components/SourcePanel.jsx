import { FileCheck, FileText, Globe, LoaderCircle, Trash2, Upload } from "lucide-react";
import { useState } from "react";

const SOURCE_TABS = [
  { id: "file", label: "Upload", Icon: Upload },
  { id: "text", label: "Text", Icon: FileText },
  { id: "url", label: "URL", Icon: Globe },
];

export default function SourcePanel({
  sourceMode,
  setSourceMode,
  sourceText,
  setSourceText,
  uploadedFileName,
  setUploadedFileName,
  urlInput,
  setUrlInput,
  urlLoading,
  fileLoading,
  fileInputRef,
  inputWordCount,
  onFileSelected,
  onUrlFetch,
  onClear,
}) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrop = (event) => {
    event.preventDefault();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file) onFileSelected(file);
  };

  return (
    <section className="flex min-w-0 flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-sm font-semibold text-slate-900">Add source</h2>
        {sourceText || uploadedFileName ? (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-700"
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
            Clear
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1" role="tablist" aria-label="Source type">
        {SOURCE_TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={sourceMode === id}
            onClick={() => setSourceMode(id)}
            className={`inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-700 sm:text-sm ${
              sourceMode === id ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      {uploadedFileName ? (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          <span className="flex min-w-0 items-center gap-2">
            <FileCheck className="h-4 w-4 shrink-0 text-primary-700" strokeWidth={1.75} aria-hidden="true" />
            <span className="truncate">{uploadedFileName}</span>
          </span>
          <button
            type="button"
            onClick={() => setUploadedFileName("")}
            className="rounded-md px-2 py-1 text-xs text-slate-500 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-700"
            aria-label="Remove attached file name"
          >
            Remove
          </button>
        </div>
      ) : null}

      {sourceMode === "file" && (
        <div>
          <input
            id="source-file"
            type="file"
            ref={fileInputRef}
            onChange={(event) => onFileSelected(event.target.files?.[0], event)}
            accept=".pdf,.docx,.pptx,.txt,.md,.csv,.json,.png,.jpg,.jpeg,.webp"
            className="sr-only"
          />
          <label
            htmlFor="source-file"
            onDragEnter={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setDragActive(false);
            }}
            onDrop={handleDrop}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors sm:py-10 ${
              dragActive ? "border-primary-700 bg-primary-100" : "border-slate-300 bg-slate-50 hover:border-primary-700 hover:bg-white"
            }`}
          >
            <span className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-primary-700 shadow-sm">
              {fileLoading ? (
                <LoaderCircle className="h-6 w-6 animate-spin" strokeWidth={1.75} />
              ) : (
                <Upload className="h-6 w-6" strokeWidth={1.75} />
              )}
            </span>
            <span className="font-display text-base font-semibold text-slate-900">Upload your content</span>
            <span className="mt-1 text-sm text-slate-500">
              {fileLoading ? "Extracting text from your file..." : "Drag and drop your file here, or browse files"}
            </span>
            <span className="mt-3 text-xs leading-relaxed text-slate-400">
              PDF · DOCX · PPTX · TXT · CSV · JSON · Images
            </span>
          </label>
        </div>
      )}

      {sourceMode === "url" && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="sr-only" htmlFor="source-url">
            Source URL
          </label>
          <div className="relative min-w-0 flex-1">
            <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={1.75} />
            <input
              id="source-url"
              type="url"
              placeholder="https://example.com/article"
              value={urlInput}
              onChange={(event) => setUrlInput(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && onUrlFetch()}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-700/20"
            />
          </div>
          <button
            type="button"
            onClick={onUrlFetch}
            disabled={urlLoading || !urlInput.trim()}
            className="btn-secondary h-11 w-full px-4 sm:w-auto"
          >
            {urlLoading ? <LoaderCircle className="h-4 w-4 animate-spin" strokeWidth={1.75} /> : "Extract"}
          </button>
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="mb-1.5 flex items-center justify-between text-xs text-slate-500">
          <label htmlFor="source-text" className="font-medium text-slate-600">
            Source text
          </label>
          <span>{inputWordCount} words</span>
        </div>
        <textarea
          id="source-text"
          rows={sourceMode === "text" ? 10 : 5}
          value={sourceText}
          onChange={(event) => setSourceText(event.target.value)}
          placeholder="Paste or type your source content here..."
          className="min-h-[120px] w-full resize-y rounded-xl border border-slate-200 bg-white p-3.5 text-sm leading-relaxed text-slate-800 placeholder:text-slate-400 focus:border-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-700/20"
        />
      </div>
    </section>
  );
}
