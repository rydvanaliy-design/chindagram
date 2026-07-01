import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";
import { isRole, isStaff } from "@/lib/roles";

// Admins assign Student / Parent / Teacher / Admin to an account.
export async function POST(req) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admins only." }, { status: 403 });

  const { userId, role } = await req.json().catch(() => ({}));
  if (!userId || !isRole(role)) {
    return NextResponse.json({ error: "Missing userId or invalid role." }, { status: 400 });
  }

  // Don't let an admin demote themselves — avoids accidentally locking
  // the only admin out of the admin tools.
  if (userId === admin.id && role !== "ADMIN") {
    return NextResponse.json({ error: "You can't change your own admin role." }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!target) return NextResponse.json({ error: "User not found." }, { status: 404 });

  // Teacher/Admin accounts are always public (enforced regardless of this
  // flag), but keep it truthful in the DB for Settings/display purposes.
  const data = isStaff(role) ? { role, private: false } : { role };
  await prisma.user.update({ where: { id: userId }, data });
  return NextResponse.json({ ok: true });
}
