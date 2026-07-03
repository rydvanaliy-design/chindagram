import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/guards";
import { notify } from "@/lib/notify";

// Tri-state: NONE -> request to join (creates a PENDING row) -> cancel the
// request, or ACCEPTED -> leave. Every club requires approval (owner's
// decision) — there's no instant-join path anymore.
export async function POST(req, { params }) {
  const me = await requireUserId();
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const club = await prisma.club.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!club) return NextResponse.json({ error: "Club not found." }, { status: 404 });

  const existing = await prisma.clubMember.findUnique({ where: { clubId_userId: { clubId: club.id, userId: me } } });

  if (existing) {
    // Cancel a pending request, or leave if already a member.
    await prisma.clubMember.delete({ where: { id: existing.id } });
    return NextResponse.json({ status: "NONE" });
  }

  await prisma.clubMember.create({ data: { clubId: club.id, userId: me, status: "PENDING", role: "MEMBER" } });

  const admins = await prisma.clubMember.findMany({
    where: { clubId: club.id, status: "ACCEPTED", role: "ADMIN" },
    select: { userId: true },
  });
  for (const a of admins) {
    await notify({ recipientId: a.userId, actorId: me, type: "CLUB_JOIN_REQUEST", clubId: club.id });
  }

  return NextResponse.json({ status: "PENDING" });
}
