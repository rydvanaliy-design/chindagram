import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/guards";
import { notify } from "@/lib/notify";
import { findOrCreate1to1, messageInclude, toMessageProps } from "@/lib/messages";
import { isBlockedEitherWay } from "@/lib/privacy";
import { publish } from "@/lib/realtime";

// Replying (or quick-reacting with an emoji) to someone's story sends them a
// private DM that embeds the story, same as Instagram — there's no public
// "story comment" surface.
export async function POST(req, { params }) {
  const me = await requireUserId();
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const story = await prisma.story.findUnique({ where: { id: params.id }, select: { authorId: true } });
  if (!story) return NextResponse.json({ error: "This story is no longer available." }, { status: 404 });
  if (story.authorId === me) return NextResponse.json({ error: "You can't reply to your own story." }, { status: 400 });
  if (await isBlockedEitherWay(me, story.authorId)) return NextResponse.json({ error: "Not available." }, { status: 400 });

  const { body } = await req.json().catch(() => ({}));
  const text = String(body || "").trim().slice(0, 2000);
  if (!text) return NextResponse.json({ error: "Write a reply first." }, { status: 400 });

  const conversation = await findOrCreate1to1(me, story.authorId);
  const message = await prisma.message.create({
    data: { conversationId: conversation.id, senderId: me, body: text, storyReplyId: params.id },
    include: messageInclude,
  });
  await prisma.conversation.update({ where: { id: conversation.id }, data: { updatedAt: new Date() } });
  await prisma.conversationMember.update({
    where: { conversationId_userId: { conversationId: conversation.id, userId: me } },
    data: { lastReadAt: new Date() },
  });

  await notify({ recipientId: story.authorId, actorId: me, type: "MESSAGE" });
  publish(conversation.id, { kind: "message", message: toMessageProps(message, me) });

  return NextResponse.json({ ok: true }, { status: 201 });
}
