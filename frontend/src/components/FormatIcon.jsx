import {
  Captions,
  CircleHelp,
  FileText,
  GraduationCap,
  Image,
  Languages,
  List,
  Mail,
  Newspaper,
  Presentation,
  Search,
  Video,
} from "lucide-react";

const ICON_SIZE = 18;
const STROKE = 1.75;

export function XLogo({ className = "h-[18px] w-[18px]" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.727-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function LinkedInLogo({ className = "h-[18px] w-[18px]" }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.47-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22 0H2C.9 0 0 .9 0 2v20c0 1.1.9 2 2 2h20c1.1 0 2-.9 2-2V2c0-1.1-.9-2-2-2z" />
    </svg>
  );
}

const MAP = {
  summary: FileText,
  blog: Newspaper,
  slides: Presentation,
  video: Video,
  email: Mail,
  faq: CircleHelp,
  seo: Search,
  translate: Languages,
  simplify: GraduationCap,
  captions: Captions,
  alt: Image,
  keypoints: List,
};

export function FormatIcon({ name, className = "h-[18px] w-[18px]" }) {
  if (name === "x") return <XLogo className={className} />;
  if (name === "linkedin") return <LinkedInLogo className={className} />;
  const Icon = MAP[name] || FileText;
  return <Icon className={className} size={ICON_SIZE} strokeWidth={STROKE} aria-hidden="true" />;
}
