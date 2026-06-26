import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";

export async function POST(req) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admins only." }, { status: 403 });

  const { commentId } = await req.json();
  if (!commentId) return NextResponse.json({ error: "Missing commentId." }, { status: 400 });

  await prisma.comment.update({ where: { id: commentId }, data: { removed: true } });
  await prisma.report.updateMany({ where: { commentId }, data: { status: "RESOLVED" } });
  return NextResponse.json({ ok: true });
}
