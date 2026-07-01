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

// IDs of clubs `me` belongs to.
export async function myClubIds(me) {
  const rows = await prisma.clubMember.findMany({ where: { userId: me }, select: { clubId: true } });
  return rows.map((r) => r.clubId);
}

// IDs of everyone who shares at least one club with `me` (excluding `me`).
// Mirrors classmateIds — "posts by people in my clubs" powers the Clubs tab,
// same way "posts by people in my class" powers My Class, until clubs get
// their own dedicated per-club feed in the later Communities phase.
export async function clubmateIds(me) {
  const clubIds = await myClubIds(me);
  if (clubIds.length === 0) return [];
  const rows = await prisma.clubMember.findMany({
    where: { clubId: { in: clubIds }, userId: { not: me } },
    select: { userId: true },
  });
  return [...new Set(rows.map((r) => r.userId))];
}
