import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/guards";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import Avatar from "@/components/Avatar";
import FollowButton from "@/components/FollowButton";
import BioEditor from "@/components/BioEditor";
import LogoutButton from "@/components/LogoutButton";
import { Reel } from "@/components/icons";
import { RoleBadge, ClassBadge } from "@/components/Badge";
import { visibleToViewer } from "@/lib/posts";

export const dynamic = "force-dynamic";

export default async function ProfilePage({ params }) {
  const viewer = await getSessionUser();
  if (!viewer) redirect("/login");
  const me = viewer.id;

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      _count: { select: { followers: true, following: true } },
      posts: {
        where: visibleToViewer(me),
        orderBy: { createdAt: "desc" },
        select: {
          id: true, kind: true, status: true,
          media: { orderBy: { order: "asc" }, take: 1, select: { url: true, type: true } },
          _count: { select: { media: true } },
        },
      },
    },
  });
  if (!user) notFound();

  const isSelf = user.id === me;
  const amFollowing = isSelf ? false : Boolean(
    await prisma.follow.findUnique({ where: { followerId_followingId: { followerId: me, followingId: user.id } } })
  );

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <TopBar />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6">
        <header className="flex items-center gap-5">
          <Avatar name={user.name} image={user.image} size={84} />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold">{user.name}</h1>
              {isSelf ? (
                <div className="flex items-center gap-2">
                  <Link href="/settings" className="ig-btn-soft py-1.5">Edit profile</Link>
                  <LogoutButton />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <FollowButton targetId={user.id} initialFollowing={amFollowing} />
                  <Link href={`/messages/start/${user.id}`} className="ig-btn-soft py-1.5">Message</Link>
                </div>
              )}
            </div>
            {(user.role !== "STUDENT" || user.gradeClass) && (
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <RoleBadge role={user.role} />
                <ClassBadge gradeClass={user.gradeClass} />
              </div>
            )}
            <div className="mt-2 flex gap-6 text-sm">
              <span><b>{user.posts.length}</b> {user.posts.length === 1 ? "post" : "posts"}</span>
              <span><b>{user._count.followers}</b> followers</span>
              <span><b>{user._count.following}</b> following</span>
            </div>
          </div>
        </header>

        <section className="mt-4">
          {isSelf ? <BioEditor initialBio={user.bio} /> : (
            <p className="whitespace-pre-wrap text-sm text-gray-700">{user.bio || <span className="text-gray-400">No bio yet.</span>}</p>
          )}
        </section>

        <section className="mt-6">
          {user.posts.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-400">No posts yet.</p>
          ) : (
            <div className="grid grid-cols-3 gap-1 sm:gap-2">
              {user.posts.map((p) => {
                const thumb = p.media[0];
                const isVideo = p.kind === "REEL" || thumb?.type === "VIDEO";
                return (
                  <div key={p.id} className="relative aspect-square overflow-hidden rounded-md bg-gray-100">
                    {isVideo ? (
                      <video src={thumb?.url} className="h-full w-full object-cover" muted />
                    ) : (
                      <img src={thumb?.url} alt="" className="h-full w-full object-cover" />
                    )}
                    {p.status === "PENDING" && (
                      <span className="absolute inset-x-0 bottom-0 bg-amber-500/90 px-1 py-0.5 text-center text-[10px] font-bold text-white">Pending review</span>
                    )}
                    {isVideo && <span className="absolute right-1 top-1 text-white drop-shadow"><Reel /></span>}
                    {!isVideo && p._count.media > 1 && (
                      <span className="absolute right-1 top-1 rounded bg-black/50 px-1 text-[10px] font-bold text-white">{p._count.media}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
