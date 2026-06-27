import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/guards";
import { getPostList } from "@/lib/posts";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import PostCard from "@/components/PostCard";
import StoriesBar from "@/components/StoriesBar";

export const dynamic = "force-dynamic";

export default async function FeedPage() {
  const viewer = await getSessionUser();
  if (!viewer) redirect("/login");
  const me = viewer.id;
  const isAdmin = viewer.role === "ADMIN";

  const meUser = await prisma.user.findUnique({ where: { id: me }, select: { id: true, name: true, image: true } });
  const following = await prisma.follow.findMany({ where: { followerId: me }, select: { followingId: true } });
  const authorIds = [me, ...following.map((f) => f.followingId)];

  const stories = await prisma.story.findMany({
    where: { expiresAt: { gt: new Date() }, authorId: { in: authorIds } },
    orderBy: { createdAt: "asc" },
    include: { author: { select: { id: true, name: true, image: true } } },
  });
  const map = new Map();
  for (const s of stories) {
    if (!map.has(s.authorId)) map.set(s.authorId, { author: s.author, stories: [] });
    map.get(s.authorId).stories.push({ id: s.id, imageUrl: s.imageUrl });
  }
  let groups = [...map.values()];
  groups.sort((a, b) => (a.author.id === me ? -1 : b.author.id === me ? 1 : 0));

  const posts = await getPostList({ authorId: { in: authorIds } }, me, 30);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <TopBar />
      <StoriesBar groups={groups} me={meUser} />
      <main className="mx-auto w-full max-w-xl flex-1">
        {posts.length === 0 ? (
          <div className="px-6 py-20 text-center text-gray-500">
            <p className="mb-2 font-medium">Your feed is quiet.</p>
            <p className="mb-4 text-sm">Follow classmates or share your first post.</p>
            <div className="flex justify-center gap-3">
              <Link href="/explore" className="ig-btn-soft">Find people</Link>
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
