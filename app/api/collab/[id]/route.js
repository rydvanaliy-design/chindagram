import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/guards";

// Accept or decline a co-author invite. Only the invited user can act.
export async function POST(req, { params }) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { action } = await req.json().catch(() => ({}));
  if (!["accept", "decline"].includes(action)) {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  const collab = await prisma.postCollaborator.findUnique({
    where: { id: params.id },
    select: { id: true, userId: true },
  });
  if (!collab) return NextResponse.json({ error: "Invite not found." }, { status: 404 });
  if (collab.userId !== userId) return NextResponse.json({ error: "Not your invite." }, { status: 403 });

  if (action === "accept") {
    await prisma.postCollaborator.update({ where: { id: collab.id }, data: { accepted: true } });
  } else {
    await prisma.postCollaborator.delete({ where: { id: collab.id } });
  }
  return NextResponse.json({ ok: true });
}
