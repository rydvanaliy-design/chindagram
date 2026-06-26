import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/guards";
import { notify } from "@/lib/notify";

export async function POST(req, { params }) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const postId = params.id;
  const existing = await prisma.like.findUnique({ where: { userId_postId: { userId, postId } } });

  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
  } else {
    await prisma.like.create({ data: { userId, postId } });
    const post = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true } });
    if (post) await notify({ recipientId: post.authorId, actorId: userId, type: "LIKE", postId });
  }

  const count = await prisma.like.count({ where: { postId } });
  return NextResponse.json({ liked: !existing, count });
}
