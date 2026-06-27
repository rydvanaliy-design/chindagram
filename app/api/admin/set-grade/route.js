import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";

// Set or clear an account's grade/class label (e.g. "Class 6B"), shown as a badge.
export async function POST(req) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admins only." }, { status: 403 });

  const { userId, gradeClass } = await req.json().catch(() => ({}));
  if (!userId) return NextResponse.json({ error: "Missing userId." }, { status: 400 });

  const clean = String(gradeClass || "").trim().slice(0, 40);

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!target) return NextResponse.json({ error: "User not found." }, { status: 404 });

  await prisma.user.update({ where: { id: userId }, data: { gradeClass: clean || null } });
  return NextResponse.json({ ok: true });
}
