import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/guards";
import { getPostList } from "@/lib/posts";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import PostCard from "@/components/PostCard";

export const dynamic = "force-dynamic";

export default async function SavedPage() {
  const viewer = await getSessionUser();
  if (!viewer) redirect("/login");
  const me = viewer.id;

  const saves = await prisma.save.findMany({ where: { userId: me }, select: { postId: true } });
  const ids = saves.map((s) => s.postId);
  const posts = ids.length ? await getPostList({ id: { in: ids } }, me, 60) : [];

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <TopBar />
      <main className="mx-auto w-full max-w-xl flex-1 py-4">
        <h1 className="px-4 pb-2 text-lg font-semibold">Saved</h1>
        {posts.length === 0 ? (
          <p className="px-6 py-16 text-center text-sm text-gray-400">Nothing saved yet. Tap the bookmark on any post.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {posts.map((post) => <PostCard key={post.id} post={post} currentUserId={me} isAdmin={viewer.role === "ADMIN"} />)}
          </div>
        )}
        <div className="px-4 pt-2 text-center"><Link href="/" className="text-sm text-brand">Back to feed</Link></div>
      </main>
      <BottomNav />
    </div>
  );
}
