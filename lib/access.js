import { prisma } from "@/lib/prisma";

// The one school-wide access code is the entry gate to the join page.
// Codes are stored/compared in uppercase, trimmed.

export function normalizeCode(value) {
  return String(value || "").trim().toUpperCase();
}

// Returns the active AccessCode row, or null if none is set.
export async function getActiveCode() {
  return prisma.accessCode.findFirst({
    where: { active: true },
    orderBy: { createdAt: "desc" },
  });
}

// True if the supplied code matches the current active school code.
export async function verifyCode(value) {
  const code = normalizeCode(value);
  if (!code) return false;
  const active = await getActiveCode();
  return Boolean(active) && active.code === code;
}

// The very first account on a fresh install bootstraps the admin and
// does not need a code (there is no admin yet to create one).
export async function isBootstrap() {
  return (await prisma.user.count()) === 0;
}

// Generate a readable code, e.g. "CHINDA-7QK2P9". Avoids easily-confused
// characters (0/O, 1/I/L) so it's easy to read off a printed QR poster.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export function generateCode(randomBytes) {
  let body = "";
  for (let i = 0; i < 6; i++) {
    body += ALPHABET[randomBytes[i] % ALPHABET.length];
  }
  return `CHINDA-${body}`;
}
