import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/guards";
import { getPostList } from "@/lib/posts";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import PostCard from "@/components/PostCard";
import SavedFolderTabs from "@/components/SavedFolderTabs";
import SavedFolderActions from "@/components/SavedFolderActions";
import { getLocale } from "@/lib/i18n/getLocale";
import { makeT } from "@/lib/i18n/t";

export const dynamic = "force-dynamic";

export default async function SavedPage({ searchParams }) {
  const viewer = await getSessionUser();
  if (!viewer) redirect("/login");
  const locale = await getLocale();
  const t = makeT(locale);
  const me = viewer.id;

  const collections = await prisma.saveCollection.findMany({
    where: { ownerId: me },
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { saves: true } } },
  });

  const activeParam = searchParams?.collection;
  const activeCollection = activeParam && activeParam !== "none" ? collections.find((c) => c.id === activeParam) : null;
  // An unknown/deleted collection id falls back to "All Saved".
  const active = activeParam === "none" ? "none" : activeCollection ? activeCollection.id : "all";

  const allSaves = await prisma.save.findMany({ where: { userId: me }, select: { postId: true, collectionId: true } });
  const allCount = allSaves.length;
  const noneCount = allSaves.filter((s) => s.collectionId === null).length;

  const ids = active === "all"
    ? allSaves.map((s) => s.postId)
    : active === "none"
      ? allSaves.filter((s) => s.collectionId === null).map((s) => s.postId)
      : allSaves.filter((s) => s.collectionId === active).map((s) => s.postId);

  const posts = ids.length ? await getPostList({ id: { in: ids } }, me, 60) : [];
  const emptyLabel = active === "all" ? t("saved.empty.all")
    : active === "none" ? t("saved.empty.noFolder")
    : t("saved.empty.folder", { name: activeCollection?.name });

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <TopBar />
      <main className="mx-auto w-full max-w-xl flex-1 py-4">
        <h1 className="px-4 pb-2 text-lg font-semibold">{t("saved.title")}</h1>
        <SavedFolderTabs collections={collections.map((c) => ({ id: c.id, name: c.name, count: c._count.saves }))} active={active} allCount={allCount} noneCount={noneCount} />
        <SavedFolderActions activeCollection={activeCollection ? { id: activeCollection.id, name: activeCollection.name } : null} />
        {posts.length === 0 ? (
          <p className="px-6 py-16 text-center text-sm text-gray-400">{emptyLabel}</p>
        ) : (
          <div className="flex flex-col gap-4">
            {posts.map((post) => <PostCard key={post.id} post={post} currentUserId={me} isAdmin={viewer.role === "ADMIN"} />)}
          </div>
        )}
        <div className="px-4 pt-2 text-center"><Link href="/" className="text-sm text-brand">{t("saved.backToFeed")}</Link></div>
      </main>
      <BottomNav />
    </div>
  );
}
