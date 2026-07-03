import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/guards";
import { isAdmin } from "@/lib/roles";

// Cancel an event. The event's creator, or a platform Admin, only.
export async function DELETE(req, { params }) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const event = await prisma.event.findUnique({ where: { id: params.id }, select: { createdById: true } });
  if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });
  if (event.createdById !== me.id && !isAdmin(me.role)) {
    return NextResponse.json({ error: "Only the event's creator can cancel it." }, { status: 403 });
  }

  await prisma.event.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
