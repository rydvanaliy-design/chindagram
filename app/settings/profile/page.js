import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/guards";
import SettingsHeader from "@/components/settings/SettingsHeader";
import EditProfileForm from "@/components/settings/EditProfileForm";

export const dynamic = "force-dynamic";

export default async function EditProfilePage() {
  const viewer = await getSessionUser();
  if (!viewer) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: viewer.id },
    select: {
      id: true, name: true, username: true, bio: true, image: true,
      pronouns: true, interests: true, links: true, theme: true,
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <SettingsHeader title="Edit profile" />
      <main className="mx-auto w-full max-w-xl px-4 py-6">
        <EditProfileForm user={user} />
      </main>
    </div>
  );
}
