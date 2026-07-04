import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/guards";
import { isClubAdmin } from "@/lib/clubs";
import { isAdmin } from "@/lib/roles";

// Rename a club. Club-admin or platform-admin (isClubAdmin already treats
// platform Admin as an automatic club admin everywhere else).
export async function PATCH(req, { params }) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!(await isClubAdmin(params.id, me.id, me.role))) {
    return NextResponse.json({ error: "Only club admins can rename it." }, { status: 403 });
  }

  const { name } = await req.json().catch(() => ({}));
  const trimmed = String(name || "").trim().slice(0, 60);
  if (!trimmed) return NextResponse.json({ error: "Give the club a name." }, { status: 400 });

  await prisma.club.update({ where: { id: params.id }, data: { name: trimmed } });
  return NextResponse.json({ ok: true });
}

// Delete a club entirely (posts un-file to their author's profile via
// Post.clubId's SetNull, membership rows cascade away). Platform-admin only
// — a bigger action than rename, kept to the admin dashboard's moderation
// authority rather than every club's own admin.
export async function DELETE(req, { params }) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!isAdmin(me.role)) return NextResponse.json({ error: "Only admins can delete a club." }, { status: 403 });

  const club = await prisma.club.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!club) return NextResponse.json({ error: "Club not found." }, { status: 404 });

  await prisma.club.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
