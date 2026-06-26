import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";

export async function POST(req) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admins only." }, { status: 403 });

  const { userId, disabled } = await req.json();
  if (!userId) return NextResponse.json({ error: "Missing userId." }, { status: 400 });
  if (userId === admin.id) {
    return NextResponse.json({ error: "You can't disable your own account." }, { status: 400 });
  }

  await prisma.user.update({ where: { id: userId }, data: { disabled: Boolean(disabled) } });
  return NextResponse.json({ ok: true });
}
