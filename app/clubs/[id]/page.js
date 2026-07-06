import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/guards";
import { isClubAdmin } from "@/lib/clubs";
import { visibleToViewer, postInclude, toPostProps } from "@/lib/posts";
import { getLocale } from "@/lib/i18n/getLocale";
import { makeT } from "@/lib/i18n/t";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import Composer from "@/components/Composer";
import PostCard from "@/components/PostCard";
import ClubJoinButton from "@/components/ClubJoinButton";
import ClubRequestRow from "@/components/ClubRequestRow";
import ClubMemberRow from "@/components/ClubMemberRow";
import StoriesBar from "@/components/StoriesBar";

export const dynamic = "force-dynamic";

export default async function ClubPage({ params, searchParams }) {
  const viewer = await getSessionUser();
  if (!viewer) redirect("/login");
  const me = viewer.id;
  const locale = await getLocale();
  const t = makeT(locale);

  const club = await prisma.club.findUnique({
    where: { id: params.id },
    include: {
      createdBy: { select: { name: true } },
      members: {
        where: { status: "ACCEPTED" },
        orderBy: [{ role: "asc" }, { joinedAt: "asc" }], // "ADMIN" sorts before "MEMBER"
        include: { user: { select: { id: true, name: true, image: true, role: true } } },
      },
    },
  });
  if (!club) notFound();

  const myMembership = await prisma.clubMember.findUnique({ where: { clubId_userId: { clubId: club.id, userId: me } } });
  const iAmMember = myMembership?.status === "ACCEPTED";
  const iAmAdmin = await isClubAdmin(club.id, me, viewer.role);

  const pendingRequests = iAmAdmin ? await prisma.clubMember.findMany({
    where: { clubId: club.id, status: "PENDING" },
    orderBy: { joinedAt: "asc" },
    include: { user: { select: { id: true, name: true, image: true } } },
  }) : [];

  // The club's own feed — moderation rules still apply, but membership
  // (not the author's personal account privacy) is what gates visibility here.
  const filesOnly = searchParams?.filter === "files";
  const postRows = await prisma.post.findMany({
    where: { AND: [visibleToViewer(me), { clubId: club.id, ...(filesOnly ? { kind: "DOCUMENT" } : {}) }] },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    take: 60,
    include: postInclude(me),
  });
  const posts = postRows.map((p) => toPostProps(p, me));

  const upcomingEvents = await prisma.event.findMany({
    where: { clubId: club.id, startAt: { gte: new Date() } },
    orderBy: { startAt: "asc" },
    take: 5,
  });

  const meUser = await prisma.user.findUnique({ where: { id: me }, select: { id: true, name: true, image: true } });
  const clubStoryRows = await prisma.story.findMany({
    where: { clubId: club.id, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "asc" },
    include: { author: { select: { id: true, name: true, image: true } } },
  });
  const clubStoryMap = new Map();
  for (const s of clubStoryRows) {
    if (!clubStoryMap.has(s.authorId)) clubStoryMap.set(s.authorId, { author: s.author, stories: [] });
    clubStoryMap.get(s.authorId).stories.push({
      id: s.id, imageUrl: s.imageUrl, repostOf: null,
      stickerType: s.stickerType, stickerQuestion: s.stickerQuestion,
      stickerOptions: s.stickerOptions, stickerCorrectIndex: s.stickerCorrectIndex,
    });
  }
  const clubStoryGroups = [...clubStoryMap.values()];

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <TopBar />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6">
        <Link href="/clubs" className="mb-3 inline-block text-sm text-brand">{t("clubs.detail.backToAll")}</Link>
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-lg font-semibold">{club.name}</h1>
              {club.description && <p className="mt-1 text-sm text-gray-600">{club.description}</p>}
              <p className="mt-2 text-xs text-gray-400">
                {t(club.members.length === 1 ? "clubs.detail.startedByOne" : "clubs.detail.startedByOther", { name: club.createdBy.name, count: club.members.length })}
              </p>
            </div>
            <ClubJoinButton clubId={club.id} initialStatus={myMembership?.status || "NONE"} />
          </div>
        </div>

        {(clubStoryGroups.length > 0 || iAmMember) && (
          <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <StoriesBar groups={clubStoryGroups} me={meUser} newStoryHref={`/stories/new?clubId=${club.id}`} showAdd={iAmMember} />
          </div>
        )}

        {iAmAdmin && pendingRequests.length > 0 && (
          <>
            <h2 className="mb-3 mt-6 text-sm font-semibold uppercase tracking-wide text-gray-500">
              {t("clubs.detail.pendingRequests", { count: pendingRequests.length })}
            </h2>
            <ul className="divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white">
              {pendingRequests.map((r) => <ClubRequestRow key={r.id} clubId={club.id} user={r.user} />)}
            </ul>
          </>
        )}

        {upcomingEvents.length > 0 && (
          <>
            <h2 className="mb-3 mt-6 text-sm font-semibold uppercase tracking-wide text-gray-500">{t("clubs.detail.upcomingEvents")}</h2>
            <ul className="divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white">
              {upcomingEvents.map((e) => (
                <li key={e.id}>
                  <Link href={`/events/${e.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50">
                    <span className="truncate text-sm font-medium">{e.title}</span>
                    <span className="shrink-0 text-xs text-gray-400">{new Date(e.startAt).toLocaleDateString(locale === "th" ? "th-TH" : undefined, { month: "short", day: "numeric" })}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}

        {iAmMember && (
          <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-4">
            <Composer isStaff={false} clubId={club.id} />
          </div>
        )}

        <div className="mb-3 mt-6 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">{t("clubs.detail.clubFeed")}</h2>
          <div className="flex gap-2 text-xs">
            <Link href={`/clubs/${club.id}`} className={`rounded-full border px-2.5 py-1 font-semibold ${!filesOnly ? "border-brand bg-brand text-white" : "border-gray-200 text-gray-600"}`}>{t("clubs.detail.filterAll")}</Link>
            <Link href={`/clubs/${club.id}?filter=files`} className={`rounded-full border px-2.5 py-1 font-semibold ${filesOnly ? "border-brand bg-brand text-white" : "border-gray-200 text-gray-600"}`}>{t("clubs.detail.filterFiles")}</Link>
          </div>
        </div>
        {posts.length === 0 ? (
          <p className="rounded-2xl border border-gray-200 bg-white px-4 py-10 text-center text-sm text-gray-400">
            {filesOnly ? t("clubs.detail.noFilesYet") : iAmMember ? t("clubs.detail.noPostsMember") : t("clubs.detail.noPostsGeneric")}
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} currentUserId={me} isAdmin={viewer.role === "ADMIN"} canManageClub={iAmAdmin} />
            ))}
          </div>
        )}

        <h2 className="mb-3 mt-8 text-sm font-semibold uppercase tracking-wide text-gray-500">
          {t("clubs.detail.membersHeading", { count: club.members.length })}
        </h2>
        {club.members.length === 0 ? (
          <p className="rounded-2xl border border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-400">{t("clubs.detail.noMembersYet")}</p>
        ) : (
          <ul className="divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white">
            {club.members.map((m) => (
              <ClubMemberRow
                key={m.id} clubId={club.id} member={m} iAmAdmin={iAmAdmin}
                isCreator={m.user.id === club.createdById} currentUserId={me}
              />
            ))}
          </ul>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
