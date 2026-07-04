import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/guards";
import { isAiEnabled, improveText } from "@/lib/ai";

export async function POST(req) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!isAiEnabled()) return NextResponse.json({ error: "AI helpers are not enabled." }, { status: 404 });

  const { draft } = await req.json().catch(() => ({}));
  const cleanDraft = String(draft || "").trim().slice(0, 2000);
  if (!cleanDraft) return NextResponse.json({ error: "Write a draft first." }, { status: 400 });

  try {
    const suggestion = await improveText(cleanDraft);
    return NextResponse.json({ suggestion });
  } catch (e) {
    return NextResponse.json({ error: "Could not improve this text right now." }, { status: 502 });
  }
}
