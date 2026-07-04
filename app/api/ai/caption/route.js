import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/guards";
import { isAiEnabled, suggestCaption } from "@/lib/ai";

export async function POST(req) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!isAiEnabled()) return NextResponse.json({ error: "AI helpers are not enabled." }, { status: 404 });

  const { hint } = await req.json().catch(() => ({}));
  const cleanHint = String(hint || "").trim().slice(0, 500);
  if (!cleanHint) return NextResponse.json({ error: "Tell it what the post is about first." }, { status: 400 });

  try {
    const suggestion = await suggestCaption(cleanHint);
    return NextResponse.json({ suggestion });
  } catch (e) {
    return NextResponse.json({ error: "Could not generate a caption right now." }, { status: 502 });
  }
}
