import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/guards";
import { isClubAdmin } from "@/lib/clubs";
import { notify } from "@/lib/notify";

// Promote/demote a member's role within the club. Club-admin only. The
// club's creator can't be demoted — always keeps at least one admin.
export async function PATCH(req, { params }) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!(await isClubAdmin(params.id, me.id, me.role))) {
    return NextResponse.json({ error: "Only club admins can change roles." }, { status: 403 });
  }

  const { role } = await req.json().catch(() => ({}));
  if (!["MEMBER", "ADMIN"].includes(role)) return NextResponse.json({ error: "Bad request." }, { status: 400 });

  const club = await prisma.club.findUnique({ where: { id: params.id }, select: { createdById: true } });
  if (!club) return NextResponse.json({ error: "Club not found." }, { status: 404 });
  if (role === "MEMBER" && club.createdById === params.userId) {
    return NextResponse.json({ error: "The club's creator always stays an admin." }, { status: 400 });
  }

  const member = await prisma.clubMember.findUnique({ where: { clubId_userId: { clubId: params.id, userId: params.userId } } });
  if (!member || member.status !== "ACCEPTED") return NextResponse.json({ error: "Member not found." }, { status: 404 });

  await prisma.clubMember.update({ where: { id: member.id }, data: { role } });
  if (role === "ADMIN") await notify({ recipientId: params.userId, actorId: me.id, type: "CLUB_ROLE_CHANGED", clubId: params.id });
  return NextResponse.json({ ok: true });
}

// Remove a member from the club entirely. Club-admin only, and can't remove
// the club's creator.
export async function DELETE(req, { params }) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!(await isClubAdmin(params.id, me.id, me.role))) {
    return NextResponse.json({ error: "Only club admins can remove members." }, { status: 403 });
  }

  const club = await prisma.club.findUnique({ where: { id: params.id }, select: { createdById: true } });
  if (!club) return NextResponse.json({ error: "Club not found." }, { status: 404 });
  if (club.createdById === params.userId) {
    return NextResponse.json({ error: "Can't remove the club's creator." }, { status: 400 });
  }

  const member = await prisma.clubMember.findUnique({ where: { clubId_userId: { clubId: params.id, userId: params.userId } } });
  if (!member) return NextResponse.json({ error: "Member not found." }, { status: 404 });

  await prisma.clubMember.delete({ where: { id: member.id } });
  return NextResponse.json({ ok: true });
}
