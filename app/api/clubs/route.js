import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/guards";
import { canModerateContent } from "@/lib/roles";

// Create a club. Teachers/admins only (matches the later Communities phase's
// rule); the creator is auto-joined as a member.
export async function POST(req) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!canModerateContent(me.role)) {
    return NextResponse.json({ error: "Only teachers and admins can create clubs." }, { status: 403 });
  }

  const { name, description } = await req.json().catch(() => ({}));
  const cleanName = String(name || "").trim().slice(0, 60);
  if (!cleanName) return NextResponse.json({ error: "Give the club a name." }, { status: 400 });
  const cleanDesc = String(description || "").trim().slice(0, 300);

  const club = await prisma.club.create({
    data: {
      name: cleanName,
      description: cleanDesc || null,
      createdById: me.id,
      members: { create: { userId: me.id, status: "ACCEPTED", role: "ADMIN" } },
    },
  });

  return NextResponse.json({ ok: true, id: club.id }, { status: 201 });
}
