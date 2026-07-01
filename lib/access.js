import { prisma } from "@/lib/prisma";

// The very first account on a fresh install becomes the admin.
export async function isBootstrap() {
  return (await prisma.user.count()) === 0;
}
