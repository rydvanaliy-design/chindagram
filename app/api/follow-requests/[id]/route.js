import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/guards";
import { notify } from "@/lib/notify";

// Accept or decline an incoming follow request. `id` is the Follow row id.
export async function POST(req, { params }) {
  const me = await requireUserId();
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { action } = await req.json().catch(() => ({}));
  if (!["accept", "decline"].includes(action)) {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  const follow = await prisma.follow.findUnique({ where: { id: params.id } });
  if (!follow || follow.followingId !== me) {
    return NextResponse.json({ error: "Request not found." }, { status: 404 });
  }
  if (follow.status !== "PENDING") {
    return NextResponse.json({ error: "That request was already handled." }, { status: 400 });
  }

  if (action === "accept") {
    await prisma.follow.update({ where: { id: follow.id }, data: { status: "ACCEPTED" } });
    await notify({ recipientId: follow.followerId, actorId: me, type: "FOLLOW_ACCEPT" });
  } else {
    await prisma.follow.delete({ where: { id: follow.id } });
  }
  return NextResponse.json({ ok: true });
}
