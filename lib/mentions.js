import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";

// Pull @usernames out of a piece of text (lowercased, de-duplicated).
export function extractMentions(text) {
  const out = new Set();
  const re = /@([a-zA-Z0-9_]+)/g;
  let m;
  while ((m = re.exec(String(text || "")))) out.add(m[1].toLowerCase());
  return [...out];
}

// Notify each mentioned user (skips the author and unknown handles).
export async function notifyMentions({ text, postId, actorId }) {
  const handles = extractMentions(text);
  if (handles.length === 0) return;
  const users = await prisma.user.findMany({
    where: { username: { in: handles }, disabled: false },
    select: { id: true },
  });
  for (const u of users) {
    await notify({ recipientId: u.id, actorId, type: "MENTION", postId });
  }
}
