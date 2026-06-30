import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/guards";
import { canModerateContent } from "@/lib/roles";

// Remove a wall post. The author or the wall's owner can delete it outright;
// a teacher/admin can moderate it (soft-remove + resolve any reports).
export async function DELETE(req, { params }) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const wp = await prisma.wallPost.findUnique({
    where: { id: params.id },
    select: { id: true, ownerId: true, authorId: true },
  });
  if (!wp) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const isParticipant = wp.authorId === me.id || wp.ownerId === me.id;
  if (isParticipant) {
    await prisma.wallPost.delete({ where: { id: wp.id } });
    return NextResponse.json({ ok: true });
  }
  if (canModerateContent(me.role)) {
    await prisma.wallPost.update({ where: { id: wp.id }, data: { removed: true } });
    await prisma.report.updateMany({ where: { wallPostId: wp.id, status: "OPEN" }, data: { status: "RESOLVED" } });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Not allowed." }, { status: 403 });
}
