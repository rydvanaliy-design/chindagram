import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/guards";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import Avatar from "@/components/Avatar";
import ClubJoinButton from "@/components/ClubJoinButton";
import { RoleBadge } from "@/components/Badge";

export const dynamic = "force-dynamic";

export default async function ClubPage({ params }) {
  const viewer = await getSessionUser();
  if (!viewer) redirect("/login");
  const me = viewer.id;

  const club = await prisma.club.findUnique({
    where: { id: params.id },
    include: {
      createdBy: { select: { name: true } },
      members: { orderBy: { joinedAt: "asc" }, include: { user: { select: { id: true, name: true, image: true, role: true } } } },
    },
  });
  if (!club) notFound();

  const iAmMember = club.members.some((m) => m.userId === me);

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
            <ClubJoinButton clubId={club.id} initialJoined={iAmMember} />
          </div>
        </div>

        <h2 className="mb-3 mt-6 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Members ({club.members.length})
        </h2>
        {club.members.length === 0 ? (
          <p className="rounded-2xl border border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-400">No members yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white">
            {club.members.map((m) => (
              <li key={m.id}>
                <Link href={`/u/${m.user.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                  <Avatar name={m.user.name} image={m.user.image} size={40} />
                  <span className="flex-1 text-sm font-medium">{m.user.name}</span>
                  <RoleBadge role={m.user.role} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
