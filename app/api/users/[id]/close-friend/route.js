import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/guards";

// Add/remove someone from your close-friends list. One-way, like Instagram's —
// they aren't notified. Gates visibility of your close-friends-only stories.
export async function POST(req, { params }) {
  const me = await requireUserId();
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const target = params.id;
  if (target === me) return NextResponse.json({ error: "You can't add yourself." }, { status: 400 });

  const existing = await prisma.closeFriend.findUnique({ where: { ownerId_friendId: { ownerId: me, friendId: target } } });

  if (existing) {
    await prisma.closeFriend.delete({ where: { id: existing.id } });
    return NextResponse.json({ closeFriend: false });
  }

  await prisma.closeFriend.create({ data: { ownerId: me, friendId: target } });
  return NextResponse.json({ closeFriend: true });
}
