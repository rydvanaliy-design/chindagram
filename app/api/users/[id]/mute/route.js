import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/guards";

// Muting is one-way and quiet: hides someone's posts from your own feed only.
// Doesn't affect following, messaging, or anything on their end.
export async function POST(req, { params }) {
  const me = await requireUserId();
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const target = params.id;
  if (target === me) return NextResponse.json({ error: "You can't mute yourself." }, { status: 400 });

  const existing = await prisma.mute.findUnique({ where: { muterId_mutedId: { muterId: me, mutedId: target } } });

  if (existing) {
    await prisma.mute.delete({ where: { id: existing.id } });
    return NextResponse.json({ muted: false });
  }

  await prisma.mute.create({ data: { muterId: me, mutedId: target } });
  return NextResponse.json({ muted: true });
}
