import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/guards";

// Pin / unpin your own post to your profile. Owner only.
export async function POST(req, { params }) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const post = await prisma.post.findUnique({ where: { id: params.id }, select: { authorId: true, pinned: true } });
  if (!post) return NextResponse.json({ error: "Post not found." }, { status: 404 });
  if (post.authorId !== userId) return NextResponse.json({ error: "Not your post." }, { status: 403 });

  const pinned = !post.pinned;
  await prisma.post.update({ where: { id: params.id }, data: { pinned } });
  return NextResponse.json({ ok: true, pinned });
}
