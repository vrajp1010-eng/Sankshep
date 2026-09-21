export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const OUTPUT_FORMATS = [
  { id: "summary", label: "Summary", icon: "summary" },
  { id: "linkedin_post", label: "LinkedIn Post", icon: "linkedin" },
  { id: "blog_post", label: "Blog Post", icon: "blog" },
  { id: "text_to_slides", label: "Presentation", icon: "slides" },
  { id: "video_script", label: "Video Script", icon: "video" },
  { id: "email_newsletter", label: "Email Newsletter", icon: "email" },
  { id: "faq_section", label: "FAQ", icon: "faq" },
  { id: "twitter_thread", label: "X Thread", icon: "x" },
  { id: "seo_meta", label: "SEO Meta", icon: "seo" },
  { id: "translate", label: "Translation", icon: "translate" },
  { id: "key_points", label: "Key Points", icon: "keypoints" },
  { id: "simplify", label: "ELI5", icon: "simplify" },
  { id: "captions_srt", label: "Captions", icon: "captions" },
  { id: "alt_text", label: "Alt Text", icon: "alt" },
];

export const DETAIL_OPTIONS = [
  { id: "Concise", label: "Concise" },
  { id: "Balanced", label: "Balanced" },
  { id: "Comprehensive", label: "Comprehensive" },
];

export const TONE_OPTIONS = [
  { id: "Thought Leadership", label: "Thought Leadership" },
  { id: "Professional", label: "Professional" },
  { id: "Casual & Friendly", label: "Casual & Conversational" },
  { id: "Persuasive & Sales", label: "Persuasive Copy" },
  { id: "Academic & Analytical", label: "Academic & Data-Driven" },
  { id: "Punchy & Viral", label: "Punchy Viral Hook" },
  { id: "Storytelling & Narrative", label: "Narrative Storytelling" },
];

export const LANGUAGES = [
  "Hindi", "Spanish", "French", "German", "Japanese", "Tamil",
  "Bengali", "Telugu", "Marathi", "Mandarin Chinese", "Arabic",
  "Russian", "Portuguese", "Italian", "Korean",
];

export const SAMPLE_TEXT = `Artificial Intelligence in Healthcare: Accelerating Diagnostics and Precision Medicine

The convergence of large language models, computer vision, and predictive bioinformatics is fundamentally transforming clinical healthcare. Diagnostic pipelines that once required weeks of laboratory correlation, pathology reviews, and manual radiological inspections can now be cross-referenced against global clinical knowledge in seconds.

Key Clinical Breakthroughs:
1. Ultra-Early Oncology Detection: Deep learning architectures trained on multi-spectral CT scans and mammograms achieve over 94.8% sensitivity, identifying micro-nodules years before symptomatic presentation.
2. Ambient Clinical Documentation: Automated scribes capture doctor-patient conversations and synthesize standardized EHR medical charts, reducing physician burnout by 42%.
3. In Silico Molecular Simulation: Generative diffusion models simulate protein-ligand binding kinetics, cutting drug discovery timelines from 6 years to under 18 months.

While transformative, deployment requires rigorous validation across edge hardware, patient privacy safeguards (HIPAA/GDPR), bias mitigation in diverse demographic datasets, and offline air-gapped readiness.`;
