import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canModerateContent } from "@/lib/roles";
import { Search, Bell, Send, Shield, Flag, Calendar } from "@/components/icons";
import { getLocale } from "@/lib/i18n/getLocale";
import { makeT } from "@/lib/i18n/t";

export default async function TopBar() {
  const locale = await getLocale();
  const t = makeT(locale);
  const session = await auth();
  const user = session?.user;
  const isStaff = canModerateContent(user?.role);
  let unread = 0;
  let toReview = 0;
  if (user?.id) {
    try { unread = await prisma.notification.count({ where: { recipientId: user.id, read: false } }); } catch {}
    if (isStaff) {
      try {
        toReview = await prisma.post.count({ where: { status: "PENDING", removed: false } })
          + await prisma.comment.count({ where: { status: "PENDING", removed: false } })
          + await prisma.wallPost.count({ where: { status: "PENDING", removed: false } });
      } catch {}
    }
  }

  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.png" alt={t("common.appName")} className="h-7 w-7 rounded-md" />
          <span className="text-xl font-bold tracking-tight text-brand">Chindagram</span>
        </Link>
        <nav aria-label={t("common.nav.secondary")} className="flex items-center gap-4 text-gray-800">
          {isStaff && (
            <Link href="/review" title={t("common.nav.review")} aria-label={t("common.nav.review")} className="relative hover:text-brand">
              <Flag />
              {toReview > 0 && <span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">{toReview > 9 ? "9+" : toReview}</span>}
            </Link>
          )}
          {user?.role === "ADMIN" && <Link href="/admin" title={t("common.nav.admin")} aria-label={t("common.nav.admin")} className="hover:text-brand"><Shield /></Link>}
          <Link href="/events" title={t("common.nav.events")} aria-label={t("common.nav.events")} className="hover:text-brand"><Calendar /></Link>
          <Link href="/explore" title={t("common.nav.explore")} aria-label={t("common.nav.explore")} className="hover:text-brand"><Search /></Link>
          <Link href="/notifications" title={t("common.nav.notifications")} aria-label={t("common.nav.notifications")} className="relative hover:text-brand">
            <Bell />
            {unread > 0 && <span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{unread > 9 ? "9+" : unread}</span>}
          </Link>
          <Link href="/messages" title={t("common.nav.messages")} aria-label={t("common.nav.messages")} className="hover:text-brand"><Send /></Link>
        </nav>
      </div>
    </header>
  );
}
