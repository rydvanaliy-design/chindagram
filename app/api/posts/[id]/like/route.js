import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/guards";
import { notify } from "@/lib/notify";
import { isReaction, DEFAULT_REACTION } from "@/lib/reactions";

// One reaction per user per post. Same type again removes it; a different
// type switches it; no existing reaction creates one.
export async function POST(req, { params }) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const postId = params.id;
  const body = await req.json().catch(() => ({}));
  const type = isReaction(body?.type) ? body.type : DEFAULT_REACTION;

  const existing = await prisma.like.findUnique({ where: { userId_postId: { userId, postId } } });

  let myReaction;
  if (existing && existing.type === type) {
    await prisma.like.delete({ where: { id: existing.id } });
    myReaction = null;
  } else if (existing) {
    await prisma.like.update({ where: { id: existing.id }, data: { type } });
    myReaction = type;
  } else {
    await prisma.like.create({ data: { userId, postId, type } });
    const post = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true } });
    if (post) await notify({ recipientId: post.authorId, actorId: userId, type: "LIKE", postId });
    myReaction = type;
  }

  const rows = await prisma.like.groupBy({ by: ["type"], where: { postId }, _count: true });
  const breakdown = Object.fromEntries(rows.map((r) => [r.type, r._count]));
  const totalCount = rows.reduce((s, r) => s + r._count, 0);

  return NextResponse.json({ myReaction, totalCount, breakdown });
}
