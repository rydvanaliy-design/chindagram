import { NextResponse } from "next/server";
import { rateLimit, tooManyResponse } from "@/lib/ratelimit";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/guards";
import { isConversationMember } from "@/lib/messages";

export async function POST(req) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const posted = rateLimit(`report:${userId}`, 10, 60 * 60 * 1000);
  if (!posted.ok) return tooManyResponse(posted.retryAfterSec);

  const { postId, commentId, messageId, wallPostId, reason } = await req.json();
  if (!postId && !commentId && !messageId && !wallPostId) return NextResponse.json({ error: "Nothing to report." }, { status: 400 });

  if (messageId) {
    const msg = await prisma.message.findUnique({ where: { id: messageId }, select: { conversationId: true } });
    if (!msg || !(await isConversationMember(msg.conversationId, userId))) {
      return NextResponse.json({ error: "Not allowed." }, { status: 403 });
    }
  }

  await prisma.report.create({
    data: {
      reporterId: userId,
      postId: postId || null,
      commentId: commentId || null,
      messageId: messageId || null,
      wallPostId: wallPostId || null,
      reason: reason ? String(reason).slice(0, 500) : null,
    },
  });
  return NextResponse.json({ ok: true }, { status: 201 });
}
