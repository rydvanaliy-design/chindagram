import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/guards";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import Avatar from "@/components/Avatar";
import { Search, Reel } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function ExplorePage({ searchParams }) {
  const viewer = await getSessionUser();
  if (!viewer) redirect("/login");
  const me = viewer.id;
  const q = (searchParams?.q || "").trim();

  const users = q
    ? await prisma.user.findMany({
        where: { disabled: false, id: { not: me }, name: { contains: q } },
        take: 20, select: { id: true, name: true, image: true, bio: true },
      })
    : [];

  // Explore is a visual grid — show only posts that have an image or video.
  const recent = await prisma.post.findMany({
    where: { removed: false, status: "VISIBLE", media: { some: { type: { in: ["IMAGE", "VIDEO"] } } } },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: { id: true, kind: true, media: { orderBy: { order: "asc" }, take: 1, select: { url: true, type: true } } },
  });

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <TopBar />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-4">
        <form action="/explore" className="mb-4 flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2">
          <span className="text-gray-400"><Search /></span>
          <input name="q" defaultValue={q} placeholder="Search people by name" className="flex-1 text-sm outline-none" />
        </form>

        {q && (
          <section className="mb-6">
            <h2 className="mb-2 text-sm font-semibold text-gray-500">People</h2>
            {users.length === 0 ? (
              <p className="text-sm text-gray-400">No one matches “{q}”.</p>
            ) : (
              <ul className="divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white">
                {users.map((u) => (
                  <li key={u.id}>
                    <Link href={`/u/${u.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                      <Avatar name={u.name} image={u.image} size={44} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{u.name}</p>
                        {u.bio && <p className="truncate text-xs text-gray-400">{u.bio}</p>}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <h2 className="mb-2 text-sm font-semibold text-gray-500">Explore</h2>
        <div className="grid grid-cols-3 gap-1 sm:gap-2">
          {recent.map((p) => {
            const t = p.media[0];
            const isVideo = p.kind === "REEL" || t?.type === "VIDEO";
            return (
              <Link key={p.id} href={`/p/${p.id}`} className="relative aspect-square overflow-hidden rounded-md bg-gray-100">
                {isVideo ? <video src={t?.url} className="h-full w-full object-cover" muted /> : <img src={t?.url} alt="" className="h-full w-full object-cover" />}
                {isVideo && <span className="absolute right-1 top-1 text-white drop-shadow"><Reel /></span>}
              </Link>
            );
          })}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
