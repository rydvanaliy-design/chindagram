import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";

export async function POST(req) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admins only." }, { status: 403 });

  const { postId } = await req.json();
  if (!postId) return NextResponse.json({ error: "Missing postId." }, { status: 400 });

  await prisma.post.update({ where: { id: postId }, data: { removed: true } });
  await prisma.report.updateMany({ where: { postId }, data: { status: "RESOLVED" } });
  return NextResponse.json({ ok: true });
}
