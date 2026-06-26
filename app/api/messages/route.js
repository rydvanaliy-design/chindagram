import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/guards";
import { notify } from "@/lib/notify";

export async function POST(req) {
  const me = await requireUserId();
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { recipientId, body } = await req.json();
  const text = String(body || "").trim();
  if (!recipientId || recipientId === me) return NextResponse.json({ error: "Invalid recipient." }, { status: 400 });
  if (!text) return NextResponse.json({ error: "Message is empty." }, { status: 400 });
  if (text.length > 2000) return NextResponse.json({ error: "Message too long." }, { status: 400 });

  const recipient = await prisma.user.findUnique({ where: { id: recipientId }, select: { id: true, disabled: true } });
  if (!recipient || recipient.disabled) return NextResponse.json({ error: "That person can't receive messages." }, { status: 400 });

  const [aId, bId] = [me, recipientId].sort();
  const convo = await prisma.conversation.upsert({ where: { aId_bId: { aId, bId } }, update: { updatedAt: new Date() }, create: { aId, bId } });

  const message = await prisma.message.create({ data: { conversationId: convo.id, senderId: me, body: text } });
  await notify({ recipientId, actorId: me, type: "MESSAGE" });

  return NextResponse.json({
    conversationId: convo.id,
    message: { id: message.id, body: message.body, senderId: me, createdAt: message.createdAt.toISOString() },
  }, { status: 201 });
}
