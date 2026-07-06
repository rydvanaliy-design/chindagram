import { NextResponse } from "next/server";
import { rateLimit, tooManyResponse } from "@/lib/ratelimit";
import { requireUserId } from "@/lib/guards";
import { isAiEnabled, translateText } from "@/lib/ai";
import { isLocale } from "@/lib/i18n/locales";

export async function POST(req) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const posted = rateLimit(`ai:${userId}`, 20, 10 * 60 * 1000);
  if (!posted.ok) return tooManyResponse(posted.retryAfterSec);
  if (!isAiEnabled()) return NextResponse.json({ error: "AI helpers are not enabled." }, { status: 404 });

  const { text, target } = await req.json().catch(() => ({}));
  const cleanText = String(text || "").trim().slice(0, 2000);
  if (!cleanText) return NextResponse.json({ error: "Nothing to translate." }, { status: 400 });
  if (!isLocale(target)) return NextResponse.json({ error: "Unknown target language." }, { status: 400 });

  try {
    const translation = await translateText(cleanText, target);
    return NextResponse.json({ translation });
  } catch (e) {
    return NextResponse.json({ error: "Could not translate this right now." }, { status: 502 });
  }
}
