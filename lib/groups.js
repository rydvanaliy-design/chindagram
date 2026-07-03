import { prisma } from "@/lib/prisma";

// IDs of everyone sharing the same class label (e.g. "Class 6B"), excluding `me`.
// Powers the "My Class" feed tab — a simple, honest auto-connection: same
// label = same class. No gradeClass set means no classmates to group with.
export async function classmateIds(me, gradeClass) {
  if (!gradeClass) return [];
  const rows = await prisma.user.findMany({
    where: { gradeClass, id: { not: me }, disabled: false },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

// IDs of clubs `me` belongs to (accepted membership only — a pending join
// request doesn't count as belonging yet).
export async function myClubIds(me) {
  const rows = await prisma.clubMember.findMany({ where: { userId: me, status: "ACCEPTED" }, select: { clubId: true } });
  return rows.map((r) => r.clubId);
}

// IDs of everyone who shares at least one club with `me` (excluding `me`).
// Powers the feed's Clubs tab (general clubmate activity), separate from a
// club's own dedicated feed (Post.clubId) built in Phase 6.
export async function clubmateIds(me) {
  const clubIds = await myClubIds(me);
  if (clubIds.length === 0) return [];
  const rows = await prisma.clubMember.findMany({
    where: { clubId: { in: clubIds }, userId: { not: me }, status: "ACCEPTED" },
    select: { userId: true },
  });
  return [...new Set(rows.map((r) => r.userId))];
}
