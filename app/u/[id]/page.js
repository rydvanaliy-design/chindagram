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
import Wall from "@/components/Wall";
import { visibleToViewer } from "@/lib/posts";
import { themeOf } from "@/lib/themes";
import { canModerateContent } from "@/lib/roles";

function joinedLabel(d) {
  return new Date(d).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export const dynamic = "force-dynamic";

export default async function ProfilePage({ params }) {
  const viewer = await getSessionUser();
  if (!viewer) redirect("/login");
  const me = viewer.id;

  // Accept either a user id or a @username in the URL.
  const user = await prisma.user.findFirst({
    where: { OR: [{ id: params.id }, { username: params.id.toLowerCase() }] },
    include: { _count: { select: { followers: true, following: true } } },
  });
  if (!user) notFound();

  // Posts the user authored OR co-authored (accepted), respecting visibility.
  const posts = await prisma.post.findMany({
    where: {
      removed: false,
      AND: [
        { OR: [{ status: "VISIBLE" }, { authorId: me }] },
        { OR: [{ authorId: user.id }, { collaborators: { some: { userId: user.id, accepted: true } } }] },
      ],
    },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    take: 60,
    select: {
      id: true, kind: true, status: true, pinned: true, caption: true, category: true,
      media: { orderBy: { order: "asc" }, take: 1, select: { url: true, type: true, name: true } },
      _count: { select: { media: true } },
    },
  });

  const isSelf = user.id === me;
  const amFollowing = isSelf ? false : Boolean(
    await prisma.follow.findUnique({ where: { followerId_followingId: { followerId: me, followingId: user.id } } })
  );

  // Visible wall posts (plus the viewer's own held ones).
  const wallRows = await prisma.wallPost.findMany({
    where: { ownerId: user.id, removed: false, OR: [{ status: "VISIBLE" }, { authorId: me }] },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: { author: { select: { id: true, name: true, image: true } } },
  });
  const wallPosts = wallRows.map((w) => ({
    id: w.id, body: w.body, createdAt: w.createdAt.toISOString(),
    author: w.author, mine: w.authorId === me, pending: w.status === "PENDING",
  }));
  const canModerate = canModerateContent(viewer.role);

  const theme = themeOf(user.theme);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <TopBar />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6">
        <div className={`mb-4 h-16 rounded-2xl bg-gradient-to-r ${theme.band}`} />
        <header className="flex items-center gap-5">
          <Avatar name={user.name} image={user.image} size={84} />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold">{user.name}</h1>
              {user.pronouns && <span className="text-sm text-gray-400">{user.pronouns}</span>}
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
            {user.username && <p className="text-sm text-gray-400">@{user.username}</p>}
            {(user.role !== "STUDENT" || user.gradeClass) && (
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <RoleBadge role={user.role} />
                <ClassBadge gradeClass={user.gradeClass} />
              </div>
            )}
            <div className="mt-2 flex gap-6 text-sm">
              <span><b>{posts.length}</b> {posts.length === 1 ? "post" : "posts"}</span>
              <span><b>{user._count.followers}</b> followers</span>
              <span><b>{user._count.following}</b> following</span>
            </div>
          </div>
        </header>

        <section className="mt-4">
          {isSelf ? <BioEditor initialBio={user.bio} /> : (
            <p className="whitespace-pre-wrap text-sm text-gray-700">{user.bio || <span className="text-gray-400">No bio yet.</span>}</p>
          )}

          {user.interests && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {user.interests.split(",").map((t) => t.trim()).filter(Boolean).map((t, i) => (
                <span key={i} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">{t}</span>
              ))}
            </div>
          )}

          {user.links && (
            <ul className="mt-3 space-y-0.5">
              {user.links.split("\n").map((l) => l.trim()).filter(Boolean).map((l, i) => {
                const href = /^https?:\/\//.test(l) ? l : `https://${l}`;
                return (
                  <li key={i}>
                    <a href={href} target="_blank" rel="noreferrer noopener" className="text-sm text-brand hover:underline break-all">{l}</a>
                  </li>
                );
              })}
            </ul>
          )}

          <p className="mt-3 text-xs text-gray-400">Joined {joinedLabel(user.createdAt)}</p>
        </section>

        <section className="mt-6">
          {posts.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-400">No posts yet.</p>
          ) : (
            <div className="grid grid-cols-3 gap-1 sm:gap-2">
              {posts.map((p) => {
                const thumb = p.media[0];
                const isPhotoVideo = thumb && (thumb.type === "IMAGE" || thumb.type === "VIDEO");
                const isVideo = p.kind === "REEL" || thumb?.type === "VIDEO";
                const tileLabel = { LINK: "Link", POLL: "Poll", AUDIO: "Audio", DOCUMENT: "File" }[p.kind] || "Text";
                return (
                  <Link key={p.id} href={`/p/${p.id}`} className="relative aspect-square overflow-hidden rounded-md bg-gray-100">
                    {isPhotoVideo ? (
                      isVideo
                        ? <video src={thumb.url} className="h-full w-full object-cover" muted />
                        : <img src={thumb.url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      // Text / link / poll / audio / file posts have no image — show a text tile.
                      <div className="flex h-full w-full flex-col justify-between bg-gradient-to-br from-gray-50 to-gray-100 p-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{tileLabel}</span>
                        <span className="line-clamp-3 text-[11px] text-gray-600">{p.caption || (thumb?.name || "")}</span>
                      </div>
                    )}
                    {p.pinned && <span className="absolute left-1 top-1 text-xs drop-shadow">📌</span>}
                    {p.status === "PENDING" && (
                      <span className="absolute inset-x-0 bottom-0 bg-amber-500/90 px-1 py-0.5 text-center text-[10px] font-bold text-white">Pending review</span>
                    )}
                    {isVideo && <span className="absolute right-1 top-1 text-white drop-shadow"><Reel /></span>}
                    {isPhotoVideo && !isVideo && p._count.media > 1 && (
                      <span className="absolute right-1 top-1 rounded bg-black/50 px-1 text-[10px] font-bold text-white">{p._count.media}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Wall</h2>
          <Wall
            ownerId={user.id}
            ownerName={user.name}
            viewerId={me}
            isOwner={isSelf}
            canModerate={canModerate}
            initial={wallPosts}
          />
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
