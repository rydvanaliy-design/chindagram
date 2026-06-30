import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/guards";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import SettingsForms from "@/components/SettingsForms";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
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
    <div className="flex min-h-screen flex-col bg-gray-50">
      <TopBar />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6">
        <h1 className="mb-4 text-lg font-semibold">Settings</h1>
        <SettingsForms user={user} />
        <div className="mt-6 flex gap-4 text-sm">
          <Link href="/saved" className="text-brand">Saved posts</Link>
          <Link href={`/u/${user.id}`} className="text-brand">View my profile</Link>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
