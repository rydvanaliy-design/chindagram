import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/guards";
import { decideTextStatus } from "@/lib/moderation";

// Write a post on someone's profile wall. Moderated like everything else.
export async function POST(req) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { ownerId, body } = await req.json().catch(() => ({}));
  const text = String(body || "").trim();
  if (!ownerId) return NextResponse.json({ error: "Missing wall owner." }, { status: 400 });
  if (!text) return NextResponse.json({ error: "Write something." }, { status: 400 });
  if (text.length > 1000) return NextResponse.json({ error: "Too long." }, { status: 400 });

  const owner = await prisma.user.findUnique({ where: { id: ownerId }, select: { id: true } });
  if (!owner) return NextResponse.json({ error: "Profile not found." }, { status: 404 });

  if (ownerId !== userId) {
    const blocked = await prisma.block.findFirst({
      where: { OR: [{ blockerId: userId, blockedId: ownerId }, { blockerId: ownerId, blockedId: userId }] },
    });
    if (blocked) return NextResponse.json({ error: "You can't post on this wall." }, { status: 403 });
  }

  const { status, flagReason } = await decideTextStatus(text);
  const wallPost = await prisma.wallPost.create({
    data: { ownerId, authorId: userId, body: text, status, flagReason },
    include: { author: { select: { id: true, name: true, image: true } } },
  });

  return NextResponse.json({
    ok: true,
    status,
    wallPost: {
      id: wallPost.id, body: wallPost.body, createdAt: wallPost.createdAt.toISOString(),
      author: wallPost.author, mine: true, pending: status === "PENDING",
    },
  }, { status: 201 });
}
