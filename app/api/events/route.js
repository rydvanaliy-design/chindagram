import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/guards";
import { canModerateContent } from "@/lib/roles";
import { notify } from "@/lib/notify";

// Create an event. Teacher/Admin only, independent of club-admin status —
// the spec's rule is literal ("Created by teachers or admins"), not
// delegated to a club's own promoted admins.
export async function POST(req) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!canModerateContent(me.role)) {
    return NextResponse.json({ error: "Only teachers and admins can create events." }, { status: 403 });
  }

  const { title, description, location, startAt, endAt, clubId, gradeClass } = await req.json().catch(() => ({}));
  const cleanTitle = String(title || "").trim().slice(0, 100);
  if (!cleanTitle) return NextResponse.json({ error: "Give the event a title." }, { status: 400 });

  const start = new Date(startAt);
  if (isNaN(start.getTime())) return NextResponse.json({ error: "Pick a start date and time." }, { status: 400 });
  const end = endAt ? new Date(endAt) : null;
  if (end && isNaN(end.getTime())) return NextResponse.json({ error: "That end time isn't valid." }, { status: 400 });

  let club = null;
  if (clubId) {
    club = await prisma.club.findUnique({ where: { id: clubId }, select: { id: true } });
    if (!club) return NextResponse.json({ error: "Club not found." }, { status: 404 });
  }

  const event = await prisma.event.create({
    data: {
      title: cleanTitle,
      description: String(description || "").trim().slice(0, 1000) || null,
      location: String(location || "").trim().slice(0, 200) || null,
      startAt: start,
      endAt: end,
      createdById: me.id,
      clubId: club?.id || null,
      gradeClass: !club && gradeClass ? String(gradeClass).trim().slice(0, 40) : null,
    },
  });

  // Notify the tied audience — club members, or classmates. A school-wide
  // event (neither set) isn't blasted to every account; it still shows on
  // everyone's calendar passively.
  let audienceIds = [];
  if (event.clubId) {
    const members = await prisma.clubMember.findMany({ where: { clubId: event.clubId, status: "ACCEPTED", userId: { not: me.id } }, select: { userId: true } });
    audienceIds = members.map((m) => m.userId);
  } else if (event.gradeClass) {
    const classmates = await prisma.user.findMany({ where: { gradeClass: event.gradeClass, id: { not: me.id }, disabled: false }, select: { id: true } });
    audienceIds = classmates.map((u) => u.id);
  }
  for (const uid of audienceIds) {
    await notify({ recipientId: uid, actorId: me.id, type: "EVENT_CREATED", eventId: event.id, clubId: event.clubId });
  }

  return NextResponse.json({ ok: true, id: event.id }, { status: 201 });
}
