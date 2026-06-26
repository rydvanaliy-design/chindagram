import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Returns the live, active user { id, name, role } or null.
// Re-checks the database so a disabled account is locked out right away,
// even if it still holds a valid session cookie.
export async function getSessionUser() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, role: true, disabled: true },
  });
  if (!user || user.disabled) return null;
  return { id: user.id, name: user.name, role: user.role };
}

// For API write routes.
export async function requireUserId() {
  const u = await getSessionUser();
  return u?.id ?? null;
}

export async function requireAdmin() {
  const u = await getSessionUser();
  return u?.role === "ADMIN" ? u : null;
}
