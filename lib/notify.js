import { prisma } from "@/lib/prisma";

// Create a notification. No-op when the actor is the recipient (don't notify yourself).
export async function notify({ recipientId, actorId, type, postId = null, clubId = null, eventId = null }) {
  if (!recipientId || recipientId === actorId) return;
  try {
    await prisma.notification.create({ data: { recipientId, actorId, type, postId, clubId, eventId } });
  } catch (e) {
    console.error("notify failed", e);
  }
}
