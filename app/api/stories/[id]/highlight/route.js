import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/guards";

// GET: list my highlights, for the "save to highlight" picker.
export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const highlights = await prisma.highlight.findMany({ where: { ownerId: userId }, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ highlights });
}

// POST { highlightId } (or null to remove): assign/detach this story's highlight.
export async function POST(req, { params }) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const story = await prisma.story.findUnique({ where: { id: params.id }, select: { authorId: true } });
  if (!story || story.authorId !== userId) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const { highlightId } = await req.json().catch(() => ({}));
  if (highlightId) {
    const highlight = await prisma.highlight.findUnique({ where: { id: highlightId }, select: { ownerId: true } });
    if (!highlight || highlight.ownerId !== userId) return NextResponse.json({ error: "Highlight not found." }, { status: 404 });
  }

  await prisma.story.update({ where: { id: params.id }, data: { highlightId: highlightId || null } });
  return NextResponse.json({ ok: true, highlightId: highlightId || null });
}
