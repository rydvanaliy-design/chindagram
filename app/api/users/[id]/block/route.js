import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/guards";

// Block stops all contact both ways: unfollows in both directions, ends any
// friendship, and (elsewhere) hides each other's content and messaging.
// Only the person who blocked can undo it.
export async function POST(req, { params }) {
  const me = await requireUserId();
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const target = params.id;
  if (target === me) return NextResponse.json({ error: "You can't block yourself." }, { status: 400 });

  const existing = await prisma.block.findUnique({ where: { blockerId_blockedId: { blockerId: me, blockedId: target } } });

  if (existing) {
    await prisma.block.delete({ where: { id: existing.id } });
    return NextResponse.json({ blocked: false });
  }

  await prisma.$transaction([
    prisma.block.create({ data: { blockerId: me, blockedId: target } }),
    prisma.follow.deleteMany({ where: { OR: [{ followerId: me, followingId: target }, { followerId: target, followingId: me }] } }),
    prisma.friendship.deleteMany({ where: { OR: [{ requesterId: me, addresseeId: target }, { requesterId: target, addresseeId: me }] } }),
  ]);
  return NextResponse.json({ blocked: true });
}
