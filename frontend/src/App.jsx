import React, { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { API_URL, OUTPUT_FORMATS, SAMPLE_TEXT } from "./constants";
import Header from "./components/Header";
import SourcePanel from "./components/SourcePanel";
import ControlPanel from "./components/ControlPanel";
import ResultPanel from "./components/ResultPanel";
import HistoryView from "./components/HistoryView";
import AnalyticsView from "./components/AnalyticsView";
import SettingsDrawer from "./components/SettingsDrawer";

export default function App() {
  const [activeTab, setActiveTab] = useState("workspace");
  const [sourceMode, setSourceMode] = useState("file");
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [providers, setProviders] = useState([]);
  const [generationMode, setGenerationMode] = useState("single");
  const [selectedProvider, setSelectedProvider] = useState("gemini");
  const [selectedProviders, setSelectedProviders] = useState(["gemini", "groq"]);

  const [sourceText, setSourceText] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [urlLoading, setUrlLoading] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);

  const [selectedFormats, setSelectedFormats] = useState(["summary", "linkedin_post", "blog_post"]);
  const [activeOutputFormat, setActiveOutputFormat] = useState("summary");
  const [selectedTone, setSelectedTone] = useState("Thought Leadership");
  const [selectedDetail, setSelectedDetail] = useState("Balanced");
  const [targetLanguage, setTargetLanguage] = useState("Hindi");

  const [brandProfiles, setBrandProfiles] = useState(() => {
    try {
      const saved = localStorage.getItem("sankshep_brand_profiles");
      return saved ? JSON.parse(saved) : [{ name: "Neutral Standard", notes: "" }];
    } catch {
      return [{ name: "Neutral Standard", notes: "" }];
    }
  });
  const [selectedProfileIndex, setSelectedProfileIndex] = useState(0);
  const [profileNameInput, setProfileNameInput] = useState("");
  const [profileNotesInput, setProfileNotesInput] = useState("");

  const [results, setResults] = useState({});
  const [compareResults, setCompareResults] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingFormat, setGeneratingFormat] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  const [pptxLoading, setPptxLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [speakingText, setSpeakingText] = useState("");
  const [isEditingOutput, setIsEditingOutput] = useState(false);
  const [editedOutput, setEditedOutput] = useState("");

  const [engineStatus, setEngineStatus] = useState({ online: true, engine: "Gemini", model: "Default" });
  const [history, setHistory] = useState([]);
  const [analytics, setAnalytics] = useState({
    total_runs: 0,
    total_input_words: 0,
    total_output_words: 0,
    top_formats: [],
  });
  const [historyFilter, setHistoryFilter] = useState("");

  const fileInputRef = useRef(null);

  const fetchProvidersAndStatus = useCallback(async () => {
    try {
      const [provRes, statusRes] = await Promise.all([
        fetch(`${API_URL}/providers`),
        fetch(`${API_URL}/status`),
      ]);

      if (provRes.ok) {
        const provData = await provRes.json();
        const provList = provData.providers || [];
        setProviders(provList);

        const available = provList.filter((provider) => provider.available);
        if (available.length > 0) {
          setSelectedProvider((prev) => {
            const exists = available.some((provider) => provider.id === prev);
            return exists ? prev : available[0].id;
          });
          setSelectedProviders((prev) => {
            const valid = prev.filter((id) => provList.some((provider) => provider.id === id));
            if (valid.length >= 2) return valid.slice(0, 2);
            return available.map((provider) => provider.id).slice(0, 2);
          });
        }
      }

      if (statusRes.ok) {
        const data = await statusRes.json();
        setEngineStatus({
          online: data.status === "online",
          engine: data.engine || "Gemini",
          model: data.model || "Default",
        });
      }
    } catch {
      setEngineStatus({ online: false, engine: "Offline", model: "None" });
    }
  }, []);

  const fetchHistoryAndAnalytics = useCallback(async () => {
    try {
      const [histRes, anaRes] = await Promise.all([
        fetch(`${API_URL}/history?limit=30`),
        fetch(`${API_URL}/analytics`),
      ]);
      if (histRes.ok) {
        const data = await histRes.json();
        setHistory(data.history || []);
      }
      if (anaRes.ok) {
        setAnalytics(await anaRes.json());
      }
    } catch {
      // Backend offline
    }
  }, []);

  useEffect(() => {
    fetchProvidersAndStatus();
    fetchHistoryAndAnalytics();
  }, [fetchProvidersAndStatus, fetchHistoryAndAnalytics]);

  const showToast = (msg) => {
    setToastMessage(msg);
    window.setTimeout(() => setToastMessage(""), 2500);
  };

  const toggleFormat = (id) => {
    setSelectedFormats((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev;
        const updated = prev.filter((item) => item !== id);
        if (activeOutputFormat === id) setActiveOutputFormat(updated[0]);
        return updated;
      }
      return [...prev, id];
    });
  };

  const setCompareProvider = (slot, providerId) => {
    setSelectedProviders((prev) => {
      const next = [...prev];
      next[slot] = providerId;
      if (next[0] === next[1]) {
        const alternative = providers.find((provider) => provider.available && provider.id !== providerId);
        if (alternative) next[slot === 0 ? 1 : 0] = alternative.id;
      }
      return next.slice(0, 2);
    });
  };

  const ingestFile = async (file, inputEvent) => {
    if (!file) return;
    setFileLoading(true);
    setErrorMessage("");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_URL}/upload`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "File extraction failed");
      setSourceText(data.extracted_text || "");
      setUploadedFileName(file.name);
      setSourceMode("text");
      showToast(`Document "${file.name}" ingested successfully`);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setFileLoading(false);
      if (inputEvent?.target) inputEvent.target.value = null;
    }
  };

  const handleUrlFetch = async () => {
    if (!urlInput.trim()) return;
    setUrlLoading(true);
    setErrorMessage("");
    try {
      const res = await fetch(`${API_URL}/extract/url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to extract web content");
      setSourceText(data.extracted_text || "");
      setUploadedFileName(`Web: ${data.title || urlInput.trim()}`);
      setSourceMode("text");
      showToast("Web article extracted");
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setUrlLoading(false);
    }
  };

  const handleClearInput = () => {
    setSourceText("");
    setUploadedFileName("");
    setUrlInput("");
    setResults({});
    setCompareResults({});
  };

  const handleSaveProfile = () => {
    if (!profileNameInput.trim()) return;
    const updated = [...brandProfiles, { name: profileNameInput.trim(), notes: profileNotesInput.trim() }];
    setBrandProfiles(updated);
    localStorage.setItem("sankshep_brand_profiles", JSON.stringify(updated));
    setSelectedProfileIndex(updated.length - 1);
    setProfileNameInput("");
    setProfileNotesInput("");
    showToast("Brand voice profile saved");
  };

  const handleDeleteProfile = (index) => {
    if (index === 0) return;
    const updated = brandProfiles.filter((_, itemIndex) => itemIndex !== index);
    setBrandProfiles(updated);
    localStorage.setItem("sankshep_brand_profiles", JSON.stringify(updated));
    setSelectedProfileIndex(0);
    showToast("Brand voice profile removed");
  };

  const stopTTS = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      setSpeakingText("");
    }
  };

  const speakText = (text) => {
    if (!text || !window.speechSynthesis) return;
    if (speaking && speakingText === text) {
      stopTTS();
      return;
    }
    window.speechSynthesis.cancel();
    const speechText = text.replace(/[#*`_~]/g, "").replace(/\[.*?\]/g, "");
    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.rate = 1.05;
    utterance.onend = () => {
      setSpeaking(false);
      setSpeakingText("");
    };
    utterance.onerror = () => {
      setSpeaking(false);
      setSpeakingText("");
    };
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
    setSpeakingText(text);
  };

  const handleTransform = async () => {
    if (!sourceText.trim()) {
      setErrorMessage("Please enter text, paste a URL, or upload a document to proceed.");
      return;
    }
    if (selectedFormats.length === 0) {
      setErrorMessage("Please select at least one target output format.");
      return;
    }
    if (generationMode === "compare" && selectedProviders.length < 2) {
      setErrorMessage("Please select at least 2 AI providers to compare.");
      return;
    }

    setErrorMessage("");
    setIsGenerating(true);
    stopTTS();
    const activeProfile = brandProfiles[selectedProfileIndex];
    const detailNote = selectedDetail && selectedDetail !== "Balanced" ? `Preferred output detail: ${selectedDetail}.` : "";
    const combinedNotes = [activeProfile?.notes, detailNote].filter(Boolean).join(" ");

    if (generationMode === "single") {
      for (const fmt of selectedFormats) {
        setGeneratingFormat(fmt);
        setActiveOutputFormat(fmt);
        setResults((prev) => ({ ...prev, [fmt]: "" }));

        try {
          const response = await fetch(`${API_URL}/transform`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: sourceText,
              transformation_type: fmt,
              provider: selectedProvider,
              target_language: fmt === "translate" ? targetLanguage : undefined,
              tone: selectedTone,
              brand_voice_name: activeProfile?.name !== "Neutral Standard" ? activeProfile?.name : undefined,
              brand_voice_notes: combinedNotes || undefined,
            }),
          });

          if (!response.ok) {
            const errData = await response.json().catch(() => ({ detail: "Request failed" }));
            throw new Error(errData.detail || `Transformation failed for ${fmt}`);
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let streamText = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            streamText += decoder.decode(value, { stream: true });
            const snapshot = streamText;
            setResults((prev) => ({ ...prev, [fmt]: snapshot }));
          }
        } catch (err) {
          setErrorMessage(err.message);
          break;
        }
      }
    } else {
      for (const fmt of selectedFormats) {
        setGeneratingFormat(fmt);
        setActiveOutputFormat(fmt);
        try {
          const response = await fetch(`${API_URL}/transform/compare`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: sourceText,
              transformation_type: fmt,
              providers: selectedProviders,
              target_language: fmt === "translate" ? targetLanguage : undefined,
              tone: selectedTone,
              brand_voice_name: activeProfile?.name !== "Neutral Standard" ? activeProfile?.name : undefined,
              brand_voice_notes: combinedNotes || undefined,
            }),
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.detail || `Comparison failed for ${fmt}`);
          setCompareResults((prev) => ({ ...prev, [fmt]: data.results || [] }));
        } catch (err) {
          setErrorMessage(err.message);
          break;
        }
      }
    }

    setIsGenerating(false);
    setGeneratingFormat("");
    fetchHistoryAndAnalytics();
  };

  const handleCopyText = async (text) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    showToast("Copied to clipboard");
  };

  const handleDownloadOutput = (text, prefix = "Sankshep", ext = "md") => {
    if (!text) return;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${prefix}_${activeOutputFormat}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Saved ${prefix}_${activeOutputFormat}.${ext}`);
  };

  const handleDownloadPptx = async (slideContent) => {
    const textToExport = slideContent || results.text_to_slides || results[activeOutputFormat];
    if (!textToExport) return;
    setPptxLoading(true);
    try {
      const res = await fetch(`${API_URL}/export/pptx`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slide_text: textToExport }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "PPTX export failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Sankshep_Presentation.pptx";
      a.click();
      URL.revokeObjectURL(url);
      showToast("Downloaded PowerPoint deck");
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setPptxLoading(false);
    }
  };

  const inputWordCount = sourceText.trim() ? sourceText.trim().split(/\s+/).length : 0;
  const currentOutputText = results[activeOutputFormat] || "";
  const outputWordCount = currentOutputText.trim() ? currentOutputText.trim().split(/\s+/).length : 0;
  const activeProvider = providers.find((provider) => provider.id === selectedProvider);
  const providerLabel = activeProvider?.label || engineStatus.engine;
  const modelLabel = activeProvider?.model || engineStatus.model;

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F8FA] text-slate-800">
      <a
        href="#workspace"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:shadow-card"
      >
        Skip to workspace
      </a>
      {toastMessage ? (
        <div
          className="fixed inset-x-4 bottom-6 z-50 mx-auto flex max-w-sm items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-card sm:inset-x-auto sm:right-6 sm:mx-0"
          role="status"
        >
          <CheckCircle2 className="h-4 w-4 text-emerald-600" strokeWidth={1.75} aria-hidden="true" />
          <span>{toastMessage}</span>
        </div>
      ) : null}

      <Header
        activeTab={activeTab}
        onNavigate={setActiveTab}
        engineStatus={engineStatus}
        providerLabel={providerLabel}
        modelLabel={modelLabel}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        onOpenSettings={() => setSettingsOpen(true)}
        onLoadDemo={() => {
          setSourceText(SAMPLE_TEXT);
          setUploadedFileName("Healthcare AI Article");
          setSourceMode("text");
          setActiveTab("workspace");
          showToast("Loaded demo source text");
        }}
      />

      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {errorMessage ? (
          <div className="mb-5 flex items-start justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage("")}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
              aria-label="Dismiss error"
            >
              <X className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </div>
        ) : null}

        {activeTab === "workspace" && (
          <div id="workspace" className="flex flex-col gap-6">
            <section className="max-w-3xl">
              <p className="text-sm font-semibold tracking-tight text-slate-900">Sankshep.ai</p>
              <h1 className="mt-1 font-display text-[clamp(1.75rem,4.2vw,3.25rem)] font-semibold leading-[1.12] tracking-tight text-slate-900">
                Find exactly what you need, instantly.
              </h1>
              <p className="mt-3 text-sm text-slate-500 sm:text-base">
                Sankshep.ai - A Gen-AI based Content Transformation Platform
              </p>
            </section>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(280px,22rem)_minmax(0,1fr)]">
              <div className="flex min-w-0 flex-col gap-8 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 lg:p-6">
                <SourcePanel
                  sourceMode={sourceMode}
                  setSourceMode={setSourceMode}
                  sourceText={sourceText}
                  setSourceText={setSourceText}
                  uploadedFileName={uploadedFileName}
                  setUploadedFileName={setUploadedFileName}
                  urlInput={urlInput}
                  setUrlInput={setUrlInput}
                  urlLoading={urlLoading}
                  fileLoading={fileLoading}
                  fileInputRef={fileInputRef}
                  inputWordCount={inputWordCount}
                  onFileSelected={ingestFile}
                  onUrlFetch={handleUrlFetch}
                  onClear={handleClearInput}
                />
                <ControlPanel
                  selectedFormats={selectedFormats}
                  toggleFormat={toggleFormat}
                  selectAllFormats={() => setSelectedFormats(OUTPUT_FORMATS.map((format) => format.id))}
                  generationMode={generationMode}
                  setGenerationMode={setGenerationMode}
                  providers={providers}
                  selectedProvider={selectedProvider}
                  setSelectedProvider={setSelectedProvider}
                  selectedProviders={selectedProviders}
                  setCompareProvider={setCompareProvider}
                  selectedTone={selectedTone}
                  setSelectedTone={setSelectedTone}
                  selectedDetail={selectedDetail}
                  setSelectedDetail={setSelectedDetail}
                  targetLanguage={targetLanguage}
                  setTargetLanguage={setTargetLanguage}
                  brandProfiles={brandProfiles}
                  selectedProfileIndex={selectedProfileIndex}
                  setSelectedProfileIndex={setSelectedProfileIndex}
                  isGenerating={isGenerating}
                  sourceText={sourceText}
                  generatingFormat={generatingFormat}
                  onGenerate={handleTransform}
                />
              </div>

              <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 lg:p-6">
                <ResultPanel
                  generationMode={generationMode}
                  selectedFormats={selectedFormats}
                  activeOutputFormat={activeOutputFormat}
                  setActiveOutputFormat={setActiveOutputFormat}
                  setIsEditingOutput={setIsEditingOutput}
                  results={results}
                  compareResults={compareResults}
                  isGenerating={isGenerating}
                  generatingFormat={generatingFormat}
                  currentOutputText={currentOutputText}
                  outputWordCount={outputWordCount}
                  inputWordCount={inputWordCount}
                  isEditingOutput={isEditingOutput}
                  editedOutput={editedOutput}
                  setEditedOutput={setEditedOutput}
                  setResults={setResults}
                  speaking={speaking}
                  pptxLoading={pptxLoading}
                  providers={providers}
                  selectedProvider={selectedProvider}
                  selectedProviders={selectedProviders}
                  speakText={speakText}
                  handleCopyText={handleCopyText}
                  handleDownloadOutput={handleDownloadOutput}
                  handleDownloadPptx={handleDownloadPptx}
                  handleTransform={handleTransform}
                  showToast={showToast}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <HistoryView
            history={history}
            historyFilter={historyFilter}
            setHistoryFilter={setHistoryFilter}
            onRefresh={fetchHistoryAndAnalytics}
          />
        )}

        {activeTab === "analytics" && (
          <AnalyticsView
            analytics={analytics}
            history={history}
            providers={providers}
            onRefresh={fetchHistoryAndAnalytics}
          />
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white px-4 py-5 text-sm text-slate-500 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
          <p>Sankshep.ai</p>
          <p>Sankshep.ai - A Gen-AI based Content Transformation Platform</p>
        </div>
      </footer>

      <SettingsDrawer
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        brandProfiles={brandProfiles}
        selectedProfileIndex={selectedProfileIndex}
        setSelectedProfileIndex={setSelectedProfileIndex}
        profileNameInput={profileNameInput}
        setProfileNameInput={setProfileNameInput}
        profileNotesInput={profileNotesInput}
        setProfileNotesInput={setProfileNotesInput}
        onSaveProfile={handleSaveProfile}
        onDeleteProfile={handleDeleteProfile}
      />
    </div>
  );
}
