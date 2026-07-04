import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/guards";
import { isStaff } from "@/lib/roles";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import Avatar from "@/components/Avatar";
import { SettingsRow, SettingsSection } from "@/components/settings/SettingsRow";
import LogoutRow from "@/components/settings/LogoutRow";
import { ChevronRight, UserCircle, Lock, Key, Bookmark, Shield, Globe } from "@/components/icons";
import { getLocale } from "@/lib/i18n/getLocale";
import { makeT } from "@/lib/i18n/t";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const viewer = await getSessionUser();
  if (!viewer) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: viewer.id },
    select: { id: true, name: true, username: true, image: true, role: true, private: true },
  });

  const locale = await getLocale();
  const t = makeT(locale);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <TopBar />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6">
        <h1 className="mb-4 text-lg font-semibold">{t("settings.title")}</h1>

        <Link href={`/u/${user.id}`} className="mb-6 flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 hover:bg-gray-50">
          <Avatar name={user.name} image={user.image} size={52} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            {user.username && <p className="truncate text-xs text-gray-400">@{user.username}</p>}
          </div>
          <span className="text-sm font-semibold text-brand">{t("settings.viewProfile")}</span>
          <ChevronRight />
        </Link>

        <SettingsSection title={t("settings.section.account")}>
          <SettingsRow href="/settings/profile" icon={<UserCircle />} label={t("settings.row.editProfile")} />
          <SettingsRow href="/settings/privacy" icon={<Lock />} label={t("settings.row.privacy")} hint={isStaff(user.role) ? t("settings.privacy.public") : (user.private ? t("settings.privacy.private") : t("settings.privacy.public"))} />
          <SettingsRow href="/settings/password" icon={<Key />} label={t("settings.row.password")} />
          <SettingsRow href="/settings/language" icon={<Globe />} label={t("settings.row.language")} hint={locale === "th" ? t("common.language.thai") : t("common.language.english")} />
        </SettingsSection>

        <SettingsSection title={t("settings.section.content")}>
          <SettingsRow href="/saved" icon={<Bookmark />} label={t("settings.row.saved")} />
        </SettingsSection>

        {user.role === "ADMIN" && (
          <SettingsSection title={t("settings.section.school")}>
            <SettingsRow href="/admin" icon={<Shield />} label={t("settings.row.admin")} />
          </SettingsSection>
        )}

        <section className="mb-6">
          <div className="rounded-2xl border border-gray-200 bg-white">
            <LogoutRow />
          </div>
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
