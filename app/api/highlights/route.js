import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/guards";

export async function POST(req) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { name } = await req.json().catch(() => ({}));
  const clean = String(name || "").trim().slice(0, 40);
  if (!clean) return NextResponse.json({ error: "Give the highlight a name." }, { status: 400 });

  const highlight = await prisma.highlight.create({ data: { name: clean, ownerId: userId } });
  return NextResponse.json({ highlight }, { status: 201 });
}
