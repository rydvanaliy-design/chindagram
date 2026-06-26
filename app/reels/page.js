import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/guards";
import BottomNav from "@/components/BottomNav";
import ReelsFeed from "@/components/ReelsFeed";

export const dynamic = "force-dynamic";

export default async function ReelsPage() {
  const viewer = await getSessionUser();
  if (!viewer) redirect("/login");
  const me = viewer.id;

  const rows = await prisma.post.findMany({
    where: { kind: "REEL", removed: false },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      author: { select: { id: true, name: true, image: true } },
      media: { orderBy: { order: "asc" }, take: 1 },
      _count: { select: { likes: true } },
      likes: { where: { userId: me }, select: { id: true } },
    },
  });

  const reels = rows.map((p) => ({
    id: p.id, caption: p.caption, author: p.author,
    videoUrl: p.media[0]?.url || null,
    likeCount: p._count.likes, likedByMe: p.likes.length > 0,
  }));

  return (
    <div className="relative bg-black">
      <ReelsFeed reels={reels} />
      <div className="fixed inset-x-0 bottom-0 z-20"><BottomNav /></div>
    </div>
  );
}
