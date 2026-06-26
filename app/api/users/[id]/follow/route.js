import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/guards";
import { notify } from "@/lib/notify";

export async function POST(req, { params }) {
  const me = await requireUserId();
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const target = params.id;
  if (target === me) return NextResponse.json({ error: "You can't follow yourself." }, { status: 400 });

  const existing = await prisma.follow.findUnique({ where: { followerId_followingId: { followerId: me, followingId: target } } });

  if (existing) {
    await prisma.follow.delete({ where: { id: existing.id } });
  } else {
    await prisma.follow.create({ data: { followerId: me, followingId: target } });
    await notify({ recipientId: target, actorId: me, type: "FOLLOW" });
  }

  const followerCount = await prisma.follow.count({ where: { followingId: target } });
  return NextResponse.json({ following: !existing, followerCount });
}
