import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/guards";
import SettingsHeader from "@/components/settings/SettingsHeader";
import PasswordForm from "@/components/settings/PasswordForm";
import { getLocale } from "@/lib/i18n/getLocale";
import { makeT } from "@/lib/i18n/t";

export default async function PasswordPage() {
  const viewer = await getSessionUser();
  if (!viewer) redirect("/login");
  const locale = await getLocale();
  const t = makeT(locale);

  return (
    <div className="min-h-screen bg-gray-50">
      <SettingsHeader title={t("settings.password.title")} />
      <main className="mx-auto w-full max-w-xl px-4 py-6">
        <PasswordForm />
      </main>
    </div>
  );
}
