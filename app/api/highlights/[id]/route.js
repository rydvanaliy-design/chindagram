import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/guards";

export async function PATCH(req, { params }) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const highlight = await prisma.highlight.findUnique({ where: { id: params.id }, select: { ownerId: true } });
  if (!highlight || highlight.ownerId !== userId) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const { name } = await req.json().catch(() => ({}));
  const clean = String(name || "").trim().slice(0, 40);
  if (!clean) return NextResponse.json({ error: "Give the highlight a name." }, { status: 400 });

  const updated = await prisma.highlight.update({ where: { id: params.id }, data: { name: clean } });
  return NextResponse.json({ highlight: updated });
}

export async function DELETE(_req, { params }) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const highlight = await prisma.highlight.findUnique({ where: { id: params.id }, select: { ownerId: true } });
  if (!highlight || highlight.ownerId !== userId) return NextResponse.json({ error: "Not found." }, { status: 404 });

  // Stories aren't deleted — they're just detached (Story.highlightId SetNull).
  await prisma.highlight.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
