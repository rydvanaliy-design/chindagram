import { prisma } from "@/lib/prisma";

// Shape a shared-post relation (Message.sharedPost) into the compact props
// PostEmbed expects — mirrors the repostOf shaping in lib/posts.js.
export function toSharedPostProps(sp, me) {
  if (!sp) return null;
  return {
    id: sp.id, kind: sp.kind, caption: sp.caption, linkUrl: sp.linkUrl, createdAt: sp.createdAt.toISOString(),
    author: sp.author, media: sp.media.map((m) => ({ url: m.url, type: m.type, name: m.name })),
    unavailable: sp.removed || (sp.status !== "VISIBLE" && sp.author.id !== me),
  };
}

export const sharedPostInclude = {
  select: {
    id: true, kind: true, caption: true, linkUrl: true, createdAt: true, removed: true, status: true,
    author: { select: { id: true, name: true, image: true } },
    media: { orderBy: { order: "asc" } },
  },
};

export const messageInclude = {
  sharedPost: sharedPostInclude,
  reactions: { select: { type: true, userId: true } },
  parent: {
    select: {
      id: true, body: true, removed: true, mediaType: true,
      sender: { select: { id: true, name: true } },
    },
  },
};

export function toMessageProps(m, me) {
  return {
    id: m.id,
    body: m.removed ? null : m.body,
    removed: m.removed,
    senderId: m.senderId,
    createdAt: m.createdAt.toISOString(),
    mediaUrl: m.removed ? null : m.mediaUrl,
    mediaType: m.removed ? null : m.mediaType,
    sharedPost: m.removed ? null : toSharedPostProps(m.sharedPost, me),
    parent: m.parent ? {
      id: m.parent.id, body: m.parent.removed ? null : m.parent.body,
      removed: m.parent.removed, mediaType: m.parent.mediaType, senderName: m.parent.sender.name,
    } : null,
    reactions: (m.reactions || []).reduce((acc, r) => { acc[r.type] = (acc[r.type] || 0) + 1; return acc; }, {}),
    myReaction: (m.reactions || []).find((r) => r.userId === me)?.type || null,
  };
}

export async function isConversationMember(conversationId, userId) {
  const m = await prisma.conversationMember.findUnique({ where: { conversationId_userId: { conversationId, userId } } });
  return Boolean(m);
}

export async function isConversationAdmin(conversationId, userId) {
  const m = await prisma.conversationMember.findUnique({ where: { conversationId_userId: { conversationId, userId } } });
  return Boolean(m && m.role === "ADMIN");
}

// Find-or-create the single 1:1 thread between two people. `pairKey` (a
// sorted "idA:idB" string) gives this the same DB-level "only one thread
// per pair" guarantee the old Conversation.aId/bId unique constraint had.
export async function findOrCreate1to1(meId, otherId) {
  const [a, b] = [meId, otherId].sort();
  const pairKey = `${a}:${b}`;
  const existing = await prisma.conversation.findUnique({ where: { pairKey } });
  if (existing) return existing;
  return prisma.conversation.create({
    data: {
      isGroup: false, pairKey, createdById: meId,
      members: { create: [{ userId: meId }, { userId: otherId }] },
    },
  });
}

// Display name/avatar for a conversation from `meId`'s point of view.
// `members` must include the `user` relation (id, name, image).
export function conversationDisplay(convo, meId) {
  if (convo.isGroup) {
    const others = convo.members.filter((m) => m.userId !== meId).map((m) => m.user.name);
    return { name: convo.name || others.slice(0, 3).join(", ") || "Group", image: null, isGroup: true, memberCount: convo.members.length };
  }
  const other = convo.members.find((m) => m.userId !== meId)?.user;
  return { name: other?.name || "Unknown", image: other?.image || null, isGroup: false, otherId: other?.id || null };
}
