import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId, getSessionUser } from "@/lib/guards";
import { isBlockedEitherWay } from "@/lib/privacy";
import { findOrCreate1to1, conversationDisplay } from "@/lib/messages";
import { notify } from "@/lib/notify";

const MEDIA_LABEL = { IMAGE: "Photo", VIDEO: "Video", VOICE: "Voice note" };

// List my conversations (1:1 and groups), most recently active first. Also
// doubles as the "send to…" contact list for the repost picker.
export async function GET() {
  const me = await requireUserId();
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const memberships = await prisma.conversationMember.findMany({ where: { userId: me }, select: { conversationId: true, lastReadAt: true } });
  const lastReadMap = new Map(memberships.map((m) => [m.conversationId, m.lastReadAt]));
  const convoIds = memberships.map((m) => m.conversationId);
  if (convoIds.length === 0) return NextResponse.json({ conversations: [] });

  const convos = await prisma.conversation.findMany({
    where: { id: { in: convoIds } },
    orderBy: { updatedAt: "desc" },
    include: {
      members: { include: { user: { select: { id: true, name: true, image: true } } } },
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { senderId: true, body: true, removed: true, mediaType: true, createdAt: true } },
    },
  });

  const conversations = convos.map((c) => {
    const display = conversationDisplay(c, me);
    const last = c.messages[0];
    const lastReadAt = lastReadMap.get(c.id);
    const unread = Boolean(last && last.senderId !== me && (!lastReadAt || last.createdAt > lastReadAt));
    const lastMessage = last ? (last.removed ? "Message removed" : last.body || MEDIA_LABEL[last.mediaType] || "") : null;
    return {
      id: c.id, name: display.name, image: display.image, isGroup: display.isGroup,
      memberCount: c.members.length, lastMessage, lastMessageAt: (last?.createdAt || c.createdAt).toISOString(), unread,
    };
  });

  return NextResponse.json({ conversations });
}

// Start a 1:1 thread ({ userId }) or create a group ({ memberIds, name }).
export async function POST(req) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  if (body.userId) {
    const otherId = body.userId;
    if (otherId === me.id) return NextResponse.json({ error: "Invalid recipient." }, { status: 400 });
    const target = await prisma.user.findUnique({ where: { id: otherId }, select: { id: true, disabled: true } });
    if (!target || target.disabled) return NextResponse.json({ error: "That person can't receive messages." }, { status: 400 });
    if (await isBlockedEitherWay(me.id, otherId, me.role)) return NextResponse.json({ error: "You can't message this person." }, { status: 403 });
    const convo = await findOrCreate1to1(me.id, otherId);
    return NextResponse.json({ id: convo.id }, { status: 201 });
  }

  const memberIds = [...new Set((body.memberIds || []).filter((id) => id && id !== me.id))];
  if (memberIds.length === 0) return NextResponse.json({ error: "Add at least one other person." }, { status: 400 });
  if (memberIds.length > 29) return NextResponse.json({ error: "Groups can have up to 30 people." }, { status: 400 });

  const users = await prisma.user.findMany({ where: { id: { in: memberIds }, disabled: false }, select: { id: true } });
  if (users.length !== memberIds.length) return NextResponse.json({ error: "Some people couldn't be added." }, { status: 400 });
  for (const uid of memberIds) {
    if (await isBlockedEitherWay(me.id, uid, me.role)) {
      return NextResponse.json({ error: "You can't start a group with someone you've blocked or been blocked by." }, { status: 403 });
    }
  }

  const name = String(body.name || "").trim().slice(0, 60) || null;
  const convo = await prisma.conversation.create({
    data: {
      isGroup: true, name, createdById: me.id,
      members: { create: [{ userId: me.id, role: "ADMIN" }, ...memberIds.map((id) => ({ userId: id, role: "MEMBER" }))] },
    },
  });
  for (const uid of memberIds) {
    await notify({ recipientId: uid, actorId: me.id, type: "GROUP_ADDED" });
  }

  return NextResponse.json({ id: convo.id }, { status: 201 });
}
