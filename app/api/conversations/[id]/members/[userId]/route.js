import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/guards";
import { isConversationAdmin } from "@/lib/messages";

// Remove someone from a group (not yourself — use DELETE /api/conversations/[id]
// to leave). Group-admin only, and the group's creator can't be removed.
export async function DELETE(req, { params }) {
  const me = await requireUserId();
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const convo = await prisma.conversation.findUnique({ where: { id: params.id }, select: { isGroup: true, createdById: true } });
  if (!convo || !convo.isGroup) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (!(await isConversationAdmin(params.id, me))) return NextResponse.json({ error: "Only group admins can remove members." }, { status: 403 });
  if (params.userId === convo.createdById) return NextResponse.json({ error: "Can't remove the group's creator." }, { status: 400 });

  const member = await prisma.conversationMember.findUnique({ where: { conversationId_userId: { conversationId: params.id, userId: params.userId } } });
  if (!member) return NextResponse.json({ error: "Member not found." }, { status: 404 });

  await prisma.conversationMember.delete({ where: { id: member.id } });
  return NextResponse.json({ ok: true });
}

// Promote/demote a group member's role. Group-admin only; the creator
// always stays an admin (mirrors club-member role protection).
export async function PATCH(req, { params }) {
  const me = await requireUserId();
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const convo = await prisma.conversation.findUnique({ where: { id: params.id }, select: { isGroup: true, createdById: true } });
  if (!convo || !convo.isGroup) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (!(await isConversationAdmin(params.id, me))) return NextResponse.json({ error: "Only group admins can change roles." }, { status: 403 });

  const { role } = await req.json().catch(() => ({}));
  if (!["MEMBER", "ADMIN"].includes(role)) return NextResponse.json({ error: "Bad request." }, { status: 400 });
  if (role === "MEMBER" && params.userId === convo.createdById) {
    return NextResponse.json({ error: "The group's creator always stays an admin." }, { status: 400 });
  }

  const member = await prisma.conversationMember.findUnique({ where: { conversationId_userId: { conversationId: params.id, userId: params.userId } } });
  if (!member) return NextResponse.json({ error: "Member not found." }, { status: 404 });

  await prisma.conversationMember.update({ where: { id: member.id }, data: { role } });
  return NextResponse.json({ ok: true });
}
