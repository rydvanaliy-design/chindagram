import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/guards";
import { isReaction } from "@/lib/reactions";
import { isConversationMember } from "@/lib/messages";
import { publish } from "@/lib/realtime";

// Toggle a reaction on a message — same "tap again removes it, tap a
// different one swaps it" pattern as post reactions. Publishes a
// reaction-update event so it appears live for every conversation member.
export async function POST(req, { params }) {
  const me = await requireUserId();
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { type } = await req.json().catch(() => ({}));
  if (!isReaction(type)) return NextResponse.json({ error: "Bad request." }, { status: 400 });

  const message = await prisma.message.findUnique({ where: { id: params.messageId }, select: { conversationId: true, removed: true } });
  if (!message || message.removed) return NextResponse.json({ error: "Message not found." }, { status: 404 });
  if (!(await isConversationMember(message.conversationId, me))) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const existing = await prisma.messageReaction.findUnique({ where: { messageId_userId: { messageId: params.messageId, userId: me } } });
  if (existing && existing.type === type) {
    await prisma.messageReaction.delete({ where: { id: existing.id } });
  } else if (existing) {
    await prisma.messageReaction.update({ where: { id: existing.id }, data: { type } });
  } else {
    await prisma.messageReaction.create({ data: { messageId: params.messageId, userId: me, type } });
  }

  const rows = await prisma.messageReaction.findMany({ where: { messageId: params.messageId }, select: { type: true, userId: true } });
  const reactions = rows.reduce((acc, r) => { acc[r.type] = (acc[r.type] || 0) + 1; return acc; }, {});

  publish(message.conversationId, { kind: "reaction", messageId: params.messageId, reactions });

  return NextResponse.json({ reactions, myReaction: rows.find((r) => r.userId === me)?.type || null });
}
