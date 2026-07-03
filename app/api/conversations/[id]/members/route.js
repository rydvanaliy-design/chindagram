import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/guards";
import { isConversationAdmin } from "@/lib/messages";
import { notify } from "@/lib/notify";

// Add members to a group. Group-admin only.
export async function POST(req, { params }) {
  const me = await requireUserId();
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const convo = await prisma.conversation.findUnique({ where: { id: params.id }, include: { _count: { select: { members: true } } } });
  if (!convo || !convo.isGroup) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (!(await isConversationAdmin(params.id, me))) return NextResponse.json({ error: "Only group admins can add members." }, { status: 403 });

  const { memberIds } = await req.json().catch(() => ({}));
  const ids = [...new Set((memberIds || []).filter(Boolean))];
  if (ids.length === 0) return NextResponse.json({ error: "Pick at least one person." }, { status: 400 });
  if (convo._count.members + ids.length > 30) return NextResponse.json({ error: "Groups can have up to 30 people." }, { status: 400 });

  const existing = await prisma.conversationMember.findMany({ where: { conversationId: params.id, userId: { in: ids } }, select: { userId: true } });
  const existingIds = new Set(existing.map((e) => e.userId));
  const toAdd = ids.filter((id) => !existingIds.has(id));

  if (toAdd.length) {
    await prisma.conversationMember.createMany({ data: toAdd.map((userId) => ({ conversationId: params.id, userId, role: "MEMBER" })) });
    for (const uid of toAdd) await notify({ recipientId: uid, actorId: me, type: "GROUP_ADDED" });
  }

  return NextResponse.json({ ok: true });
}
