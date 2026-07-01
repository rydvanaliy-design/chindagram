import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/guards";
import { isStaff } from "@/lib/roles";

// Toggle "private account". Teacher/Admin accounts are always public
// (Confirmed decision #1) and can't switch this on.
export async function POST(req) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { private: makePrivate } = await req.json().catch(() => ({}));
  if (typeof makePrivate !== "boolean") {
    return NextResponse.json({ error: "Missing private value." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (isStaff(user.role)) {
    return NextResponse.json({ error: "Teacher and Admin accounts are always public." }, { status: 400 });
  }

  await prisma.user.update({ where: { id: userId }, data: { private: makePrivate } });

  // Switching to public auto-approves anyone still waiting on a request,
  // same as Instagram — there's nothing left to gate once you're public.
  if (!makePrivate) {
    await prisma.follow.updateMany({ where: { followingId: userId, status: "PENDING" }, data: { status: "ACCEPTED" } });
  }

  return NextResponse.json({ ok: true, private: makePrivate });
}
