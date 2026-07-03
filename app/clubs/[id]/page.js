import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/guards";
import { isClubAdmin } from "@/lib/clubs";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import ClubJoinButton from "@/components/ClubJoinButton";
import ClubRequestRow from "@/components/ClubRequestRow";
import ClubMemberRow from "@/components/ClubMemberRow";

export const dynamic = "force-dynamic";

export default async function ClubPage({ params }) {
  const viewer = await getSessionUser();
  if (!viewer) redirect("/login");
  const me = viewer.id;

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
  const iAmAdmin = await isClubAdmin(club.id, me, viewer.role);

  const pendingRequests = iAmAdmin ? await prisma.clubMember.findMany({
    where: { clubId: club.id, status: "PENDING" },
    orderBy: { joinedAt: "asc" },
    include: { user: { select: { id: true, name: true, image: true } } },
  }) : [];

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <TopBar />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6">
        <Link href="/clubs" className="mb-3 inline-block text-sm text-brand">← All clubs</Link>
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-lg font-semibold">{club.name}</h1>
              {club.description && <p className="mt-1 text-sm text-gray-600">{club.description}</p>}
              <p className="mt-2 text-xs text-gray-400">Started by {club.createdBy.name}</p>
            </div>
            <ClubJoinButton clubId={club.id} initialStatus={myMembership?.status || "NONE"} />
          </div>
        </div>

        {iAmAdmin && pendingRequests.length > 0 && (
          <>
            <h2 className="mb-3 mt-6 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Pending requests ({pendingRequests.length})
            </h2>
            <ul className="divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white">
              {pendingRequests.map((r) => <ClubRequestRow key={r.id} clubId={club.id} user={r.user} />)}
            </ul>
          </>
        )}

        <h2 className="mb-3 mt-6 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Members ({club.members.length})
        </h2>
        {club.members.length === 0 ? (
          <p className="rounded-2xl border border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-400">No members yet.</p>
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
