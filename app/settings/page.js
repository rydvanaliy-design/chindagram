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
import { ChevronRight, UserCircle, Lock, Key, Bookmark, Shield } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const viewer = await getSessionUser();
  if (!viewer) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: viewer.id },
    select: { id: true, name: true, username: true, image: true, role: true, private: true },
  });

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <TopBar />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6">
        <h1 className="mb-4 text-lg font-semibold">Settings</h1>

        <Link href={`/u/${user.id}`} className="mb-6 flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 hover:bg-gray-50">
          <Avatar name={user.name} image={user.image} size={52} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            {user.username && <p className="truncate text-xs text-gray-400">@{user.username}</p>}
          </div>
          <span className="text-sm font-semibold text-brand">View profile</span>
          <ChevronRight />
        </Link>

        <SettingsSection title="Account">
          <SettingsRow href="/settings/profile" icon={<UserCircle />} label="Edit profile" />
          <SettingsRow href="/settings/privacy" icon={<Lock />} label="Privacy" hint={isStaff(user.role) ? "Public" : (user.private ? "Private" : "Public")} />
          <SettingsRow href="/settings/password" icon={<Key />} label="Password" />
        </SettingsSection>

        <SettingsSection title="Content">
          <SettingsRow href="/saved" icon={<Bookmark />} label="Saved posts" />
        </SettingsSection>

        {user.role === "ADMIN" && (
          <SettingsSection title="School">
            <SettingsRow href="/admin" icon={<Shield />} label="Admin tools" />
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
