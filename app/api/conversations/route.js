import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/guards";

// Lightweight "send to" contact list for the repost picker — your existing
// conversation partners, most recently active first.
export async function GET() {
  const me = await requireUserId();
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const convos = await prisma.conversation.findMany({
    where: { OR: [{ aId: me }, { bId: me }] },
    orderBy: { updatedAt: "desc" },
    include: {
      a: { select: { id: true, name: true, image: true } },
      b: { select: { id: true, name: true, image: true } },
    },
  });

  const conversations = convos.map((c) => (c.aId === me ? c.b : c.a));
  return NextResponse.json({ conversations });
}
