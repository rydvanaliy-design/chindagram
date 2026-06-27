import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";
import { generateCode } from "@/lib/access";

// Rotate (make a fresh code, retire the old one) or disable the school code.
// Disabling means no one new can join until a code is generated again.
export async function POST(req) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admins only." }, { status: 403 });

  const { action } = await req.json().catch(() => ({}));

  if (action === "disable") {
    await prisma.accessCode.updateMany({ where: { active: true }, data: { active: false } });
    return NextResponse.json({ ok: true });
  }

  if (action === "rotate") {
    // Retire any current codes, then mint a new active one.
    await prisma.accessCode.updateMany({ where: { active: true }, data: { active: false } });
    let code;
    // Extremely unlikely to collide, but retry on the unique constraint just in case.
    for (let attempt = 0; attempt < 5; attempt++) {
      code = generateCode(crypto.randomBytes(6));
      const clash = await prisma.accessCode.findUnique({ where: { code } });
      if (!clash) break;
    }
    const created = await prisma.accessCode.create({ data: { code, active: true } });
    return NextResponse.json({ ok: true, code: created.code });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
