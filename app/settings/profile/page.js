import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/guards";
import SettingsHeader from "@/components/settings/SettingsHeader";
import EditProfileForm from "@/components/settings/EditProfileForm";
import { getLocale } from "@/lib/i18n/getLocale";
import { makeT } from "@/lib/i18n/t";

export const dynamic = "force-dynamic";

export default async function EditProfilePage() {
  const viewer = await getSessionUser();
  if (!viewer) redirect("/login");
  const locale = await getLocale();
  const t = makeT(locale);

  const user = await prisma.user.findUnique({
    where: { id: viewer.id },
    select: {
      id: true, name: true, username: true, bio: true, image: true,
      pronouns: true, interests: true, links: true, theme: true,
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <SettingsHeader title={t("settings.editProfile.title")} />
      <main className="mx-auto w-full max-w-xl px-4 py-6">
        <EditProfileForm user={user} />
      </main>
    </div>
  );
}
