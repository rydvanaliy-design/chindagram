import { prisma } from "@/lib/prisma";
import { isAdmin, isStaff } from "@/lib/roles";

// Confirmed decision #1: Student/Parent accounts default private and can
// switch; Teacher/Admin accounts are always public. A private account's
// posts/profile are only visible to an APPROVED follower (or the owner).
// Admins can bypass this for safety/moderation review.
//
// Enforcement always checks the author's ROLE, never just the stored
// `private` column — that column only self-toggles for Student/Parent
// (server-enforced in /api/settings/privacy), but a Teacher/Admin row could
// still have `private: true` sitting in the DB (e.g. the schema default,
// before a promotion explicitly clears it). Role is the source of truth.

// Prisma where-fragment: does `me` have permission to see posts by `author`?
// Use inside a Post/Comment query alongside the moderation visibleToViewer().
export function postVisibleToViewer(me) {
  return {
    OR: [
      { authorId: me },
      { author: { private: false } },
      { author: { role: { in: ["TEACHER", "ADMIN"] } } },
      { author: { followers: { some: { followerId: me, status: "ACCEPTED" } } } },
    ],
  };
}

// Same idea, for querying/checking a specific target user's profile directly.
export async function canViewProfile(viewerId, viewerRole, targetId) {
  if (viewerId === targetId) return true;
  if (isAdmin(viewerRole)) return true;
  const target = await prisma.user.findUnique({ where: { id: targetId }, select: { private: true, role: true } });
  if (!target) return false;
  if (!target.private || isStaff(target.role)) return true;
  const follow = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: viewerId, followingId: targetId } },
  });
  return follow?.status === "ACCEPTED";
}

// IDs of everyone `me` has blocked or been blocked by (either direction counts).
// Use to filter people lists / search / post pools so blocked accounts vanish
// from each other, without needing a block-visibility check at every call site.
export async function blockedIdsFor(me) {
  const blocks = await prisma.block.findMany({
    where: { OR: [{ blockerId: me }, { blockedId: me }] },
    select: { blockerId: true, blockedId: true },
  });
  return [...new Set(blocks.flatMap((b) => [b.blockerId, b.blockedId]).filter((id) => id !== me))];
}

// A block from either side counts as blocked (admins bypass, for moderation).
export async function isBlockedEitherWay(a, b, viewerRole) {
  if (isAdmin(viewerRole)) return false;
  const block = await prisma.block.findFirst({
    where: { OR: [{ blockerId: a, blockedId: b }, { blockerId: b, blockedId: a }] },
  });
  return Boolean(block);
}
