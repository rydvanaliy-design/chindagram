import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n/locales";

// Logged in: the account's saved preference wins. Logged out (or no preference
// yet): fall back to the "locale" cookie set by the language switch, then the
// site default. Never throws — worst case you get DEFAULT_LOCALE.
export async function getLocale() {
  try {
    const session = await auth();
    if (session?.user?.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { locale: true },
      });
      if (user?.locale && isLocale(user.locale)) return user.locale;
    }
  } catch {}

  try {
    const cookieLocale = cookies().get("locale")?.value;
    if (isLocale(cookieLocale)) return cookieLocale;
  } catch {}

  return DEFAULT_LOCALE;
}
