import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/guards";
import { notify } from "@/lib/notify";

// Accept or decline an incoming friend request. `id` is the Friendship row id.
export async function POST(req, { params }) {
  const me = await requireUserId();
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { action } = await req.json().catch(() => ({}));
  if (!["accept", "decline"].includes(action)) {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  const request = await prisma.friendship.findUnique({ where: { id: params.id } });
  if (!request || request.addresseeId !== me) {
    return NextResponse.json({ error: "Request not found." }, { status: 404 });
  }
  if (request.status !== "PENDING") {
    return NextResponse.json({ error: "That request was already handled." }, { status: 400 });
  }

  if (action === "accept") {
    await prisma.friendship.update({ where: { id: request.id }, data: { status: "ACCEPTED" } });
    await notify({ recipientId: request.requesterId, actorId: me, type: "FRIEND_ACCEPT" });
  } else {
    await prisma.friendship.delete({ where: { id: request.id } });
  }
  return NextResponse.json({ ok: true });
}
