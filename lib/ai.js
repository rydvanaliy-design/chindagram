// AI helpers (Phase 10): caption suggestions, EN<->TH translation, writing
// assist. Fully optional — gated on ANTHROPIC_API_KEY. Callers must check
// isAiEnabled() and hide their UI when it's false; the API routes also
// re-check server-side so a direct call can't bypass the gate.
//
// Deliberately no @anthropic-ai/sdk dependency — this project stays plain
// JS with minimal deps, and a couple of short-lived fetch() calls don't need
// a whole SDK. Uses Haiku (cheap/fast) since these are short, low-stakes helper calls.

const MODEL = "claude-haiku-4-5-20251001";
const API_URL = "https://api.anthropic.com/v1/messages";

export function isAiEnabled() {
  return !!process.env.ANTHROPIC_API_KEY;
}

async function callClaude(system, userText, maxTokens = 300) {
  if (!isAiEnabled()) throw new Error("AI helpers are not configured.");
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: userText }],
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Claude API error ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = await res.json();
  return (data.content || []).map((b) => b.text || "").join("").trim();
}

const CAPTION_SYSTEM = `You write short, fun, family-friendly captions for posts on a school social app used by students, teachers, and parents in Thailand. Keep it under 200 characters. No hashtags unless the hint asks for them. Wholesome tone, appropriate for minors. Reply with ONLY the caption text, nothing else — no quotes, no preamble.`;

const IMPROVE_SYSTEM = `You lightly polish a school social app post/comment draft: fix grammar, tighten wording, keep the author's own voice and meaning and language (don't translate). Keep it wholesome and appropriate for minors. Reply with ONLY the improved text, nothing else — no quotes, no preamble.`;

const TRANSLATE_SYSTEM = `Translate the given text between Thai and English (translate TO the requested target language). Preserve emojis, @mentions, and #hashtags exactly as written — never translate a handle or hashtag. Reply with ONLY the translated text, nothing else — no quotes, no preamble, no explanation.`;

export async function suggestCaption(hint) {
  return callClaude(CAPTION_SYSTEM, `Write a caption for a post about: ${hint}`, 150);
}

export async function improveText(draft) {
  return callClaude(IMPROVE_SYSTEM, draft, 300);
}

export async function translateText(text, targetLang) {
  const langName = targetLang === "th" ? "Thai" : "English";
  return callClaude(TRANSLATE_SYSTEM, `Target language: ${langName}\n\nText:\n${text}`, 400);
}
