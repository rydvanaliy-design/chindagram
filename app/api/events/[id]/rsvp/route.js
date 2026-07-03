import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/guards";

const STATUSES = ["GOING", "INTERESTED", "NOT_GOING"];

// Set or clear your RSVP. Posting your current status again clears it.
export async function POST(req, { params }) {
  const me = await requireUserId();
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { status } = await req.json().catch(() => ({}));
  if (!STATUSES.includes(status)) return NextResponse.json({ error: "Bad request." }, { status: 400 });

  const event = await prisma.event.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });

  const existing = await prisma.eventRSVP.findUnique({ where: { eventId_userId: { eventId: event.id, userId: me } } });
  if (existing && existing.status === status) {
    await prisma.eventRSVP.delete({ where: { id: existing.id } });
    return NextResponse.json({ status: null });
  }

  await prisma.eventRSVP.upsert({
    where: { eventId_userId: { eventId: event.id, userId: me } },
    update: { status },
    create: { eventId: event.id, userId: me, status },
  });
  return NextResponse.json({ status });
}
