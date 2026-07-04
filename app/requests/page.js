import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/guards";
import { getLocale } from "@/lib/i18n/getLocale";
import { makeT } from "@/lib/i18n/t";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import FollowRequestRow from "@/components/FollowRequestRow";
import FriendRequestRow from "@/components/FriendRequestRow";

export const dynamic = "force-dynamic";

export default async function RequestsPage() {
  const viewer = await getSessionUser();
  if (!viewer) redirect("/login");
  const locale = await getLocale();
  const t = makeT(locale);

  const followRequests = await prisma.follow.findMany({
    where: { followingId: viewer.id, status: "PENDING" },
    orderBy: { createdAt: "desc" },
    include: { follower: { select: { id: true, name: true, username: true, image: true } } },
  });

  const friendRequests = await prisma.friendship.findMany({
    where: { addresseeId: viewer.id, status: "PENDING" },
    orderBy: { createdAt: "desc" },
    include: { requester: { select: { id: true, name: true, username: true, image: true } } },
  });

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <TopBar />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6">
        <h1 className="mb-4 text-lg font-semibold">{t("notifications.requests.title")}</h1>

        <section className="mb-6">
          <h2 className="mb-1 text-sm font-semibold text-gray-700">{t("notifications.requests.follow.heading")}</h2>
          <p className="mb-3 text-xs text-gray-500">{t("notifications.requests.follow.intro")}</p>
          {followRequests.length === 0 ? (
            <p className="rounded-2xl border border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-400">{t("notifications.requests.follow.empty")}</p>
          ) : (
            <ul className="divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white">
              {followRequests.map((r) => <FollowRequestRow key={r.id} requestId={r.id} user={r.follower} />)}
            </ul>
          )}
        </section>

        <section>
          <h2 className="mb-1 text-sm font-semibold text-gray-700">{t("notifications.requests.friend.heading")}</h2>
          <p className="mb-3 text-xs text-gray-500">{t("notifications.requests.friend.intro")}</p>
          {friendRequests.length === 0 ? (
            <p className="rounded-2xl border border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-400">{t("notifications.requests.friend.empty")}</p>
          ) : (
            <ul className="divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white">
              {friendRequests.map((r) => <FriendRequestRow key={r.id} requestId={r.id} user={r.requester} />)}
            </ul>
          )}
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
