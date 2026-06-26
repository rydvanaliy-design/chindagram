import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";

export async function POST(req) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admins only." }, { status: 403 });

  const { messageId } = await req.json();
  if (!messageId) return NextResponse.json({ error: "Missing messageId." }, { status: 400 });

  await prisma.message.update({ where: { id: messageId }, data: { removed: true } });
  await prisma.report.updateMany({ where: { messageId }, data: { status: "RESOLVED" } });
  return NextResponse.json({ ok: true });
}
