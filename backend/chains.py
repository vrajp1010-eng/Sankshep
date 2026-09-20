import os
from typing import Optional
from dotenv import load_dotenv
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from providers import get_llm_for_provider, get_default_provider_id

load_dotenv()

def get_llm(provider_id: Optional[str] = None, streaming: bool = True):
    """
    Initializes the LLM using the central provider registry.
    """
    return get_llm_for_provider(provider_id=provider_id, streaming=streaming)

# Comprehensive prompt templates matching the multi-format transformation suite
TEMPLATES = {
    "blog_post": (
        "You are an expert content strategist and copywriter. "
        "Transform the provided source text into an engaging, well-structured, and comprehensive blog post.\n"
        "{custom_guidance}\n"
        "Guidelines:\n"
        "- Create an irresistible, SEO-optimized title (H1)\n"
        "- Write a captivating opening hook\n"
        "- Organize body content into logical sections with clear H2/H3 subheadings\n"
        "- Use bullet points for readability and highlight key insights\n"
        "- Conclude with a strong summary and actionable takeaway\n\n"
        "Source Text:\n{text}"
    ),
    "linkedin_post": (
        "You are a top 1% LinkedIn creator and thought leader. "
        "Transform the provided source text into a viral, high-engagement LinkedIn post.\n"
        "{custom_guidance}\n"
        "Guidelines:\n"
        "- Start with a powerful 1-2 line scroll-stopping hook\n"
        "- Use short, punchy paragraphs with line breaks for optimal mobile reading\n"
        "- Highlight 3-5 core takeaways with emoji bullet points\n"
        "- End with an engaging conversation-starting question to spark comments\n"
        "- Add 3-5 relevant hashtags at the bottom\n\n"
        "Source Text:\n{text}"
    ),
    "twitter_thread": (
        "You are a master of viral Twitter/X storytelling. "
        "Transform the source text into an insightful, high-value Twitter thread (5-8 tweets).\n"
        "{custom_guidance}\n"
        "Guidelines:\n"
        "- Tweet 1: High-impact hook that makes readers click 'show thread'\n"
        "- Number each tweet clearly in the format: 1/ , 2/ , 3/ ...\n"
        "- Keep each tweet focused on a single actionable insight or compelling fact\n"
        "- Penultimate/Final tweet: Summary of key lessons + call to action (Retweet / Follow)\n\n"
        "Source Text:\n{text}"
    ),
    "summary": (
        "You are an executive intelligence analyst. "
        "Provide a structured, executive-level summary of the source text.\n"
        "{custom_guidance}\n"
        "Structure:\n"
        "## 📌 TL;DR\n"
        "[2-3 sentence overview of the core message]\n\n"
        "## 🔑 Key Findings & Takeaways\n"
        "[Bullet points highlighting critical points]\n\n"
        "## 💡 Strategic Implications & Conclusions\n"
        "[What this means and next steps or broader context]\n\n"
        "Source Text:\n{text}"
    ),
    "email_newsletter": (
        "You are a professional email newsletter editor. "
        "Transform the source text into a ready-to-send, engaging email newsletter edition.\n"
        "{custom_guidance}\n"
        "Include:\n"
        "- 3 High-converting Subject Line options\n"
        "- Preview Text snippet (1 sentence)\n"
        "- Friendly, conversational greeting\n"
        "- Quick overview intro\n"
        "- Core body breakdown with bullet points and bold highlights\n"
        "- Clear Call-to-Action (CTA)\n"
        "- Warm professional sign-off\n\n"
        "Source Text:\n{text}"
    ),
    "video_script": (
        "You are a professional video producer and scriptwriter. "
        "Transform the source text into a complete, ready-to-record video script (suitable for YouTube, TikTok, or Reels).\n"
        "{custom_guidance}\n"
        "Format with clear cues:\n"
        "[0:00 - 0:15] [Visual Cue / Hook]: Host action, graphics, B-roll\n"
        "[Host Narration]: Spoken word word-for-word\n\n"
        "Break down into: Hook (0-15s), Intro, 3 Key Points/Demos, Conclusion & Call-to-Action (Subscribe/Like).\n\n"
        "Source Text:\n{text}"
    ),
    "seo_meta": (
        "You are a technical SEO expert. Generate high-performance SEO metadata based on the source text.\n"
        "{custom_guidance}\n"
        "Output the following structured elements:\n"
        "- **Page Title Tag**: (50-60 characters, primary keyword first)\n"
        "- **Meta Description**: (140-155 characters, click-worthy with call-to-action)\n"
        "- **Primary Keyword**: \n"
        "- **Secondary / LSI Keywords**: (5-8 comma-separated keywords)\n"
        "- **Recommended URL Slug**: (lowercase, hyphen-separated)\n"
        "- **Social Share OG Title & OG Description**:\n\n"
        "Source Text:\n{text}"
    ),
    "faq_section": (
        "You are a subject-matter expert. Create a comprehensive FAQ (Frequently Asked Questions) section based on the source text.\n"
        "{custom_guidance}\n"
        "Format as 5 to 8 questions and concise, authoritative answers directly grounded in the content:\n\n"
        "### Q: [Question]\n"
        "A: [Clear, direct answer]\n\n"
        "Source Text:\n{text}"
    ),
    "text_to_slides": (
        "Convert the following text into a structured presentation slide deck outline.\n"
        "{custom_guidance}\n"
        "CRITICAL FORMATTING REQUIREMENT (Must adhere strictly so the PowerPoint exporter can parse it):\n"
        "Slide 1: <Slide Title>\n"
        "- <Bullet point 1>\n"
        "- <Bullet point 2>\n"
        "- <Bullet point 3>\n\n"
        "Slide 2: <Slide Title>\n"
        "- <Bullet point 1>\n"
        "- <Bullet point 2>\n"
        "- <Bullet point 3>\n\n"
        "Create 4 to 7 informative slides covering the full scope of the text.\n\n"
        "Source Text:\n{text}"
    ),
    "simplify": (
        "You are an expert communicator who explains complex concepts simply (ELI5 / 5th-grade reading level).\n"
        "Rewrite the source text so that anyone, including a 10-year-old, can easily understand it.\n"
        "{custom_guidance}\n"
        "- Use everyday language, vivid analogies, and short sentences\n"
        "- Break down technical terms and acronyms into plain words\n"
        "- Keep it engaging and crystal clear\n\n"
        "Source Text:\n{text}"
    ),
    "captions_srt": (
        "Convert the following source text into a properly formatted SRT subtitle/caption sequence.\n"
        "{custom_guidance}\n"
        "Format as valid SubRip (.srt):\n"
        "1\n"
        "00:00:00,000 --> 00:00:03,500\n"
        "[First subtitle line]\n\n"
        "2\n"
        "00:00:03,500 --> 00:00:07,000\n"
        "[Second subtitle line]\n\n"
        "Source Text:\n{text}"
    ),
    "alt_text": (
        "You are an accessibility and content specialist. "
        "Generate alt-text descriptions, accessibility summaries, and social image suggestions based on the source text.\n"
        "{custom_guidance}\n"
        "Output:\n"
        "1. **Core Alt-Text Summary**: (Accurate, concise 1-2 sentence screen reader description)\n"
        "2. **Detailed Graphic Description**: (For complex diagrams or charts)\n"
        "3. **3 Social Post Image Ideas & Text Overlay Suggestions**:\n\n"
        "Source Text:\n{text}"
    ),
    "translate": (
        "Translate the following text accurately and naturally into {target_language}.\n"
        "{custom_guidance}\n"
        "Ensure native fluency, cultural appropriateness, and retain all markdown structure and formatting.\n\n"
        "Source Text:\n{text}"
    ),
    "tone_formal": (
        "Rewrite the following text to have a highly polished, professional, and formal corporate tone.\n"
        "{custom_guidance}\n"
        "Ensure elevated vocabulary, clear structure, and authoritative phrasing.\n\n"
        "Source Text:\n{text}"
    ),
    "tone_casual": (
        "Rewrite the following text to have a warm, friendly, casual, and conversational tone.\n"
        "{custom_guidance}\n"
        "Make it feel like talking to a trusted friend or colleague over coffee.\n\n"
        "Source Text:\n{text}"
    ),
    "key_points": (
        "Extract the most essential key points, core takeaways, and actionable items from the following text.\n"
        "{custom_guidance}\n"
        "Present as a clean, structured bulleted list with bold key phrases:\n\n"
        "Source Text:\n{text}"
    ),
}

# Alias mappings for backwards compatibility and easy selection
ALIASES = {
    "summarize": "summary",
    "slides": "text_to_slides",
    "slide_outline": "text_to_slides",
    "twitter": "twitter_thread",
    "x_thread": "twitter_thread",
    "linkedin": "linkedin_post",
    "blog": "blog_post",
    "newsletter": "email_newsletter",
    "video": "video_script",
    "faq": "faq_section",
    "seo": "seo_meta",
    "captions": "captions_srt",
}

def resolve_transformation_type(trans_type: str) -> str:
    cleaned = trans_type.lower().strip()
    return ALIASES.get(cleaned, cleaned)

def build_custom_guidance(tone: str = None, brand_voice_name: str = None, brand_voice_notes: str = None) -> str:
    guidelines = []
    if tone and tone.lower() != "default" and tone.lower() != "auto":
        guidelines.append(f"Desired Tone of Voice: {tone}")
    if brand_voice_name:
        guidelines.append(f"Brand Identity: {brand_voice_name}")
    if brand_voice_notes:
        guidelines.append(f"Brand Voice Rules & Style Guidelines: {brand_voice_notes}")
    
    if guidelines:
        return "Special Directives:\n" + "\n".join(f"- {g}" for g in guidelines) + "\n"
    return ""

def get_chain(transformation_type: str, provider_id: Optional[str] = None, streaming: bool = True):
    """Builds and returns an LCEL chain for the given transformation type and provider."""
    resolved_type = resolve_transformation_type(transformation_type)
    if resolved_type not in TEMPLATES:
        raise ValueError(f"Unsupported transformation type: '{transformation_type}'. Available: {list(TEMPLATES.keys())}")

    llm = get_llm(provider_id=provider_id, streaming=streaming)
    prompt = PromptTemplate.from_template(TEMPLATES[resolved_type])
    return prompt | llm | StrOutputParser()

def build_input_vars(
    text: str,
    transformation_type: str,
    target_language: str = None,
    tone: str = None,
    brand_voice_name: str = None,
    brand_voice_notes: str = None,
) -> dict:
    resolved_type = resolve_transformation_type(transformation_type)
    custom_guidance = build_custom_guidance(tone, brand_voice_name, brand_voice_notes)
    
    input_vars = {
        "text": text,
        "custom_guidance": custom_guidance,
    }
    
    if resolved_type == "translate":
        input_vars["target_language"] = target_language or "English"
        
    return input_vars