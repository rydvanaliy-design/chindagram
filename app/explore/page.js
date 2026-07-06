import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/guards";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import Avatar from "@/components/Avatar";
import SafeImage from "@/components/SafeImage";
import { Search, Reel } from "@/components/icons";
import { blockedIdsFor, postVisibleToViewer } from "@/lib/privacy";
import { engagementScore } from "@/lib/ranking";
import { trendingHashtags } from "@/lib/trending";
import { getLocale } from "@/lib/i18n/getLocale";
import { makeT } from "@/lib/i18n/t";

export const dynamic = "force-dynamic";

function formatEventDate(d) {
  return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default async function ExplorePage({ searchParams }) {
  const viewer = await getSessionUser();
  if (!viewer) redirect("/login");
  const locale = await getLocale();
  const t = makeT(locale);
  const me = viewer.id;
  const q = (searchParams?.q || "").trim();
  const isAdmin = viewer.role === "ADMIN";

  const blockedIds = await blockedIdsFor(me);
  const postVisibility = { removed: false, status: "VISIBLE", clubId: null, authorId: { notIn: blockedIds }, ...(isAdmin ? {} : postVisibleToViewer(me)) };

  let users = [], posts = [], clubs = [], events = [], hashtagCount = 0;
  const tagQuery = q.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase();

  if (q) {
    [users, posts, clubs, events, hashtagCount] = await Promise.all([
      prisma.user.findMany({
        where: { disabled: false, id: { notIn: [me, ...blockedIds] }, name: { contains: q } },
        take: 10, select: { id: true, name: true, image: true, bio: true },
      }),
      prisma.post.findMany({
        where: { ...postVisibility, caption: { contains: q } },
        orderBy: { createdAt: "desc" }, take: 10,
        select: { id: true, caption: true, author: { select: { name: true } }, media: { orderBy: { order: "asc" }, take: 1, select: { url: true, type: true } } },
      }),
      prisma.club.findMany({
        where: { OR: [{ name: { contains: q } }, { description: { contains: q } }] },
        take: 10, select: { id: true, name: true, description: true, _count: { select: { members: { where: { status: "ACCEPTED" } } } } },
      }),
      prisma.event.findMany({
        where: { title: { contains: q }, startAt: { gte: new Date() } },
        orderBy: { startAt: "asc" }, take: 10, select: { id: true, title: true, startAt: true },
      }),
      tagQuery ? prisma.post.count({ where: { ...postVisibility, caption: { contains: `#${tagQuery}` } } }) : 0,
    ]);
  }

  // Trending — ranked by engagement over the last 14 days, not pure recency.
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const candidatePool = await prisma.post.findMany({
    where: { ...postVisibility, media: { some: { type: { in: ["IMAGE", "VIDEO"] } } }, createdAt: { gte: twoWeeksAgo } },
    orderBy: { createdAt: "desc" },
    take: 150,
    include: { media: { orderBy: { order: "asc" }, take: 1 }, _count: { select: { likes: true, comments: true } } },
  });
  const now = Date.now();
  const trendingPosts = [...candidatePool].sort((a, b) => engagementScore(b, now) - engagementScore(a, now)).slice(0, 30);

  const hotTags = await trendingHashtags({ ...postVisibility });

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <TopBar />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-4">
        <form action="/explore" className="mb-4 flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2">
          <span className="text-gray-400"><Search /></span>
          <input name="q" defaultValue={q} placeholder={t("discovery.search.placeholder")} className="flex-1 text-sm outline-none" />
        </form>

        {q ? (
          <>
            {tagQuery && hashtagCount > 0 && (
              <section className="mb-6">
                <Link href={`/tag/${tagQuery}`} className="block rounded-2xl border border-gray-200 bg-white px-4 py-3 hover:bg-gray-50">
                  <span className="font-semibold text-brand">#{tagQuery}</span>
                  <span className="ml-2 text-sm text-gray-500">{hashtagCount === 1 ? t("discovery.tag.postCountOne") : t("discovery.tag.postCount", { count: hashtagCount })}</span>
                </Link>
              </section>
            )}

            <section className="mb-6">
              <h2 className="mb-2 text-sm font-semibold text-gray-500">{t("discovery.sections.people")}</h2>
              {users.length === 0 ? (
                <p className="text-sm text-gray-400">{t("discovery.tag.noMatch", { query: q })}</p>
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

            {posts.length > 0 && (
              <section className="mb-6">
                <h2 className="mb-2 text-sm font-semibold text-gray-500">{t("discovery.sections.posts")}</h2>
                <ul className="divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white">
                  {posts.map((p) => (
                    <li key={p.id}>
                      <Link href={`/p/${p.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                        {p.media[0] && <SafeImage src={p.media[0].url} alt="" className="h-12 w-12 shrink-0 rounded-lg bg-gray-100 object-cover" />}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{p.author.name}</p>
                          <p className="truncate text-xs text-gray-400">{p.caption}</p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {clubs.length > 0 && (
              <section className="mb-6">
                <h2 className="mb-2 text-sm font-semibold text-gray-500">{t("discovery.sections.clubs")}</h2>
                <ul className="divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white">
                  {clubs.map((c) => (
                    <li key={c.id}>
                      <Link href={`/clubs/${c.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{c.name}</p>
                          {c.description && <p className="truncate text-xs text-gray-400">{c.description}</p>}
                        </div>
                        <span className="shrink-0 text-xs text-gray-400">{c._count.members === 1 ? t("discovery.clubs.memberCountOne") : t("discovery.clubs.memberCount", { count: c._count.members })}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {events.length > 0 && (
              <section className="mb-6">
                <h2 className="mb-2 text-sm font-semibold text-gray-500">{t("discovery.sections.events")}</h2>
                <ul className="divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white">
                  {events.map((e) => (
                    <li key={e.id}>
                      <Link href={`/events/${e.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50">
                        <span className="truncate text-sm font-semibold">{e.title}</span>
                        <span className="shrink-0 text-xs text-gray-400">{formatEventDate(e.startAt)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {users.length === 0 && posts.length === 0 && clubs.length === 0 && events.length === 0 && hashtagCount === 0 && (
              <p className="py-10 text-center text-sm text-gray-400">{t("discovery.tag.noMatchAny", { query: q })}</p>
            )}
          </>
        ) : (
          <>
            {hotTags.length > 0 && (
              <section className="mb-4">
                <h2 className="mb-2 text-sm font-semibold text-gray-500">{t("discovery.sections.trendingTags")}</h2>
                <div className="flex flex-wrap gap-2">
                  {hotTags.map((t) => (
                    <Link key={t.tag} href={`/tag/${t.tag}`} className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-brand hover:bg-gray-50">
                      #{t.tag} <span className="text-gray-400">· {t.count}</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <h2 className="mb-2 text-sm font-semibold text-gray-500">{t("discovery.sections.trending")}</h2>
            <div className="grid grid-cols-3 gap-1 sm:gap-2">
              {trendingPosts.map((p) => {
                const t = p.media[0];
                const isVideo = p.kind === "REEL" || t?.type === "VIDEO";
                return (
                  <Link key={p.id} href={`/p/${p.id}`} className="relative aspect-square overflow-hidden rounded-md bg-gray-100">
                    {isVideo ? <video src={t?.url} className="h-full w-full object-cover" muted /> : <SafeImage src={t?.url} alt="" className="h-full w-full object-cover" />}
                    {isVideo && <span className="absolute right-1 top-1 text-white drop-shadow"><Reel /></span>}
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
