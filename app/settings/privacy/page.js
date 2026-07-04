import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/guards";
import { isStaff } from "@/lib/roles";
import SettingsHeader from "@/components/settings/SettingsHeader";
import PrivacyForm from "@/components/settings/PrivacyForm";
import { getLocale } from "@/lib/i18n/getLocale";
import { makeT } from "@/lib/i18n/t";

export const dynamic = "force-dynamic";

export default async function PrivacyPage() {
  const viewer = await getSessionUser();
  if (!viewer) redirect("/login");
  const locale = await getLocale();
  const t = makeT(locale);

  const user = await prisma.user.findUnique({ where: { id: viewer.id }, select: { role: true, private: true } });

  return (
    <div className="min-h-screen bg-gray-50">
      <SettingsHeader title={t("settings.privacyPage.title")} />
      <main className="mx-auto w-full max-w-xl px-4 py-6">
        <PrivacyForm initialPrivate={user.private} isStaff={isStaff(user.role)} />
      </main>
    </div>
  );
}
