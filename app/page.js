import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/guards";
import { postInclude, toPostProps, visibleToViewer } from "@/lib/posts";
import { postVisibleToViewer, blockedIdsFor } from "@/lib/privacy";
import { classmateIds, clubmateIds } from "@/lib/groups";
import { engagementScore, withBoostedFirst } from "@/lib/ranking";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import PostCard from "@/components/PostCard";
import StoriesBar from "@/components/StoriesBar";
import FeedTabs from "@/components/FeedTabs";
import { getLocale } from "@/lib/i18n/getLocale";
import { makeT } from "@/lib/i18n/t";

export const dynamic = "force-dynamic";

const TABS = ["following", "foryou", "myclass", "clubs", "announcements"];

export default async function FeedPage({ searchParams }) {
  const locale = await getLocale();
  const t = makeT(locale);
  const EMPTY_COPY = {
    following: { title: t("posts.feed.empty.following.title"), body: t("posts.feed.empty.following.body") },
    foryou: { title: t("posts.feed.empty.foryou.title"), body: t("posts.feed.empty.foryou.body") },
    myclass: { title: t("posts.feed.empty.myclass.title"), body: t("posts.feed.empty.myclass.body") },
    clubs: { title: t("posts.feed.empty.clubs.title"), body: t("posts.feed.empty.clubs.body") },
    announcements: { title: t("posts.feed.empty.announcements.title"), body: t("posts.feed.empty.announcements.body") },
  };

  const viewer = await getSessionUser();
  if (!viewer) redirect("/login");
  const me = viewer.id;
  const isAdmin = viewer.role === "ADMIN";
  const tab = TABS.includes(searchParams?.tab) ? searchParams.tab : "following";

  const meUser = await prisma.user.findUnique({ where: { id: me }, select: { id: true, name: true, image: true, gradeClass: true } });

  const acceptedFollowing = await prisma.follow.findMany({ where: { followerId: me, status: "ACCEPTED" }, select: { followingId: true } });
  const followingIds = acceptedFollowing.map((f) => f.followingId);

  const blockedIds = await blockedIdsFor(me);
  const mutedRows = await prisma.mute.findMany({ where: { muterId: me }, select: { mutedId: true } });
  const excludeIds = [...blockedIds, ...mutedRows.map((m) => m.mutedId)];

  // Stories stay tied to who you follow, regardless of which feed tab is open.
  // Club stories live on the club's own page only (same leak-prevention rule
  // as club posts). Close-friends-only stories are filtered below in JS.
  const stories = await prisma.story.findMany({
    where: { expiresAt: { gt: new Date() }, authorId: { in: [me, ...followingIds] }, clubId: null },
    orderBy: { createdAt: "asc" },
    include: {
      author: { select: { id: true, name: true, image: true } },
      repostOf: {
        select: {
          id: true, kind: true, caption: true, linkUrl: true, createdAt: true,
          removed: true, status: true,
          author: { select: { id: true, name: true, image: true } },
          media: { orderBy: { order: "asc" } },
        },
      },
    },
  });
  const closeFriendAuthorIds = new Set(
    (await prisma.closeFriend.findMany({ where: { friendId: me, ownerId: { in: followingIds } }, select: { ownerId: true } }))
      .map((r) => r.ownerId)
  );
  const storyMap = new Map();
  for (const s of stories) {
    if (s.closeFriendsOnly && s.authorId !== me && !closeFriendAuthorIds.has(s.authorId)) continue;
    if (!storyMap.has(s.authorId)) storyMap.set(s.authorId, { author: s.author, stories: [] });
    const repostOf = s.repostOf ? {
      id: s.repostOf.id, kind: s.repostOf.kind, caption: s.repostOf.caption, linkUrl: s.repostOf.linkUrl,
      createdAt: s.repostOf.createdAt.toISOString(), author: s.repostOf.author,
      media: s.repostOf.media.map((m) => ({ url: m.url, type: m.type, name: m.name, alt: m.alt })),
      unavailable: s.repostOf.removed || (s.repostOf.status !== "VISIBLE" && s.repostOf.author.id !== me),
    } : (s.repostOfId ? { unavailable: true } : null);
    storyMap.get(s.authorId).stories.push({
      id: s.id, imageUrl: s.imageUrl, repostOf,
      stickerType: s.stickerType, stickerQuestion: s.stickerQuestion,
      stickerOptions: s.stickerOptions, stickerCorrectIndex: s.stickerCorrectIndex,
    });
  }
  const groups = [...storyMap.values()].sort((a, b) => (a.author.id === me ? -1 : b.author.id === me ? 1 : 0));

  // Work out this tab's post pool.
  let scopedAuthorIds = null; // null = no author restriction (For You / Announcements)
  let extraWhere = {};
  let noGroup = false;
  let candidateTake = 60;
  const useScore = tab === "foryou";

  if (tab === "following") {
    scopedAuthorIds = [me, ...followingIds];
  } else if (tab === "myclass") {
    if (!meUser.gradeClass) noGroup = true;
    else scopedAuthorIds = [me, ...(await classmateIds(me, meUser.gradeClass))];
  } else if (tab === "clubs") {
    const mates = await clubmateIds(me);
    if (mates.length === 0) noGroup = true;
    else scopedAuthorIds = [me, ...mates];
  } else if (tab === "announcements") {
    extraWhere = { category: { not: "NONE" } };
  } else {
    candidateTake = 150; // wider candidate pool for score-ranking
  }

  // Club posts live on the club's own page, not the general platform feed —
  // exclude them everywhere here, including the Teacher/Admin boost
  // injection below (a club post shouldn't leak school-wide just because
  // its author happens to be a Teacher).
  const baseConditions = [visibleToViewer(me), postVisibleToViewer(me), { authorId: { notIn: excludeIds } }, { clubId: null }, extraWhere];

  const inc = postInclude(me);
  inc._count = { select: { likes: true, comments: true } };

  let posts = [];
  if (!noGroup) {
    const scopedWhere = { AND: [...baseConditions, ...(scopedAuthorIds ? [{ authorId: { in: scopedAuthorIds } }] : [])] };
    let pool = await prisma.post.findMany({ where: scopedWhere, orderBy: { createdAt: "desc" }, take: candidateTake, include: inc });

    // Boost injection: Teacher/Admin + school-category posts are official
    // school communication and surface everywhere, not just your own social
    // graph — For You / Announcements already pull from the unrestricted pool.
    if (tab !== "foryou" && tab !== "announcements") {
      const boostWhere = { AND: [...baseConditions, { OR: [{ author: { role: { in: ["TEACHER", "ADMIN"] } } }, { category: { not: "NONE" } }] }] };
      const boostRows = await prisma.post.findMany({ where: boostWhere, orderBy: { createdAt: "desc" }, take: 20, include: inc });
      const seen = new Set(pool.map((p) => p.id));
      for (const b of boostRows) if (!seen.has(b.id)) { pool.push(b); seen.add(b.id); }
    }

    if (useScore) {
      const now = Date.now();
      pool = [...pool].sort((a, b) => engagementScore(b, now) - engagementScore(a, now));
    }
    posts = withBoostedFirst(pool).slice(0, 30).map((p) => toPostProps(p, me));
  }

  const empty = noGroup
    ? tab === "myclass"
      ? { title: t("posts.feed.empty.noClass.title"), body: t("posts.feed.empty.noClass.body") }
      : { title: t("posts.feed.empty.noClubs.title"), body: t("posts.feed.empty.noClubs.body") }
    : EMPTY_COPY[tab];

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <TopBar />
      <FeedTabs active={tab} />
      {tab === "following" && <StoriesBar groups={groups} me={meUser} />}
      <main className="mx-auto w-full max-w-xl flex-1">
        {posts.length === 0 ? (
          <div className="px-6 py-20 text-center text-gray-500">
            <p className="mb-2 font-medium">{empty.title}</p>
            <p className="mb-4 text-sm">{empty.body}</p>
            <div className="flex justify-center gap-3">
              {tab === "clubs" ? (
                <Link href="/clubs" className="ig-btn-soft">{t("posts.feed.empty.browseClubs")}</Link>
              ) : (
                <Link href="/explore" className="ig-btn-soft">{t("posts.feed.empty.findPeople")}</Link>
              )}
              <Link href="/new" className="ig-btn">{t("posts.feed.empty.newPost")}</Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 py-4">
            {posts.map((post) => <PostCard key={post.id} post={post} currentUserId={me} isAdmin={isAdmin} />)}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
