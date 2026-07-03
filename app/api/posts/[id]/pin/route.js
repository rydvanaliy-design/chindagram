import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/guards";
import { isClubAdmin } from "@/lib/clubs";
import { notify } from "@/lib/notify";

// Pin / unpin to your profile (owner only), or within a club feed (club
// admins too, so admins can pin the club's own posts, not just their own).
// A club admin pinning a post is effectively "making it an announcement" —
// that's the notify-worthy moment for the club, not every regular post.
export async function POST(req, { params }) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const post = await prisma.post.findUnique({ where: { id: params.id }, select: { authorId: true, pinned: true, clubId: true } });
  if (!post) return NextResponse.json({ error: "Post not found." }, { status: 404 });

  const isClubAdminHere = Boolean(post.clubId) && (await isClubAdmin(post.clubId, me.id, me.role));
  if (!(post.authorId === me.id || isClubAdminHere)) {
    return NextResponse.json({ error: "Not your post." }, { status: 403 });
  }

  const pinned = !post.pinned;
  await prisma.post.update({ where: { id: params.id }, data: { pinned } });

  if (pinned && post.clubId && isClubAdminHere) {
    const members = await prisma.clubMember.findMany({
      where: { clubId: post.clubId, status: "ACCEPTED", userId: { not: me.id } }, select: { userId: true },
    });
    for (const m of members) {
      await notify({ recipientId: m.userId, actorId: me.id, type: "CLUB_ANNOUNCEMENT", postId: params.id, clubId: post.clubId });
    }
  }

  return NextResponse.json({ ok: true, pinned });
}
