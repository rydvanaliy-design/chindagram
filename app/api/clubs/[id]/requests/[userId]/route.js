import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/guards";
import { isClubAdmin } from "@/lib/clubs";
import { notify } from "@/lib/notify";

// Accept or decline a pending join request. Club-admin only (any promoted
// member, or a platform Admin).
export async function POST(req, { params }) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!(await isClubAdmin(params.id, me.id, me.role))) {
    return NextResponse.json({ error: "Only club admins can manage requests." }, { status: 403 });
  }

  const { action } = await req.json().catch(() => ({}));
  if (!["accept", "decline"].includes(action)) return NextResponse.json({ error: "Bad request." }, { status: 400 });

  const request = await prisma.clubMember.findUnique({ where: { clubId_userId: { clubId: params.id, userId: params.userId } } });
  if (!request || request.status !== "PENDING") return NextResponse.json({ error: "Request not found." }, { status: 404 });

  if (action === "accept") {
    await prisma.clubMember.update({ where: { id: request.id }, data: { status: "ACCEPTED" } });
    await notify({ recipientId: params.userId, actorId: me.id, type: "CLUB_REQUEST_ACCEPTED", clubId: params.id });
  } else {
    await prisma.clubMember.delete({ where: { id: request.id } });
  }
  return NextResponse.json({ ok: true });
}
