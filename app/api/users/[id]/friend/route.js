import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/guards";
import { notify } from "@/lib/notify";

// Mutual friend request — separate from one-way Follow. Toggling:
//   no relationship        -> send a PENDING request
//   they already asked me  -> accept it (mutual!) instead of a duplicate row
//   I already asked them   -> cancel my request
//   already friends        -> unfriend
export async function POST(req, { params }) {
  const me = await requireUserId();
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const target = params.id;
  if (target === me) return NextResponse.json({ error: "You can't friend yourself." }, { status: 400 });

  const blocked = await prisma.block.findFirst({
    where: { OR: [{ blockerId: me, blockedId: target }, { blockerId: target, blockedId: me }] },
  });
  if (blocked) return NextResponse.json({ error: "You can't do that." }, { status: 403 });

  const mine = await prisma.friendship.findUnique({ where: { requesterId_addresseeId: { requesterId: me, addresseeId: target } } });
  const theirs = await prisma.friendship.findUnique({ where: { requesterId_addresseeId: { requesterId: target, addresseeId: me } } });

  if (mine?.status === "ACCEPTED" || theirs?.status === "ACCEPTED") {
    // Already friends — unfriend (remove whichever row exists).
    if (mine) await prisma.friendship.delete({ where: { id: mine.id } });
    if (theirs) await prisma.friendship.delete({ where: { id: theirs.id } });
    return NextResponse.json({ status: "NONE" });
  }

  if (theirs?.status === "PENDING") {
    // They asked first — accept it.
    await prisma.friendship.update({ where: { id: theirs.id }, data: { status: "ACCEPTED" } });
    await notify({ recipientId: target, actorId: me, type: "FRIEND_ACCEPT" });
    return NextResponse.json({ status: "FRIENDS" });
  }

  if (mine?.status === "PENDING") {
    // Cancel my own outgoing request.
    await prisma.friendship.delete({ where: { id: mine.id } });
    return NextResponse.json({ status: "NONE" });
  }

  await prisma.friendship.create({ data: { requesterId: me, addresseeId: target } });
  await notify({ recipientId: target, actorId: me, type: "FRIEND_REQUEST" });
  return NextResponse.json({ status: "REQUESTED" });
}
