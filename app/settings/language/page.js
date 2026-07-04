import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/guards";
import SettingsHeader from "@/components/settings/SettingsHeader";
import LanguageSwitch from "@/components/LanguageSwitch";
import { getLocale } from "@/lib/i18n/getLocale";
import { makeT } from "@/lib/i18n/t";

export const dynamic = "force-dynamic";

export default async function LanguagePage() {
  const viewer = await getSessionUser();
  if (!viewer) redirect("/login");

  const locale = await getLocale();
  const t = makeT(locale);

  return (
    <div className="min-h-screen bg-gray-50">
      <SettingsHeader title={t("settings.language.title")} />
      <main className="mx-auto w-full max-w-xl px-4 py-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-sm font-semibold text-gray-900">{t("settings.language.heading")}</p>
          <p className="mt-1 text-sm text-gray-500">{t("settings.language.description")}</p>
          <div className="mt-4">
            <LanguageSwitch />
          </div>
        </div>
      </main>
    </div>
  );
}
