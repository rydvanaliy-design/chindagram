import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/guards";

export async function POST(req, { params }) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const postId = params.id;
  const existing = await prisma.save.findUnique({ where: { userId_postId: { userId, postId } } });
  if (existing) await prisma.save.delete({ where: { id: existing.id } });
  else await prisma.save.create({ data: { userId, postId } });

  return NextResponse.json({ saved: !existing });
}
