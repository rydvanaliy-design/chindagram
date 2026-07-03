import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/guards";
import { isConversationAdmin } from "@/lib/messages";

// Rename a group. Group-admin only, groups only.
export async function PATCH(req, { params }) {
  const me = await requireUserId();
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const convo = await prisma.conversation.findUnique({ where: { id: params.id }, select: { isGroup: true } });
  if (!convo || !convo.isGroup) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (!(await isConversationAdmin(params.id, me))) return NextResponse.json({ error: "Only group admins can rename it." }, { status: 403 });

  const { name } = await req.json().catch(() => ({}));
  const trimmed = String(name || "").trim().slice(0, 60);
  if (!trimmed) return NextResponse.json({ error: "Give the group a name." }, { status: 400 });

  await prisma.conversation.update({ where: { id: params.id }, data: { name: trimmed } });
  return NextResponse.json({ ok: true });
}

// Leave a conversation. If you're the last member, the whole thread goes
// with you — an empty conversation has nothing left to leave it for.
export async function DELETE(req, { params }) {
  const me = await requireUserId();
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const member = await prisma.conversationMember.findUnique({ where: { conversationId_userId: { conversationId: params.id, userId: me } } });
  if (!member) return NextResponse.json({ error: "Not found." }, { status: 404 });

  await prisma.conversationMember.delete({ where: { id: member.id } });
  const remaining = await prisma.conversationMember.count({ where: { conversationId: params.id } });
  if (remaining === 0) await prisma.conversation.delete({ where: { id: params.id } });

  return NextResponse.json({ ok: true });
}
