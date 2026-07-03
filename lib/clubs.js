import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/roles";

// Can `userId` manage this club's membership/posts (approve requests,
// promote/demote, pin, post announcements)? A platform Admin always can
// (safety/moderation bypass, same pattern as canViewProfile); otherwise the
// person must be an ACCEPTED club member with role ADMIN — any member can
// hold that role, not just Teacher/Admin accounts (owner's decision).
export async function isClubAdmin(clubId, userId, platformRole) {
  if (isAdmin(platformRole)) return true;
  const member = await prisma.clubMember.findUnique({
    where: { clubId_userId: { clubId, userId } },
    select: { status: true, role: true },
  });
  return Boolean(member && member.status === "ACCEPTED" && member.role === "ADMIN");
}

// Is `userId` an accepted member (any role) of this club?
export async function isClubMember(clubId, userId) {
  const member = await prisma.clubMember.findUnique({
    where: { clubId_userId: { clubId, userId } },
    select: { status: true },
  });
  return Boolean(member && member.status === "ACCEPTED");
}
