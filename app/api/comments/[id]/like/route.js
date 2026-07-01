import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/guards";
import { notify } from "@/lib/notify";

export async function POST(req, { params }) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const commentId = params.id;
  const existing = await prisma.commentLike.findUnique({ where: { userId_commentId: { userId, commentId } } });

  if (existing) {
    await prisma.commentLike.delete({ where: { id: existing.id } });
  } else {
    await prisma.commentLike.create({ data: { userId, commentId } });
    const comment = await prisma.comment.findUnique({ where: { id: commentId }, select: { authorId: true, postId: true } });
    if (comment) await notify({ recipientId: comment.authorId, actorId: userId, type: "COMMENT_LIKE", postId: comment.postId });
  }

  const count = await prisma.commentLike.count({ where: { commentId } });
  return NextResponse.json({ liked: !existing, count });
}
