import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";

// Accepts a single userId (existing per-row control) or a userIds array
// (bulk toolbar) — same action either way.
export async function POST(req) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admins only." }, { status: 403 });

  const { userId, userIds, disabled } = await req.json();
  const ids = userIds || (userId ? [userId] : []);
  if (ids.length === 0) return NextResponse.json({ error: "Missing userId." }, { status: 400 });
  if (ids.includes(admin.id)) {
    return NextResponse.json({ error: "You can't disable your own account." }, { status: 400 });
  }

  await prisma.user.updateMany({ where: { id: { in: ids } }, data: { disabled: Boolean(disabled) } });
  return NextResponse.json({ ok: true });
}
