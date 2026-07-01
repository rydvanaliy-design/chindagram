import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/guards";

// Join or leave a club — instant for now (no request-to-join approval yet;
// that arrives with full club management in the later Communities phase).
export async function POST(req, { params }) {
  const me = await requireUserId();
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const club = await prisma.club.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!club) return NextResponse.json({ error: "Club not found." }, { status: 404 });

  const existing = await prisma.clubMember.findUnique({ where: { clubId_userId: { clubId: club.id, userId: me } } });

  if (existing) {
    await prisma.clubMember.delete({ where: { id: existing.id } });
    return NextResponse.json({ joined: false });
  }

  await prisma.clubMember.create({ data: { clubId: club.id, userId: me } });
  return NextResponse.json({ joined: true });
}
