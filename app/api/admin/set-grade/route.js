import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";

// Set or clear an account's grade/class label (e.g. "Class 6B"), shown as a
// badge. Accepts a single userId (existing per-row control) or a userIds
// array (bulk toolbar) — same action either way.
export async function POST(req) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admins only." }, { status: 403 });

  const { userId, userIds, gradeClass } = await req.json().catch(() => ({}));
  const ids = userIds || (userId ? [userId] : []);
  if (ids.length === 0) return NextResponse.json({ error: "Missing userId." }, { status: 400 });

  const clean = String(gradeClass || "").trim().slice(0, 40);

  await prisma.user.updateMany({ where: { id: { in: ids } }, data: { gradeClass: clean || null } });
  return NextResponse.json({ ok: true });
}
