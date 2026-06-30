import { prisma } from "@/lib/prisma";

// Usernames are the @handle used for mentions and profile links.
// Lowercase letters, numbers, and underscores; 3–20 chars.

export function sanitizeUsername(raw) {
  return String(raw || "")
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 20);
}

export function isValidUsername(name) {
  return /^[a-z0-9_]{3,20}$/.test(name);
}

// Pick a unique username from a seed (e.g. an email or name), adding a numeric
// suffix if needed. `exceptId` lets a user keep their own handle while editing.
export async function uniqueUsername(seed, exceptId = null) {
  let base = sanitizeUsername(seed);
  if (base.length < 3) base = `user_${base}`.slice(0, 20);

  for (let i = 0; i < 50; i++) {
    const candidate = i === 0 ? base : `${base}${i}`.slice(0, 20);
    const existing = await prisma.user.findUnique({ where: { username: candidate }, select: { id: true } });
    if (!existing || existing.id === exceptId) return candidate;
  }
  // Extremely unlikely fallback.
  return `${base}${Date.now().toString().slice(-4)}`.slice(0, 20);
}
