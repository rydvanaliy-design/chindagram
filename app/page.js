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

export const dynamic = "force-dynamic";

const TABS = ["following", "foryou", "myclass", "clubs", "announcements"];

const EMPTY_COPY = {
  following: { title: "Your feed is quiet.", body: "Follow classmates or share your first post." },
  foryou: { title: "Nothing to show yet.", body: "As people post, the liveliest stuff will show up here." },
  myclass: { title: "No class posts yet.", body: "Once classmates post, you'll see them here." },
  clubs: { title: "No club posts yet.", body: "Join a club to see posts from other members." },
  announcements: { title: "No announcements yet.", body: "School news and updates from teachers and admins will appear here." },
};

export default async function FeedPage({ searchParams }) {
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
  const stories = await prisma.story.findMany({
    where: { expiresAt: { gt: new Date() }, authorId: { in: [me, ...followingIds] } },
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
  const storyMap = new Map();
  for (const s of stories) {
    if (!storyMap.has(s.authorId)) storyMap.set(s.authorId, { author: s.author, stories: [] });
    const repostOf = s.repostOf ? {
      id: s.repostOf.id, kind: s.repostOf.kind, caption: s.repostOf.caption, linkUrl: s.repostOf.linkUrl,
      createdAt: s.repostOf.createdAt.toISOString(), author: s.repostOf.author,
      media: s.repostOf.media.map((m) => ({ url: m.url, type: m.type, name: m.name })),
      unavailable: s.repostOf.removed || (s.repostOf.status !== "VISIBLE" && s.repostOf.author.id !== me),
    } : (s.repostOfId ? { unavailable: true } : null);
    storyMap.get(s.authorId).stories.push({ id: s.id, imageUrl: s.imageUrl, repostOf });
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

  const baseConditions = [visibleToViewer(me), postVisibleToViewer(me), { authorId: { notIn: excludeIds } }, extraWhere];

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
      ? { title: "No class assigned yet.", body: "Ask an admin to add you to a class." }
      : { title: "You haven't joined any clubs.", body: "Browse clubs and join one to see posts here." }
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
                <Link href="/clubs" className="ig-btn-soft">Browse clubs</Link>
              ) : (
                <Link href="/explore" className="ig-btn-soft">Find people</Link>
              )}
              <Link href="/new" className="ig-btn">New post</Link>
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
