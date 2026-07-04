import Link from "next/link";
import { auth } from "@/lib/auth";
import { Home, Reel, PlusSquare, Send, UserCircle } from "@/components/icons";
import { getLocale } from "@/lib/i18n/getLocale";
import { makeT } from "@/lib/i18n/t";

export default async function BottomNav() {
  const locale = await getLocale();
  const t = makeT(locale);
  const session = await auth();
  const user = session?.user;
  return (
    <nav aria-label={t("common.nav.primary")} className="sticky bottom-0 z-20 border-t border-gray-200 bg-white sm:hidden">
      <div className="mx-auto flex max-w-xl items-center justify-around px-5 py-3 text-gray-900">
        <Link href="/" aria-label={t("common.nav.home")}><Home /></Link>
        <Link href="/reels" aria-label={t("common.nav.reels")}><Reel /></Link>
        <Link href="/new" aria-label={t("common.nav.newPost")}><PlusSquare /></Link>
        <Link href="/messages" aria-label={t("common.nav.messages")}><Send /></Link>
        <Link href={user ? `/u/${user.id}` : "/login"} aria-label={t("common.nav.profile")}><UserCircle /></Link>
      </div>
    </nav>
  );
}
