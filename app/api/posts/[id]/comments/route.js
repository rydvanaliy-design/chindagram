import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/guards";
import { notify } from "@/lib/notify";

export async function POST(req, { params }) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { body } = await req.json();
  const text = String(body || "").trim();
  if (!text) return NextResponse.json({ error: "Comment is empty." }, { status: 400 });
  if (text.length > 1000) return NextResponse.json({ error: "Comment is too long." }, { status: 400 });

  const comment = await prisma.comment.create({
    data: { body: text, postId: params.id, authorId: userId },
    include: { author: { select: { id: true, name: true, image: true } } },
  });

  const post = await prisma.post.findUnique({ where: { id: params.id }, select: { authorId: true } });
  if (post) await notify({ recipientId: post.authorId, actorId: userId, type: "COMMENT", postId: params.id });

  return NextResponse.json({
    comment: { id: comment.id, body: comment.body, createdAt: comment.createdAt.toISOString(), author: comment.author, mine: true },
  }, { status: 201 });
}
