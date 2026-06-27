import { prisma } from "@/lib/prisma";

// Small key/value settings store (AppSetting table).

export async function getSetting(key, fallback = null) {
  const row = await prisma.appSetting.findUnique({ where: { key } });
  return row ? row.value : fallback;
}

export async function setSetting(key, value) {
  await prisma.appSetting.upsert({
    where: { key },
    update: { value: String(value) },
    create: { key, value: String(value) },
  });
}

// School-wide "hold every post and comment for review" switch (off by default).
// Confirmed decision #2: full pre-approval can be turned on later; it doesn't
// scale to hand-approve everything, so it's opt-in.
export const REQUIRE_APPROVAL = "requireApproval";

export async function requireApproval() {
  return (await getSetting(REQUIRE_APPROVAL, "false")) === "true";
}
