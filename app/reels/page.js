import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/guards";
import BottomNav from "@/components/BottomNav";
import ReelsFeed from "@/components/ReelsFeed";
import { blockedIdsFor, postVisibleToViewer } from "@/lib/privacy";

export const dynamic = "force-dynamic";

export default async function ReelsPage() {
  const viewer = await getSessionUser();
  if (!viewer) redirect("/login");
  const me = viewer.id;
  const isAdmin = viewer.role === "ADMIN";

  const blockedIds = await blockedIdsFor(me);

  const rows = await prisma.post.findMany({
    where: {
      kind: "REEL", removed: false, status: "VISIBLE",
      authorId: { notIn: blockedIds },
      ...(isAdmin ? {} : postVisibleToViewer(me)),
    },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      author: { select: { id: true, name: true, image: true } },
      media: { orderBy: { order: "asc" }, take: 1 },
      likes: { select: { type: true, userId: true } },
    },
  });

  const reels = rows.map((p) => ({
    id: p.id, caption: p.caption, author: p.author,
    videoUrl: p.media[0]?.url || null,
    totalReactions: p.likes.length,
    myReaction: p.likes.find((l) => l.userId === me)?.type || null,
    reactionBreakdown: p.likes.reduce((acc, l) => { acc[l.type] = (acc[l.type] || 0) + 1; return acc; }, {}),
  }));

  return (
    <div className="relative bg-black">
      <ReelsFeed reels={reels} />
      <div className="fixed inset-x-0 bottom-0 z-20"><BottomNav /></div>
    </div>
  );
}
