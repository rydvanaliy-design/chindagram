import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/guards";
import { notify } from "@/lib/notify";
import { visibleToViewer } from "@/lib/posts";
import { postVisibleToViewer } from "@/lib/privacy";
import { toSharedPostProps, sharedPostInclude } from "@/lib/messages";

export async function POST(req) {
  const me = await requireUserId();
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { recipientId, body, sharedPostId } = await req.json();
  const text = String(body || "").trim();
  if (!recipientId || recipientId === me) return NextResponse.json({ error: "Invalid recipient." }, { status: 400 });
  // A shared post can stand in for text, but a message still needs something in it.
  if (!text && !sharedPostId) return NextResponse.json({ error: "Message is empty." }, { status: 400 });
  if (text.length > 2000) return NextResponse.json({ error: "Message too long." }, { status: 400 });

  const recipient = await prisma.user.findUnique({ where: { id: recipientId }, select: { id: true, disabled: true } });
  if (!recipient || recipient.disabled) return NextResponse.json({ error: "That person can't receive messages." }, { status: 400 });

  const blocked = await prisma.block.findFirst({
    where: { OR: [{ blockerId: me, blockedId: recipientId }, { blockerId: recipientId, blockedId: me }] },
  });
  if (blocked) return NextResponse.json({ error: "You can't message this person." }, { status: 403 });

  let resolvedSharedPostId = null;
  if (sharedPostId) {
    const original = await prisma.post.findFirst({
      where: { AND: [{ id: sharedPostId }, visibleToViewer(me), postVisibleToViewer(me)] },
      select: { id: true, repostOfId: true },
    });
    if (!original) return NextResponse.json({ error: "That post is no longer available." }, { status: 400 });
    resolvedSharedPostId = original.repostOfId || original.id;
  }

  const [aId, bId] = [me, recipientId].sort();
  const convo = await prisma.conversation.upsert({ where: { aId_bId: { aId, bId } }, update: { updatedAt: new Date() }, create: { aId, bId } });

  const message = await prisma.message.create({
    data: { conversationId: convo.id, senderId: me, body: text, sharedPostId: resolvedSharedPostId },
    include: { sharedPost: sharedPostInclude },
  });
  await notify({ recipientId, actorId: me, type: "MESSAGE" });

  return NextResponse.json({
    conversationId: convo.id,
    message: {
      id: message.id, body: message.body, senderId: me, createdAt: message.createdAt.toISOString(),
      sharedPost: toSharedPostProps(message.sharedPost, me),
    },
  }, { status: 201 });
}
