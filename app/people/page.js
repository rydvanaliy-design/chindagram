import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import Avatar from "@/components/Avatar";
import FollowButton from "@/components/FollowButton";
import { blockedIdsFor } from "@/lib/privacy";

export const dynamic = "force-dynamic";

export default async function PeoplePage() {
  const viewer = await getSessionUser();
  if (!viewer) redirect("/login");
  const me = viewer.id;

  const blockedIds = await blockedIdsFor(me);

  const users = await prisma.user.findMany({
    where: { id: { notIn: [me, ...blockedIds] }, disabled: false },
    orderBy: { name: "asc" },
    select: { id: true, name: true, image: true, bio: true },
  });

  const follows = await prisma.follow.findMany({
    where: { followerId: me },
    select: { followingId: true, status: true },
  });
  const statusByTarget = new Map(follows.map((f) => [f.followingId, f.status]));

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <TopBar />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6">
        <h1 className="mb-4 text-lg font-semibold">People</h1>
        {users.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-400">No one else here yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white">
            {users.map((u) => (
              <li key={u.id} className="flex items-center gap-3 px-4 py-3">
                <Link href={`/u/${u.id}`}>
                  <Avatar name={u.name} image={u.image} size={44} />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/u/${u.id}`} className="block truncate text-sm font-semibold hover:underline">{u.name}</Link>
                  {u.bio && <p className="truncate text-xs text-gray-400">{u.bio}</p>}
                </div>
                <FollowButton targetId={u.id} initialStatus={statusByTarget.get(u.id) || "NONE"} />
              </li>
            ))}
          </ul>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
