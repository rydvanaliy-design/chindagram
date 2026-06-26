import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/guards";

export async function POST(req) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { postId, commentId, messageId, reason } = await req.json();
  if (!postId && !commentId && !messageId) return NextResponse.json({ error: "Nothing to report." }, { status: 400 });

  if (messageId) {
    const msg = await prisma.message.findUnique({ where: { id: messageId }, include: { conversation: true } });
    if (!msg || (msg.conversation.aId !== userId && msg.conversation.bId !== userId)) {
      return NextResponse.json({ error: "Not allowed." }, { status: 403 });
    }
  }

  await prisma.report.create({
    data: {
      reporterId: userId,
      postId: postId || null,
      commentId: commentId || null,
      messageId: messageId || null,
      reason: reason ? String(reason).slice(0, 500) : null,
    },
  });
  return NextResponse.json({ ok: true }, { status: 201 });
}
