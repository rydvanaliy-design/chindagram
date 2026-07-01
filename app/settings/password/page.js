import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/guards";
import SettingsHeader from "@/components/settings/SettingsHeader";
import PasswordForm from "@/components/settings/PasswordForm";

export default async function PasswordPage() {
  const viewer = await getSessionUser();
  if (!viewer) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50">
      <SettingsHeader title="Password" />
      <main className="mx-auto w-full max-w-xl px-4 py-6">
        <PasswordForm />
      </main>
    </div>
  );
}
