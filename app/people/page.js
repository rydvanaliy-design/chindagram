import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { blockedIdsFor } from "@/lib/privacy";
import { classmateIds, clubmateIds } from "@/lib/groups";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import Avatar from "@/components/Avatar";
import FollowButton from "@/components/FollowButton";

export const dynamic = "force-dynamic";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "myclass", label: "My Class" },
  { key: "myclubs", label: "My Clubs" },
  { key: "teachers", label: "Teachers" },
];

export default async function PeoplePage({ searchParams }) {
  const viewer = await getSessionUser();
  if (!viewer) redirect("/login");
  const me = viewer.id;
  const filter = FILTERS.some((f) => f.key === searchParams?.filter) ? searchParams.filter : "all";

  const blockedIds = await blockedIdsFor(me);
  const meUser = await prisma.user.findUnique({ where: { id: me }, select: { gradeClass: true } });

  const follows = await prisma.follow.findMany({ where: { followerId: me }, select: { followingId: true, status: true } });
  const statusByTarget = new Map(follows.map((f) => [f.followingId, f.status]));
  const alreadyConnectedIds = new Set(follows.map((f) => f.followingId));

  let where = { id: { notIn: [me, ...blockedIds] }, disabled: false };
  if (filter === "myclass") {
    const ids = await classmateIds(me, meUser.gradeClass);
    where = ids.length ? { ...where, id: { in: ids } } : { ...where, id: "none" };
  } else if (filter === "myclubs") {
    const ids = await clubmateIds(me);
    where = ids.length ? { ...where, id: { in: ids } } : { ...where, id: "none" };
  } else if (filter === "teachers") {
    where = { ...where, role: { in: ["TEACHER", "ADMIN"] } };
  }

  const users = await prisma.user.findMany({ where, orderBy: { name: "asc" }, select: { id: true, name: true, image: true, bio: true } });

  // People you may know — classmates/clubmates you're not already connected
  // to, shown once regardless of the active directory filter below.
  let suggestions = [];
  if (filter === "all") {
    const [classIds, clubIds] = await Promise.all([classmateIds(me, meUser.gradeClass), clubmateIds(me)]);
    const suggestedIds = [...new Set([...classIds, ...clubIds])].filter((id) => id !== me && !alreadyConnectedIds.has(id) && !blockedIds.includes(id));
    if (suggestedIds.length) {
      suggestions = await prisma.user.findMany({
        where: { id: { in: suggestedIds }, disabled: false },
        take: 10, select: { id: true, name: true, image: true, bio: true },
      });
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <TopBar />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6">
        <h1 className="mb-4 text-lg font-semibold">People</h1>

        {suggestions.length > 0 && (
          <section className="mb-6">
            <h2 className="mb-2 text-sm font-semibold text-gray-500">People you may know</h2>
            <ul className="divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white">
              {suggestions.map((u) => (
                <li key={u.id} className="flex items-center gap-3 px-4 py-3">
                  <Link href={`/u/${u.id}`}><Avatar name={u.name} image={u.image} size={44} /></Link>
                  <div className="min-w-0 flex-1">
                    <Link href={`/u/${u.id}`} className="block truncate text-sm font-semibold hover:underline">{u.name}</Link>
                    {u.bio && <p className="truncate text-xs text-gray-400">{u.bio}</p>}
                  </div>
                  <FollowButton targetId={u.id} initialStatus="NONE" />
                </li>
              ))}
            </ul>
          </section>
        )}

        <nav className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
          {FILTERS.map((f) => (
            <Link
              key={f.key} href={f.key === "all" ? "/people" : `/people?filter=${f.key}`}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold ${filter === f.key ? "border-brand bg-brand text-white" : "border-gray-200 text-gray-600"}`}
            >
              {f.label}
            </Link>
          ))}
        </nav>

        {users.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-400">
            {filter === "myclass" ? "No classmates found." : filter === "myclubs" ? "No clubmates yet — join a club first." : filter === "teachers" ? "No teachers or admins yet." : "No one else here yet."}
          </p>
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
