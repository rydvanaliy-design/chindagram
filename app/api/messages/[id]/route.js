import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/guards";

export async function GET(req, { params }) {
  const me = await requireUserId();
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const convo = await prisma.conversation.findUnique({ where: { id: params.id } });
  if (!convo || (convo.aId !== me && convo.bId !== me)) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const after = req.nextUrl.searchParams.get("after");
  const where = { conversationId: convo.id };
  if (after) where.createdAt = { gt: new Date(after) };

  const messages = await prisma.message.findMany({ where, orderBy: { createdAt: "asc" }, take: 100 });
  return NextResponse.json({
    messages: messages.map((m) => ({ id: m.id, body: m.removed ? null : m.body, removed: m.removed, senderId: m.senderId, createdAt: m.createdAt.toISOString() })),
  });
}
