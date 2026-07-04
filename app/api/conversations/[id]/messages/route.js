import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/guards";
import { notify } from "@/lib/notify";
import { visibleToViewer } from "@/lib/posts";
import { postVisibleToViewer } from "@/lib/privacy";
import { isConversationMember, messageInclude, toMessageProps } from "@/lib/messages";
import { publish } from "@/lib/messageStream";

// Poll for new messages (?after=<ISO timestamp>). Every successful fetch
// marks the conversation read up to now — opening/polling a thread IS
// reading it, same as any chat app.
export async function GET(req, { params }) {
  const me = await requireUserId();
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!(await isConversationMember(params.id, me))) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const after = req.nextUrl.searchParams.get("after");
  const where = { conversationId: params.id };
  if (after) where.createdAt = { gt: new Date(after) };

  const messages = await prisma.message.findMany({ where, orderBy: { createdAt: "asc" }, take: 100, include: messageInclude });

  await prisma.conversationMember.update({
    where: { conversationId_userId: { conversationId: params.id, userId: me } },
    data: { lastReadAt: new Date() },
  });

  return NextResponse.json({ messages: messages.map((m) => toMessageProps(m, me)) });
}

export async function POST(req, { params }) {
  const me = await requireUserId();
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!(await isConversationMember(params.id, me))) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const { body, sharedPostId, parentId, mediaUrl, mediaType } = await req.json().catch(() => ({}));
  const text = String(body || "").trim();
  if (!text && !sharedPostId && !mediaUrl) return NextResponse.json({ error: "Message is empty." }, { status: 400 });
  if (text.length > 2000) return NextResponse.json({ error: "Message too long." }, { status: 400 });

  let resolvedSharedPostId = null;
  if (sharedPostId) {
    const original = await prisma.post.findFirst({
      where: { AND: [{ id: sharedPostId }, visibleToViewer(me), postVisibleToViewer(me)] },
      select: { id: true, repostOfId: true },
    });
    if (!original) return NextResponse.json({ error: "That post is no longer available." }, { status: 400 });
    resolvedSharedPostId = original.repostOfId || original.id;
  }

  let resolvedParentId = null;
  if (parentId) {
    const parent = await prisma.message.findFirst({ where: { id: parentId, conversationId: params.id }, select: { id: true } });
    if (parent) resolvedParentId = parent.id;
  }

  const message = await prisma.message.create({
    data: {
      conversationId: params.id, senderId: me, body: text,
      sharedPostId: resolvedSharedPostId, parentId: resolvedParentId,
      mediaUrl: mediaUrl || null, mediaType: mediaUrl ? mediaType : null,
    },
    include: messageInclude,
  });

  await prisma.conversation.update({ where: { id: params.id }, data: { updatedAt: new Date() } });
  await prisma.conversationMember.update({
    where: { conversationId_userId: { conversationId: params.id, userId: me } },
    data: { lastReadAt: new Date() },
  });

  const others = await prisma.conversationMember.findMany({ where: { conversationId: params.id, userId: { not: me } }, select: { userId: true } });
  for (const o of others) await notify({ recipientId: o.userId, actorId: me, type: "MESSAGE" });

  // A brand-new message has no reactions yet, so this shape is identical for
  // every subscriber regardless of who's viewing — safe to broadcast as-is.
  publish(params.id, { kind: "message", message: toMessageProps(message, me) });

  return NextResponse.json({ message: toMessageProps(message, me) }, { status: 201 });
}
