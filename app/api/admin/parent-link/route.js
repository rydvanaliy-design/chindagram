import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";

// Link or unlink a Parent account to a Student (child) account.
// A parent can see the child's profile/public posts only — never DMs.
export async function POST(req) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admins only." }, { status: 403 });

  const { parentId, childId, action } = await req.json().catch(() => ({}));
  if (!parentId || !childId) {
    return NextResponse.json({ error: "Missing parentId or childId." }, { status: 400 });
  }
  if (parentId === childId) {
    return NextResponse.json({ error: "A person can't be their own parent." }, { status: 400 });
  }

  if (action === "unlink") {
    await prisma.parentLink.deleteMany({ where: { parentId, childId } });
    return NextResponse.json({ ok: true });
  }

  // Link: confirm the roles make sense before connecting them.
  const [parent, child] = await Promise.all([
    prisma.user.findUnique({ where: { id: parentId }, select: { role: true } }),
    prisma.user.findUnique({ where: { id: childId }, select: { role: true } }),
  ]);
  if (!parent || !child) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }
  if (parent.role !== "PARENT") {
    return NextResponse.json({ error: "Set that account's role to Parent first." }, { status: 400 });
  }
  if (child.role !== "STUDENT") {
    return NextResponse.json({ error: "A parent can only be linked to a Student." }, { status: 400 });
  }

  // Idempotent thanks to the unique (parentId, childId) constraint.
  await prisma.parentLink.upsert({
    where: { parentId_childId: { parentId, childId } },
    update: {},
    create: { parentId, childId },
  });
  return NextResponse.json({ ok: true });
}
