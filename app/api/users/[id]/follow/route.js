import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/guards";
import { notify } from "@/lib/notify";
import { isStaff } from "@/lib/roles";

// Toggle following someone. If they're private, this creates a PENDING
// request instead of following immediately (Confirmed decision #1).
// Calling again while pending cancels the request; calling again while
// accepted unfollows.
export async function POST(req, { params }) {
  const me = await requireUserId();
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const target = params.id;
  if (target === me) return NextResponse.json({ error: "You can't follow yourself." }, { status: 400 });

  const targetUser = await prisma.user.findUnique({ where: { id: target }, select: { id: true, private: true, role: true, disabled: true } });
  if (!targetUser || targetUser.disabled) return NextResponse.json({ error: "Account not found." }, { status: 404 });

  const blocked = await prisma.block.findFirst({
    where: { OR: [{ blockerId: me, blockedId: target }, { blockerId: target, blockedId: me }] },
  });
  if (blocked) return NextResponse.json({ error: "You can't follow this account." }, { status: 403 });

  const existing = await prisma.follow.findUnique({ where: { followerId_followingId: { followerId: me, followingId: target } } });

  if (existing) {
    // Cancel a pending request, or unfollow an accepted one.
    await prisma.follow.delete({ where: { id: existing.id } });
    const followerCount = await prisma.follow.count({ where: { followingId: target, status: "ACCEPTED" } });
    return NextResponse.json({ status: "NONE", followerCount });
  }

  const status = targetUser.private && !isStaff(targetUser.role) ? "PENDING" : "ACCEPTED";
  await prisma.follow.create({ data: { followerId: me, followingId: target, status } });
  await notify({ recipientId: target, actorId: me, type: status === "PENDING" ? "FOLLOW_REQUEST" : "FOLLOW" });

  const followerCount = await prisma.follow.count({ where: { followingId: target, status: "ACCEPTED" } });
  return NextResponse.json({ status, followerCount });
}
