import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/guards";
import { isLocale } from "@/lib/i18n/locales";

// Works both logged in and logged out (login/register/join pages can switch
// language too). Logged in: saved to the account so it follows the user
// across devices. Always also set as a cookie so it applies immediately and
// survives to the next logged-out page load.
export async function POST(req) {
  const { locale } = await req.json().catch(() => ({}));
  if (!isLocale(locale)) {
    return NextResponse.json({ error: "Unknown language." }, { status: 400 });
  }

  const me = await getSessionUser();
  if (me) {
    await prisma.user.update({ where: { id: me.id }, data: { locale } });
  }

  const res = NextResponse.json({ ok: true, locale });
  res.cookies.set("locale", locale, { maxAge: 60 * 60 * 24 * 365, path: "/", sameSite: "lax" });
  return res;
}
