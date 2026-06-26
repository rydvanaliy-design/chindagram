import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/guards";

export async function PATCH(req) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { bio } = await req.json();
  await prisma.user.update({
    where: { id: userId },
    data: { bio: bio ? String(bio).slice(0, 300) : null },
  });

  return NextResponse.json({ ok: true });
}
