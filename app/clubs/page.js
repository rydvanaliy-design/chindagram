import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/guards";
import { canModerateContent } from "@/lib/roles";
import { getLocale } from "@/lib/i18n/getLocale";
import { makeT } from "@/lib/i18n/t";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import ClubJoinButton from "@/components/ClubJoinButton";

export const dynamic = "force-dynamic";

export default async function ClubsPage() {
  const viewer = await getSessionUser();
  if (!viewer) redirect("/login");
  const me = viewer.id;
  const locale = await getLocale();
  const t = makeT(locale);

  const clubs = await prisma.club.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { members: { where: { status: "ACCEPTED" } } } },
      members: { where: { userId: me }, select: { status: true } },
    },
  });

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <TopBar />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold">{t("clubs.page.title")}</h1>
          {canModerateContent(viewer.role) && (
            <Link href="/clubs/new" className="ig-btn-soft py-1.5">{t("clubs.page.newClub")}</Link>
          )}
        </div>
        {clubs.length === 0 ? (
          <p className="rounded-2xl border border-gray-200 bg-white px-4 py-10 text-center text-sm text-gray-400">
            {t("clubs.page.empty")}{canModerateContent(viewer.role) ? ` ${t("clubs.page.emptyCreatePrompt")}` : ""}
          </p>
        ) : (
          <ul className="space-y-2">
            {clubs.map((c) => (
              <li key={c.id} className="rounded-2xl border border-gray-200 bg-white p-4">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <Link href={`/clubs/${c.id}`} className="font-semibold hover:underline">{c.name}</Link>
                    {c.description && <p className="mt-0.5 line-clamp-2 text-sm text-gray-500">{c.description}</p>}
                    <p className="mt-1 text-xs text-gray-400">
                      {t(c._count.members === 1 ? "clubs.page.memberCountOne" : "clubs.page.memberCountOther", { count: c._count.members })}
                    </p>
                  </div>
                  <ClubJoinButton clubId={c.id} initialStatus={c.members[0]?.status || "NONE"} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
