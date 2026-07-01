import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/guards";
import { postInclude, toPostProps } from "@/lib/posts";
import { canModerateContent } from "@/lib/roles";
import { canViewProfile, isBlockedEitherWay } from "@/lib/privacy";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import PostCard from "@/components/PostCard";

export const dynamic = "force-dynamic";

export default async function PostPage({ params }) {
  const viewer = await getSessionUser();
  if (!viewer) redirect("/login");
  const me = viewer.id;

  const row = await prisma.post.findUnique({ where: { id: params.id }, include: postInclude(me) });
  if (!row || row.removed) notFound();
  // Held posts are only viewable by their author or a content moderator.
  if (row.status === "PENDING" && row.authorId !== me && !canModerateContent(viewer.role)) notFound();
  // Private accounts: only an approved follower (or the author/admin) can open the post directly.
  if (!(await canViewProfile(me, viewer.role, row.authorId))) notFound();
  // Blocked either way (except the author viewing their own post) — treat as gone.
  if (row.authorId !== me && (await isBlockedEitherWay(me, row.authorId, viewer.role))) notFound();

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <TopBar />
      <main className="mx-auto w-full max-w-xl flex-1 py-4">
        <PostCard post={toPostProps(row, me)} currentUserId={me} isAdmin={viewer.role === "ADMIN"} />
      </main>
      <BottomNav />
    </div>
  );
}
