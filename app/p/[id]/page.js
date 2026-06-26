import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/guards";
import { postInclude, toPostProps } from "@/lib/posts";
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
