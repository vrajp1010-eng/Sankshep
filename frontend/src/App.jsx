import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Sparkles,
  FileText,
  Upload,
  Globe,
  Copy,
  Check,
  Download,
  Volume2,
  Square,
  Presentation,
  History,
  LayoutDashboard,
  Layers,
  ArrowRight,
  Trash2,
  RefreshCw,
  Feather,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Wand2,
  CheckCircle2,
  Zap,
  Edit3,
  Cpu,
  Columns,
  AlertTriangle
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// 13 Transformation formats with category grouping
const OUTPUT_FORMATS = [
  { id: "blog_post", label: "Blog Post", icon: "📝", cat: "Longform", color: "from-cyan-500 to-blue-500" },
  { id: "linkedin_post", label: "LinkedIn Post", icon: "💼", cat: "Social", color: "from-blue-500 to-indigo-500" },
  { id: "twitter_thread", label: "X / Twitter Thread", icon: "🧵", cat: "Viral", color: "from-sky-400 to-cyan-500" },
  { id: "summary", label: "Executive Summary", icon: "📋", cat: "Insight", color: "from-emerald-400 to-teal-500" },
  { id: "email_newsletter", label: "Email Newsletter", icon: "✉️", cat: "Email", color: "from-amber-400 to-orange-500" },
  { id: "video_script", label: "Video Script", icon: "🎬", cat: "Media", color: "from-purple-500 to-pink-500" },
  { id: "seo_meta", label: "SEO Meta & Keywords", icon: "🔍", cat: "Growth", color: "from-teal-400 to-emerald-500" },
  { id: "faq_section", label: "FAQ Knowledge Base", icon: "❓", cat: "Support", color: "from-indigo-400 to-purple-500" },
  { id: "text_to_slides", label: "Slide Deck (PPTX)", icon: "📊", cat: "Slides", color: "from-orange-500 to-amber-500" },
  { id: "simplify", label: "ELI5 / 5th-Grade", icon: "🎓", cat: "Clarity", color: "from-pink-400 to-rose-500" },
  { id: "captions_srt", label: "Captions (SRT)", icon: "💬", cat: "Subtitles", color: "from-sky-500 to-blue-600" },
  { id: "alt_text", label: "Alt Text & Visuals", icon: "🖼️", cat: "Visuals", color: "from-purple-400 to-indigo-500" },
  { id: "translate", label: "Translation", icon: "🌐", cat: "Global", color: "from-cyan-400 to-teal-500" },
];

const TONE_OPTIONS = [
  { id: "Thought Leadership", label: "Thought Leadership", desc: "Visionary, high-impact industry insight" },
  { id: "Professional", label: "Professional", desc: "Authoritative, articulate corporate tone" },
  { id: "Casual & Friendly", label: "Casual & Conversational", desc: "Warm, engaging, approachable" },
  { id: "Persuasive & Sales", label: "Persuasive Copy", desc: "High-converting, value-driven" },
  { id: "Academic & Analytical", label: "Academic & Data-Driven", desc: "Deep analytical precision" },
  { id: "Punchy & Viral", label: "Punchy Viral Hook", desc: "High-energy scroll-stopping formatting" },
  { id: "Storytelling & Narrative", label: "Narrative Storytelling", desc: "Emotional narrative framework" },
];

const LANGUAGES = [
  "Hindi", "Spanish", "French", "German", "Japanese", "Tamil",
  "Bengali", "Telugu", "Marathi", "Mandarin Chinese", "Arabic",
  "Russian", "Portuguese", "Italian", "Korean"
];

const SAMPLE_TEXT = `Artificial Intelligence in Healthcare: Accelerating Diagnostics and Precision Medicine

The convergence of large language models, computer vision, and predictive bioinformatics is fundamentally transforming clinical healthcare. Diagnostic pipelines that once required weeks of laboratory correlation, pathology reviews, and manual radiological inspections can now be cross-referenced against global clinical knowledge in seconds.

Key Clinical Breakthroughs:
1. Ultra-Early Oncology Detection: Deep learning architectures trained on multi-spectral CT scans and mammograms achieve over 94.8% sensitivity, identifying micro-nodules years before symptomatic presentation.
2. Ambient Clinical Documentation: Automated scribes capture doctor-patient conversations and synthesize standardized EHR medical charts, reducing physician burnout by 42%.
3. In Silico Molecular Simulation: Generative diffusion models simulate protein-ligand binding kinetics, cutting drug discovery timelines from 6 years to under 18 months.

While transformative, deployment requires rigorous validation across edge hardware, patient privacy safeguards (HIPAA/GDPR), bias mitigation in diverse demographic datasets, and offline air-gapped readiness.`;

export default function App() {
  const [activeTab, setActiveTab] = useState("studio"); // 'studio' | 'dashboard'
  const [sourceMode, setSourceMode] = useState("text"); // 'text' | 'file' | 'url'
  
  // AI Provider & Execution Mode State
  const [providers, setProviders] = useState([]);
  const [generationMode, setGenerationMode] = useState("single"); // 'single' | 'compare'
  const [selectedProvider, setSelectedProvider] = useState("gemini");
  const [selectedProviders, setSelectedProviders] = useState(["gemini", "groq"]);

  // Source State
  const [sourceText, setSourceText] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [urlLoading, setUrlLoading] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);
  
  // Settings State
  const [selectedFormats, setSelectedFormats] = useState(["blog_post", "linkedin_post", "text_to_slides"]);
  const [activeOutputFormat, setActiveOutputFormat] = useState("blog_post");
  const [selectedTone, setSelectedTone] = useState("Thought Leadership");
  const [targetLanguage, setTargetLanguage] = useState("Hindi");
  
  // Brand Voice Profiles (Stored in LocalStorage)
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
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);

  // Generation Output State
  const [results, setResults] = useState({});
  const [compareResults, setCompareResults] = useState({}); // { [formatId]: [ { provider, label, model, status, output, error } ] }
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingFormat, setGeneratingFormat] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  
  // Output Actions State
  const [pptxLoading, setPptxLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [speakingText, setSpeakingText] = useState("");
  const [isEditingOutput, setIsEditingOutput] = useState(false);
  const [editedOutput, setEditedOutput] = useState("");

  // Telemetry & Analytics
  const [engineStatus, setEngineStatus] = useState({ online: true, engine: "Groq", model: "Default" });
  const [history, setHistory] = useState([]);
  const [analytics, setAnalytics] = useState({ total_runs: 0, total_input_words: 0, total_output_words: 0, top_formats: [] });
  const [historyFilter, setHistoryFilter] = useState("");

  const fileInputRef = useRef(null);

  // Fetch Providers & Engine Status
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

        const available = provList.filter((p) => p.available);
        if (available.length > 0) {
          setSelectedProvider((prev) => {
            const exists = available.some((p) => p.id === prev);
            return exists ? prev : available[0].id;
          });
          setSelectedProviders((prev) => {
            const valid = prev.filter((pid) => provList.some((p) => p.id === pid));
            if (valid.length >= 2) return valid;
            return available.map((p) => p.id).slice(0, 2);
          });
        }
      }

      if (statusRes.ok) {
        const data = await statusRes.json();
        setEngineStatus({
          online: data.status === "online",
          engine: data.engine || "Groq",
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
        fetch(`${API_URL}/analytics`)
      ]);
      if (histRes.ok) {
        const data = await histRes.json();
        setHistory(data.history || []);
      }
      if (anaRes.ok) {
        const data = await anaRes.json();
        setAnalytics(data);
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
    setTimeout(() => setToastMessage(""), 2500);
  };

  // Toggle format selection
  const toggleFormat = (id) => {
    setSelectedFormats((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev;
        const updated = prev.filter((item) => item !== id);
        if (activeOutputFormat === id) {
          setActiveOutputFormat(updated[0]);
        }
        return updated;
      } else {
        return [...prev, id];
      }
    });
  };

  // Toggle provider in comparison mode
  const toggleCompareProvider = (providerId) => {
    setSelectedProviders((prev) => {
      if (prev.includes(providerId)) {
        if (prev.length <= 2) {
          showToast("Comparison requires at least 2 providers.");
          return prev;
        }
        return prev.filter((p) => p !== providerId);
      } else {
        return [...prev, providerId];
      }
    });
  };

  // Upload Document Handler
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileLoading(true);
    setErrorMessage("");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_URL}/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "File extraction failed");
      setSourceText(data.extracted_text || "");
      setUploadedFileName(file.name);
      setSourceMode("text");
      showToast(`Document "${file.name}" ingested successfully!`);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setFileLoading(false);
      e.target.value = null;
    }
  };

  // Web URL Fetcher Handler
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
      showToast("Web article extracted!");
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setUrlLoading(false);
    }
  };

  // Reset Input
  const handleClearInput = () => {
    setSourceText("");
    setUploadedFileName("");
    setUrlInput("");
    setResults({});
    setCompareResults({});
  };

  // Save Brand Voice
  const handleSaveProfile = () => {
    if (!profileNameInput.trim()) return;
    const newProfile = { name: profileNameInput.trim(), notes: profileNotesInput.trim() };
    const updated = [...brandProfiles, newProfile];
    setBrandProfiles(updated);
    localStorage.setItem("sankshep_brand_profiles", JSON.stringify(updated));
    setSelectedProfileIndex(updated.length - 1);
    setProfileNameInput("");
    setProfileNotesInput("");
    setShowProfileDrawer(false);
    showToast("Brand Voice Profile saved!");
  };

  const handleDeleteProfile = (index) => {
    if (index === 0) return;
    const updated = brandProfiles.filter((_, i) => i !== index);
    setBrandProfiles(updated);
    localStorage.setItem("sankshep_brand_profiles", JSON.stringify(updated));
    setSelectedProfileIndex(0);
    showToast("Brand Voice Profile removed");
  };

  const stopTTS = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      setSpeakingText("");
    }
  };

  // Audio Speech for any text
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

  // Run Transformation (Single Streaming or Multi-Provider Comparison)
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

    if (generationMode === "single") {
      // ── SINGLE MODE STREAMING ─────────────────────────────────────────
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
              brand_voice_notes: activeProfile?.notes || undefined,
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
            const chunk = decoder.decode(value, { stream: true });
            streamText += chunk;
            const snapshot = streamText;
            setResults((prev) => ({ ...prev, [fmt]: snapshot }));
          }
        } catch (err) {
          setErrorMessage(err.message);
          break;
        }
      }
    } else {
      // ── COMPARE MODE CONCURRENT MULTI-PROVIDER ────────────────────────
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
              brand_voice_notes: activeProfile?.notes || undefined,
            }),
          });

          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.detail || `Comparison failed for ${fmt}`);
          }

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

  // Copy Output
  const handleCopyText = async (text) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    showToast("Copied to clipboard!");
  };

  // Download Markdown / Text
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

  // Download PowerPoint Deck
  const handleDownloadPptx = async (slideContent) => {
    const textToExport = slideContent || results["text_to_slides"] || results[activeOutputFormat];
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
      showToast("Downloaded PowerPoint Deck (.pptx)!");
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setPptxLoading(false);
    }
  };

  // Word metrics
  const inputWordCount = sourceText.trim() ? sourceText.trim().split(/\s+/).length : 0;
  const currentOutputText = results[activeOutputFormat] || "";
  const outputWordCount = currentOutputText.trim() ? currentOutputText.trim().split(/\s+/).length : 0;
  const currentFormatMeta = OUTPUT_FORMATS.find((f) => f.id === activeOutputFormat);
  const currentCompareList = compareResults[activeOutputFormat] || [];

  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col font-sans relative aurora-bg selection:bg-blue-500/20 selection:text-blue-900">
      
      {/* Toast Feedback Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-white border border-[#88D1F1] text-slate-900 px-4 py-2.5 rounded-xl shadow-lg shadow-blue-500/10 flex items-center gap-2.5 text-xs font-mono backdrop-blur-xl animate-bounce">
          <Zap className="w-4 h-4 text-[#027DFF] fill-[#027DFF]/20" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── TOP HEADER NAVIGATION ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-2xl border-b border-slate-200 px-4 sm:px-8 py-3 flex items-center justify-between shadow-xs">
        
        {/* Brand & Sankshep.ai Logo */}
        <div className="flex items-center gap-6">
          <div 
            onClick={() => setActiveTab("studio")} 
            className="flex items-center gap-3 cursor-pointer group select-none"
            title="Sankshep.ai Home"
          >
            {/* Logo Image Container with Light Surface for Perfect Contrast */}
            <div className="h-10 px-2 py-1 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-xs group-hover:shadow-md transition-all">
              <img 
                src="/logo.png" 
                alt="Sankshep.ai logo" 
                className="h-8 w-auto max-w-[140px] sm:max-w-[170px] object-contain" 
              />
            </div>
            
            <div className="flex flex-col hidden sm:flex">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono uppercase bg-[#E8F4FD] text-[#027DFF] border border-[#88D1F1]/60 px-1.5 py-0.2 rounded font-bold">
                  v2.0 Multi-AI
                </span>
              </div>
              <span className="text-[9px] font-mono text-slate-400 tracking-wider">
                CONTENT TRANSFORMATION & COMPARISON
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-full p-1 text-xs font-display">
            <button
              onClick={() => setActiveTab("studio")}
              className={`px-4 py-1.5 rounded-full transition-all flex items-center gap-2 ${
                activeTab === "studio"
                  ? "bg-[#027DFF] text-white font-bold shadow-md shadow-blue-500/20"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Wand2 className={`w-3.5 h-3.5 ${activeTab === "studio" ? "text-white" : "text-[#027DFF]"}`} />
              Studio Canvas
            </button>
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-4 py-1.5 rounded-full transition-all flex items-center gap-2 ${
                activeTab === "dashboard"
                  ? "bg-[#027DFF] text-white font-bold shadow-md shadow-blue-500/20"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <LayoutDashboard className={`w-3.5 h-3.5 ${activeTab === "dashboard" ? "text-white" : "text-[#027DFF]"}`} />
              Telemetry Dashboard
            </button>
          </nav>
        </div>

        {/* Status Indicators & Fast Actions */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 shadow-xs">
            <div className={`w-2 h-2 rounded-full ${engineStatus.online ? "bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" : "bg-rose-500"}`}></div>
            <span className="text-slate-500 hidden sm:inline">{engineStatus.engine.toUpperCase()}</span>
            <span className="text-slate-900 font-bold">{engineStatus.online ? "ONLINE" : "OFFLINE"}</span>
          </div>

          <button
            onClick={() => {
              setSourceText(SAMPLE_TEXT);
              setUploadedFileName("Healthcare AI Article");
              setSourceMode("text");
              showToast("Loaded demo source text!");
            }}
            className="hidden lg:flex items-center gap-1.5 bg-[#E8F4FD] hover:bg-blue-100 border border-[#88D1F1] px-3 py-1.5 rounded-full text-[#027DFF] hover:text-[#0039A9] transition-colors font-display text-xs font-medium"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#027DFF]" />
            <span>Load Demo</span>
          </button>
        </div>
      </header>

      {/* ── MAIN WORKSPACE ─────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10 flex flex-col">
        
        {/* Error Notification */}
        {errorMessage && (
          <div className="mb-5 bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-2xl text-xs sm:text-sm flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="text-rose-500 text-lg">⚠️</span>
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage("")} className="text-xs font-mono text-rose-600 hover:text-rose-900 underline font-semibold">
              Dismiss
            </button>
          </div>
        )}

        {/* ── TAB 1: STUDIO CANVAS ──────────────────────────────────────────── */}
        {activeTab === "studio" && (
          <div className="flex-1 flex flex-col gap-6">
            
            {/* Top Headline Banner & Provider Mode Selector */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-mono tracking-widest text-[#027DFF] uppercase mb-1 font-bold">
                  <span className="w-4 h-0.5 bg-[#027DFF]"></span>
                  SANKSHEP.AI CONTENT PLATFORM
                </div>
                <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 flex items-center flex-wrap gap-2.5">
                  <span>Turn Any Content Into</span>
                  <span className="bg-gradient-to-r from-[#0039A9] via-[#027DFF] to-[#1392D3] bg-clip-text text-transparent">
                    Every Format You Need
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 font-normal max-w-3xl">
                  Transform source documents or compare multiple AI providers side by side with zero client-side credential exposure.
                </p>
              </div>

              {/* Single vs Compare Mode Toggle Switch */}
              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200 self-stretch sm:self-auto justify-center">
                <button
                  onClick={() => setGenerationMode("single")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-display font-bold transition-all flex items-center gap-1.5 ${
                    generationMode === "single"
                      ? "bg-white text-[#027DFF] border border-slate-200 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5 text-[#027DFF]" />
                  Single AI
                </button>
                <button
                  onClick={() => setGenerationMode("compare")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-display font-bold transition-all flex items-center gap-1.5 ${
                    generationMode === "compare"
                      ? "bg-white text-[#027DFF] border border-slate-200 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Columns className="w-3.5 h-3.5 text-[#027DFF]" />
                  Compare AI
                </button>
              </div>
            </div>

            {/* Split 2-Column Responsive Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch flex-1">
              
              {/* ── ZONE 1 & 2: SOURCE INPUT & CONFIGURATION (5 Cols on Large) ── */}
              <div className="lg:col-span-5 flex flex-col gap-5 bright-glass rounded-2xl p-5 shadow-sm border border-slate-200">
                
                {/* Mode Selector Tabs (Document / Web URL / Text) */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 p-1 rounded-xl text-xs font-display font-medium">
                    <button
                      onClick={() => setSourceMode("text")}
                      className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                        sourceMode === "text" ? "bg-white text-[#027DFF] border border-slate-200 font-bold shadow-xs" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5 text-[#027DFF]" />
                      Editor
                    </button>
                    <button
                      onClick={() => setSourceMode("file")}
                      className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                        sourceMode === "file" ? "bg-white text-[#027DFF] border border-slate-200 font-bold shadow-xs" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5 text-[#027DFF]" />
                      File / OCR
                    </button>
                    <button
                      onClick={() => setSourceMode("url")}
                      className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                        sourceMode === "url" ? "bg-white text-[#027DFF] border border-slate-200 font-bold shadow-xs" : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5 text-[#027DFF]" />
                      Web URL
                    </button>
                  </div>

                  {sourceText && (
                    <button
                      onClick={handleClearInput}
                      className="text-xs font-mono text-slate-400 hover:text-rose-600 transition-colors flex items-center gap-1"
                      title="Clear content"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Clear
                    </button>
                  )}
                </div>

                {/* File Attachment Chip */}
                {uploadedFileName && (
                  <div className="flex items-center justify-between bg-[#E8F4FD] border border-[#88D1F1] rounded-xl px-3.5 py-2 text-xs font-mono text-[#0039A9]">
                    <div className="flex items-center gap-2 truncate">
                      <FileCheck className="w-4 h-4 text-[#027DFF] shrink-0" />
                      <span className="truncate font-semibold">{uploadedFileName}</span>
                    </div>
                    <button
                      onClick={() => setUploadedFileName("")}
                      className="text-slate-400 hover:text-rose-600 ml-2 font-bold"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Sub-Panel: File Upload Mode */}
                {sourceMode === "file" && (
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept=".pdf,.docx,.txt,.md,.csv,.json,.png,.jpg,.jpeg,.webp"
                      className="hidden"
                    />
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-[#88D1F1] hover:border-[#027DFF] hover:bg-[#F8FAFC] transition-all rounded-2xl p-6 text-center cursor-pointer group"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-[#E8F4FD] border border-[#88D1F1]/60 flex items-center justify-center mx-auto mb-2.5 text-[#027DFF] group-hover:scale-110 transition-transform">
                        <Upload className="w-6 h-6" />
                      </div>
                      <p className="text-xs text-slate-800 font-bold font-display">
                        Click to upload document or scanned image
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono mt-1">
                        PDF, DOCX, TXT, CSV, JSON, PNG, JPG (Auto OCR)
                      </p>
                    </div>

                    {fileLoading && (
                      <p className="text-xs font-mono text-[#027DFF] animate-pulse mt-2 text-center font-bold">
                        ⏳ Reading document text & running OCR parser...
                      </p>
                    )}
                  </div>
                )}

                {/* Sub-Panel: URL Fetcher Mode */}
                {sourceMode === "url" && (
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Globe className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#027DFF]" />
                      <input
                        type="url"
                        placeholder="https://example.com/article..."
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleUrlFetch()}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#027DFF] font-mono"
                      />
                    </div>
                    <button
                      onClick={handleUrlFetch}
                      disabled={urlLoading || !urlInput.trim()}
                      className="bg-[#027DFF] hover:bg-[#0039A9] disabled:opacity-40 text-xs font-display px-4 py-2.5 rounded-xl text-white font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      {urlLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Fetch"}
                    </button>
                  </div>
                )}

                {/* Raw Text Input Area */}
                <div className="flex flex-col flex-1">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 mb-1.5 font-bold">
                    <span>SOURCE TEXT INPUT</span>
                    <span className="bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-slate-600">
                      {inputWordCount} words
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    value={sourceText}
                    onChange={(e) => setSourceText(e.target.value)}
                    placeholder="Type or paste your source content, transcript, notes or article here..."
                    className="w-full flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#027DFF] font-sans leading-relaxed resize-y min-h-[100px]"
                  />
                </div>

                {/* AI Provider Selector (Single Mode Dropdown or Compare Mode Multi-Select) */}
                <div className="pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-slate-700 font-bold flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-[#027DFF]" />
                      {generationMode === "single" ? "AI Provider" : "Compare AI Providers (Select 2+)"}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {providers.filter(p => p.available).length} available
                    </span>
                  </div>

                  {generationMode === "single" ? (
                    <div className="grid grid-cols-1 gap-2">
                      <select
                        value={selectedProvider}
                        onChange={(e) => setSelectedProvider(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#027DFF] font-sans font-semibold"
                      >
                        {providers.map((p) => (
                          <option 
                            key={p.id} 
                            value={p.id} 
                            disabled={!p.available}
                            className={p.available ? "text-slate-900 font-semibold" : "text-slate-400 italic"}
                          >
                            {p.label} ({p.model}) {p.available ? "✓ Ready" : "(Key not configured)"}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {providers.map((p) => {
                        const isSelected = selectedProviders.includes(p.id);
                        return (
                          <div
                            key={p.id}
                            onClick={() => p.available && toggleCompareProvider(p.id)}
                            className={`p-2 rounded-xl border text-xs cursor-pointer select-none transition-all flex flex-col justify-between ${
                              !p.available
                                ? "bg-slate-50 border-slate-200 text-slate-400 opacity-60 cursor-not-allowed"
                                : isSelected
                                ? "bg-[#E8F4FD] border-[#027DFF] text-slate-900 font-bold shadow-xs"
                                : "bg-white border-slate-200 text-slate-700 hover:border-[#88D1F1]"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-display font-bold truncate">{p.label}</span>
                              {isSelected && p.available && <Check className="w-3.5 h-3.5 text-[#027DFF] shrink-0 font-bold" />}
                            </div>
                            <span className="text-[10px] font-mono text-slate-500 truncate mt-0.5">
                              {p.available ? p.model : "Not configured"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Output Formats Multi-Select Matrix */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-slate-700 font-bold flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#027DFF]" />
                      TARGET FORMATS ({selectedFormats.length} SELECTED)
                    </span>
                    <button
                      onClick={() => setSelectedFormats(OUTPUT_FORMATS.map((f) => f.id))}
                      className="text-[10px] font-mono text-[#027DFF] hover:underline font-bold"
                    >
                      Select All 13
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                    {OUTPUT_FORMATS.map((format) => {
                      const isSelected = selectedFormats.includes(format.id);
                      return (
                        <div
                          key={format.id}
                          onClick={() => toggleFormat(format.id)}
                          className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer select-none transition-all ${
                            isSelected
                              ? "bg-[#E8F4FD] border-[#027DFF] text-slate-900 font-bold shadow-xs"
                              : "bg-white border-slate-200 text-slate-600 hover:border-[#88D1F1] hover:text-slate-900"
                          }`}
                        >
                          <span className="text-base">{format.icon}</span>
                          <span className="font-display truncate flex-1">{format.label}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-[#027DFF] shrink-0 font-extrabold" />}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Tone & Persona Tuner */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-slate-600 font-bold mb-1">Tone of Voice</label>
                    <select
                      value={selectedTone}
                      onChange={(e) => setSelectedTone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#027DFF] font-sans font-medium"
                    >
                      {TONE_OPTIONS.map((t) => (
                        <option key={t.id} value={t.id} className="bg-white text-slate-800">
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedFormats.includes("translate") ? (
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-slate-600 font-bold mb-1">Target Language</label>
                      <select
                        value={targetLanguage}
                        onChange={(e) => setTargetLanguage(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#027DFF] font-sans font-medium"
                      >
                        {LANGUAGES.map((lang) => (
                          <option key={lang} value={lang} className="bg-white text-slate-800">
                            {lang}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-slate-600 font-bold mb-1">Brand Voice</label>
                      <select
                        value={selectedProfileIndex}
                        onChange={(e) => setSelectedProfileIndex(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#027DFF] truncate font-sans font-medium"
                      >
                        {brandProfiles.map((p, idx) => (
                          <option key={idx} value={idx} className="bg-white text-slate-800">
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Custom Brand Voice Editor Drawer */}
                <div>
                  <button
                    onClick={() => setShowProfileDrawer(!showProfileDrawer)}
                    className="text-[11px] font-display text-slate-600 hover:text-[#027DFF] flex items-center justify-between w-full py-1 font-medium"
                  >
                    <span className="flex items-center gap-1.5">
                      <Feather className="w-3.5 h-3.5 text-[#027DFF]" />
                      Configure Custom Brand Voice Profile
                    </span>
                    {showProfileDrawer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {showProfileDrawer && (
                    <div className="mt-2 p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-2.5 text-xs">
                      <input
                        type="text"
                        placeholder="Profile Name (e.g., Tech Innovator Voice)"
                        value={profileNameInput}
                        onChange={(e) => setProfileNameInput(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#027DFF] font-sans"
                      />
                      <textarea
                        rows={2}
                        placeholder="Vocabulary rules, style guidelines, preferred phrasing..."
                        value={profileNotesInput}
                        onChange={(e) => setProfileNotesInput(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#027DFF] resize-none font-sans"
                      />
                      <div className="flex items-center justify-between">
                        {selectedProfileIndex > 0 && (
                          <button
                            onClick={() => handleDeleteProfile(selectedProfileIndex)}
                            className="text-[10px] font-mono text-rose-500 hover:underline"
                          >
                            Delete Current
                          </button>
                        )}
                        <button
                          onClick={handleSaveProfile}
                          disabled={!profileNameInput.trim()}
                          className="bg-[#027DFF] hover:bg-[#0039A9] disabled:opacity-40 text-white px-3 py-1.5 rounded-lg text-xs font-display font-bold ml-auto shadow-sm"
                        >
                          Save Profile
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Hero Gradient Transform Action Button */}
                <button
                  onClick={handleTransform}
                  disabled={isGenerating || !sourceText.trim() || (generationMode === "compare" && selectedProviders.length < 2)}
                  className="w-full btn-aurora disabled:opacity-40 font-display text-sm uppercase tracking-wider font-extrabold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2.5 mt-1 shadow-md shadow-blue-500/20"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>{generationMode === "compare" ? "COMPARING AI PROVIDERS..." : `GENERATING ${generatingFormat.replace("_", " ").toUpperCase()}...`}</span>
                    </>
                  ) : (
                    <>
                      <span>{generationMode === "compare" ? "COMPARE WITH SANKSHEP.AI" : "TRANSFORM WITH SANKSHEP.AI"}</span>
                      <ArrowRight className="w-4 h-4 text-white stroke-[3]" />
                    </>
                  )}
                </button>
              </div>

              {/* ── ZONE 3: ARTIFACT CANVAS & COMPARISON WORKSPACE (7 Cols on Large) ────── */}
              <div className="lg:col-span-7 flex flex-col bright-glass rounded-2xl p-5 shadow-sm border border-slate-200 min-h-[600px]">
                
                {/* Output Header Tabs */}
                <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 mb-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-mono uppercase tracking-wider font-bold text-slate-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#027DFF]" />
                      {generationMode === "compare" ? "AI PROVIDER COMPARISON" : "GENERATED ARTIFACTS"}
                    </span>

                    {/* Word Metrics Pill (Single Mode) */}
                    {generationMode === "single" && outputWordCount > 0 && (
                      <div className="flex items-center gap-2 text-xs font-mono">
                        <span className="text-slate-700 font-bold">{outputWordCount} words</span>
                        {inputWordCount > 0 && (
                          <span className="bg-[#E8F4FD] border border-[#88D1F1] px-2 py-0.5 rounded text-[#027DFF] font-bold">
                            {outputWordCount < inputWordCount
                              ? `-${Math.round((1 - outputWordCount / inputWordCount) * 100)}% condensed`
                              : `+${Math.round((outputWordCount / inputWordCount - 1) * 100)}% expanded`}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Format Navigation Pills */}
                  {selectedFormats.length > 0 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                      {selectedFormats.map((fmtId) => {
                        const meta = OUTPUT_FORMATS.find((f) => f.id === fmtId);
                        const hasSingleResult = !!results[fmtId];
                        const hasCompareResult = !!(compareResults[fmtId] && compareResults[fmtId].length > 0);
                        const hasResult = generationMode === "single" ? hasSingleResult : hasCompareResult;
                        const isCurrent = activeOutputFormat === fmtId;
                        return (
                          <button
                            key={fmtId}
                            onClick={() => {
                              setActiveOutputFormat(fmtId);
                              setIsEditingOutput(false);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-display font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                              isCurrent
                                ? "bg-[#027DFF] text-white font-extrabold shadow-sm shadow-blue-500/20"
                                : hasResult
                                ? "bg-white text-slate-800 border border-slate-200 hover:border-[#027DFF]"
                                : "bg-slate-50 text-slate-400 border border-slate-200"
                            }`}
                          >
                            <span>{meta?.icon}</span>
                            <span>{meta?.label}</span>
                            {hasResult && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Single Mode Output Toolbar (TTS, PPTX, Copy, Download, Edit) */}
                {generationMode === "single" && currentOutputText ? (
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 mb-3.5 text-xs font-display flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{currentFormatMeta?.icon}</span>
                      <span className="font-bold text-slate-900 text-sm">{currentFormatMeta?.label}</span>
                      <span className="text-slate-400 text-[11px] font-mono font-medium">· {Math.ceil(outputWordCount / 200)} min read</span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Audio Narration / Text-to-Speech */}
                      <button
                        onClick={() => speakText(isEditingOutput ? editedOutput : currentOutputText)}
                        title={speaking ? "Stop Narration" : "Read Aloud"}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-display font-bold flex items-center gap-2 transition-colors ${
                          speaking
                            ? "bg-rose-50 border-rose-300 text-rose-700"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {speaking ? (
                          <>
                            <Square className="w-3.5 h-3.5 fill-current" />
                            <span>Stop</span>
                            <div className="flex items-center gap-0.5 h-3">
                              <span className="w-0.5 bg-rose-500 wave-1"></span>
                              <span className="w-0.5 bg-rose-500 wave-2"></span>
                              <span className="w-0.5 bg-rose-500 wave-3"></span>
                              <span className="w-0.5 bg-rose-500 wave-4"></span>
                            </div>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5 text-[#027DFF]" />
                            <span>Listen</span>
                          </>
                        )}
                      </button>

                      {/* PowerPoint Export (if Slide Outline) */}
                      {activeOutputFormat === "text_to_slides" && (
                        <button
                          onClick={() => handleDownloadPptx(currentOutputText)}
                          disabled={pptxLoading}
                          className="bg-[#027DFF] hover:bg-[#0039A9] text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors font-bold shadow-xs"
                        >
                          <Presentation className="w-3.5 h-3.5" />
                          <span>{pptxLoading ? "Building..." : "Export .pptx"}</span>
                        </button>
                      )}

                      {/* Copy Output */}
                      <button
                        onClick={() => handleCopyText(isEditingOutput ? editedOutput : currentOutputText)}
                        className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-display font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5 text-[#027DFF]" />
                        <span>Copy</span>
                      </button>

                      {/* Download .md */}
                      <button
                        onClick={() => handleDownloadOutput(isEditingOutput ? editedOutput : currentOutputText, "Sankshep", "md")}
                        className="bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-display font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5 text-[#027DFF]" />
                        <span>.md</span>
                      </button>

                      {/* Edit / View Toggle */}
                      <button
                        onClick={() => {
                          if (!isEditingOutput) {
                            setEditedOutput(currentOutputText);
                          } else {
                            setResults((prev) => ({ ...prev, [activeOutputFormat]: editedOutput }));
                            showToast("Draft updated!");
                          }
                          setIsEditingOutput(!isEditingOutput);
                        }}
                        className="bg-[#E8F4FD] border border-[#88D1F1] text-[#027DFF] hover:bg-blue-100 px-3 py-1.5 rounded-lg text-xs font-display font-bold flex items-center gap-1.5 transition-colors"
                      >
                        {isEditingOutput ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5 text-[#027DFF]" />}
                        <span>{isEditingOutput ? "Save" : "Edit"}</span>
                      </button>
                    </div>
                  </div>
                ) : null}

                {/* ── ARTIFACT CANVAS VIEWPORT ──────────────────────────────── */}
                <div className="flex-1 bg-[#F8FAFC] border border-slate-200 rounded-xl p-5 overflow-y-auto min-h-[400px] flex flex-col shadow-inner">
                  {/* SINGLE MODE VIEW */}
                  {generationMode === "single" ? (
                    currentOutputText ? (
                      isEditingOutput ? (
                        <textarea
                          rows={16}
                          value={editedOutput}
                          onChange={(e) => setEditedOutput(e.target.value)}
                          className="w-full h-full bg-transparent text-slate-800 font-sans text-xs sm:text-sm leading-relaxed focus:outline-none resize-none"
                        />
                      ) : (
                        <div className="whitespace-pre-wrap font-sans text-sm text-slate-800 leading-relaxed space-y-3">
                          {currentOutputText}
                          {isGenerating && generatingFormat === activeOutputFormat && (
                            <span className="streaming-cursor"></span>
                          )}
                        </div>
                      )
                    ) : isGenerating ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                        <div className="w-12 h-12 border-3 border-blue-100 border-t-[#027DFF] rounded-full animate-spin mb-4 shadow-sm"></div>
                        <p className="font-display font-bold text-slate-900 text-lg">
                          Generating {currentFormatMeta?.label}...
                        </p>
                        <p className="text-xs text-[#027DFF] font-mono mt-1 font-semibold">
                          ⚡ Inference in Progress ({providers.find(p => p.id === selectedProvider)?.label || selectedProvider})
                        </p>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
                        <div className="w-24 h-16 rounded-2xl bg-white border border-[#88D1F1] flex items-center justify-center mb-3 shadow-xs p-2">
                          <img src="/logo.png" alt="Sankshep.ai logo" className="h-10 w-auto object-contain" />
                        </div>
                        <h3 className="font-display font-bold text-slate-900 text-lg mb-1">
                          Studio Canvas Ready
                        </h3>
                        <p className="text-xs text-slate-500 max-w-sm leading-relaxed font-sans">
                          Select your target formats on the left and click Transform with Sankshep.ai to generate live drafts.
                        </p>
                      </div>
                    )
                  ) : (
                    /* COMPARE MODE VIEW: SIDE BY SIDE (STACKED ON MOBILE) */
                    isGenerating ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                        <div className="w-12 h-12 border-3 border-blue-100 border-t-[#027DFF] rounded-full animate-spin mb-4 shadow-sm"></div>
                        <p className="font-display font-bold text-slate-900 text-lg">
                          Running Concurrent Comparison...
                        </p>
                        <p className="text-xs text-[#027DFF] font-mono mt-1 font-semibold">
                          Comparing {selectedProviders.join(" vs ")}
                        </p>
                      </div>
                    ) : currentCompareList.length > 0 ? (
                      <div className={`grid grid-cols-1 ${currentCompareList.length === 2 ? "md:grid-cols-2" : "md:grid-cols-2 xl:grid-cols-3"} gap-4 flex-1 items-start`}>
                        {currentCompareList.map((resItem, idx) => {
                          const isOk = resItem.status === "ok";
                          const provMeta = providers.find((p) => p.id === resItem.provider);
                          const wordCount = isOk && resItem.output ? resItem.output.trim().split(/\s+/).length : 0;

                          return (
                            <div
                              key={idx}
                              className={`bg-white rounded-xl border p-4 shadow-xs flex flex-col h-full ${
                                isOk ? "border-slate-200" : "border-rose-200 bg-rose-50/40"
                              }`}
                            >
                              {/* Provider Header */}
                              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
                                <div className="flex flex-col">
                                  <div className="flex items-center gap-2">
                                    <span className="font-display font-extrabold text-sm text-slate-900">
                                      {resItem.label || provMeta?.label || resItem.provider}
                                    </span>
                                    <span
                                      className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                                        isOk ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-100 text-rose-700"
                                      }`}
                                    >
                                      {isOk ? "OK" : "Error"}
                                    </span>
                                  </div>
                                  <span className="text-[10px] font-mono text-slate-400 truncate max-w-[180px]">
                                    {resItem.model || provMeta?.model || "Standard"}
                                  </span>
                                </div>

                                {isOk && (
                                  <span className="text-[10px] font-mono text-slate-500 font-bold bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                                    {wordCount} words
                                  </span>
                                )}
                              </div>

                              {/* Content Body / Error Card */}
                              <div className="flex-1 overflow-y-auto max-h-[420px] pr-1">
                                {isOk ? (
                                  <div className="whitespace-pre-wrap font-sans text-xs sm:text-sm text-slate-800 leading-relaxed">
                                    {resItem.output}
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center justify-center text-center p-6 bg-white rounded-lg border border-rose-100 h-full">
                                    <AlertTriangle className="w-8 h-8 text-rose-500 mb-2" />
                                    <p className="text-xs font-semibold text-rose-900 mb-1">
                                      {resItem.error || "Provider request failed."}
                                    </p>
                                    <p className="text-[11px] text-slate-500 mb-3">
                                      Please select another available provider for comparison.
                                    </p>
                                  </div>
                                )}
                              </div>

                              {/* Per-Provider Actions Footer */}
                              {isOk && (
                                <div className="flex items-center justify-end gap-1.5 pt-3 mt-3 border-t border-slate-100">
                                  <button
                                    onClick={() => speakText(resItem.output)}
                                    className="p-1.5 text-slate-500 hover:text-[#027DFF] hover:bg-slate-50 rounded-lg transition-colors"
                                    title="Listen to this output"
                                  >
                                    <Volume2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleCopyText(resItem.output)}
                                    className="p-1.5 text-slate-500 hover:text-[#027DFF] hover:bg-slate-50 rounded-lg transition-colors"
                                    title="Copy this output"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDownloadOutput(resItem.output, `Sankshep_${resItem.provider}`, "md")}
                                    className="p-1.5 text-slate-500 hover:text-[#027DFF] hover:bg-slate-50 rounded-lg transition-colors"
                                    title="Download markdown"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
                        <div className="w-24 h-16 rounded-2xl bg-white border border-[#88D1F1] flex items-center justify-center mb-3 shadow-xs p-2">
                          <img src="/logo.png" alt="Sankshep.ai logo" className="h-10 w-auto object-contain" />
                        </div>
                        <h3 className="font-display font-bold text-slate-900 text-lg mb-1">
                          Comparison Mode Active
                        </h3>
                        <p className="text-xs text-slate-500 max-w-sm leading-relaxed font-sans">
                          Select 2 or more providers on the left and click Compare with Sankshep.ai to generate and compare results side by side.
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ── TAB 2: TELEMETRY & ANALYTICS DASHBOARD ───────────────────────── */}
        {activeTab === "dashboard" && (
          <div className="flex-1 flex flex-col gap-6">
            <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-200 pb-4">
              <div>
                <div className="inline-flex items-center gap-2 text-xs font-mono tracking-widest text-[#027DFF] uppercase mb-1 font-bold">
                  <span className="w-4 h-0.5 bg-[#027DFF]"></span>
                  SANKSHEP.AI PLATFORM TELEMETRY & METRICS
                </div>
                <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-900">
                  Usage Dashboard
                </h1>
              </div>
              <button
                onClick={fetchHistoryAndAnalytics}
                className="bg-[#E8F4FD] hover:bg-blue-100 text-xs font-display text-[#027DFF] px-4 py-2 rounded-xl flex items-center gap-2 transition-colors border border-[#88D1F1] font-bold"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh Data
              </button>
            </div>

            {/* Metric KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bright-glass rounded-2xl p-5 shadow-sm border border-slate-200">
                <span className="text-xs font-mono text-slate-500 uppercase tracking-wider block mb-1 font-bold">Total Transformations</span>
                <span className="font-display text-4xl font-extrabold text-slate-900">
                  {analytics.total_runs || history.length}
                </span>
                <span className="text-[11px] font-mono text-emerald-600 block mt-2 font-bold">● Active Session</span>
              </div>

              <div className="bright-glass rounded-2xl p-5 shadow-sm border border-slate-200">
                <span className="text-xs font-mono text-slate-500 uppercase tracking-wider block mb-1 font-bold">Words Ingested</span>
                <span className="font-display text-4xl font-extrabold text-slate-900">
                  {(analytics.total_input_words || 0).toLocaleString()}
                </span>
                <span className="text-[11px] font-mono text-slate-400 block mt-2">Source Document Tokens</span>
              </div>

              <div className="bright-glass rounded-2xl p-5 shadow-sm border border-slate-200">
                <span className="text-xs font-mono text-slate-500 uppercase tracking-wider block mb-1 font-bold">Words Generated</span>
                <span className="font-display text-4xl font-extrabold text-[#027DFF]">
                  {(analytics.total_output_words || 0).toLocaleString()}
                </span>
                <span className="text-[11px] font-mono text-[#027DFF] block mt-2 font-bold">AI Artifact Volume</span>
              </div>

              <div className="bright-glass rounded-2xl p-5 shadow-sm border border-slate-200">
                <span className="text-xs font-mono text-slate-500 uppercase tracking-wider block mb-1 font-bold">Available AI Providers</span>
                <span className="font-display text-2xl font-extrabold text-[#027DFF] truncate block">
                  {providers.filter(p => p.available).length} Configured
                </span>
                <span className="text-[11px] font-mono text-slate-400 block mt-2">
                  {providers.filter(p => p.available).map(p => p.label).join(", ") || "None"}
                </span>
              </div>
            </div>

            {/* History Records Table */}
            <div className="bright-glass rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <h3 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
                  <History className="w-5 h-5 text-[#027DFF]" />
                  Transformation History Log
                </h3>
                <input
                  type="text"
                  placeholder="Filter format..."
                  value={historyFilter}
                  onChange={(e) => setHistoryFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 font-mono focus:outline-none focus:border-[#027DFF]"
                />
              </div>

              {history.length === 0 ? (
                <p className="text-center text-slate-400 py-12 text-sm font-mono">
                  No transformation records found. Run one in Studio Canvas!
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs font-mono text-left">
                    <thead className="bg-slate-50 text-slate-600 uppercase border-b border-slate-200 font-bold">
                      <tr>
                        <th className="px-4 py-3">Format & Provider</th>
                        <th className="px-4 py-3 text-right">In Words</th>
                        <th className="px-4 py-3 text-right">Out Words</th>
                        <th className="px-4 py-3 text-right">Delta</th>
                        <th className="px-4 py-3 text-right">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {history
                        .filter((r) => r.transformation_type.toLowerCase().includes(historyFilter.toLowerCase()))
                        .map((row, idx) => {
                          const delta =
                            row.input_words > 0
                              ? Math.round((1 - row.output_words / row.input_words) * 100)
                              : null;
                          const baseType = row.transformation_type.split(":")[0];
                          const provSuffix = row.transformation_type.includes(":") ? row.transformation_type.split(":")[1] : null;
                          const fmtMeta = OUTPUT_FORMATS.find((f) => f.id === baseType);
                          return (
                            <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                              <td className="px-4 py-3.5 font-bold text-slate-900 flex items-center gap-2">
                                <span className="text-base">{fmtMeta?.icon || "📄"}</span>
                                <span>{fmtMeta?.label || baseType}</span>
                                {provSuffix && (
                                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
                                    {provSuffix}
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3.5 text-right text-slate-600 font-medium">{row.input_words}</td>
                              <td className="px-4 py-3.5 text-right text-[#027DFF] font-bold">{row.output_words}</td>
                              <td className="px-4 py-3.5 text-right">
                                {delta !== null ? (
                                  <span
                                    className={`font-bold ${
                                      delta > 0
                                        ? "text-emerald-600"
                                        : delta < 0
                                        ? "text-amber-600"
                                        : "text-slate-600"
                                    }`}
                                  >
                                    {delta > 0 ? `-${delta}%` : delta < 0 ? `+${Math.abs(delta)}%` : "0%"}
                                  </span>
                                ) : (
                                  "—"
                                )}
                              </td>
                              <td className="px-4 py-3.5 text-right text-slate-400">{row.created_at}</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* ── FOOTER ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-slate-50 py-6 px-6 text-xs font-mono text-slate-500 relative z-10">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-600 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-[#027DFF] shadow-[0_0_8px_#027DFF]"></span>
            <span>Sankshep.ai · Multi-Provider AI Content Transformation Platform</span>
          </div>
          <div className="flex items-center gap-6 text-[#027DFF] font-bold">
            <span>Powered by Sankshep.ai Multi-Engine Registry</span>
          </div>
        </div>
      </footer>
    </div>
  );
}