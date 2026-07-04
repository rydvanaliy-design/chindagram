import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { isClubMember } from "@/lib/clubs";
import SettingsHeader from "@/components/settings/SettingsHeader";
import StoryComposer from "@/components/StoryComposer";
import { getLocale } from "@/lib/i18n/getLocale";
import { makeT } from "@/lib/i18n/t";

export const dynamic = "force-dynamic";

export default async function NewStoryPage({ searchParams }) {
  const viewer = await getSessionUser();
  if (!viewer) redirect("/login");

  const locale = await getLocale();
  const t = makeT(locale);

  let club = null;
  const clubId = searchParams?.clubId || null;
  if (clubId) {
    if (!(await isClubMember(clubId, viewer.id))) redirect("/clubs");
    club = await prisma.club.findUnique({ where: { id: clubId }, select: { id: true, name: true } });
    if (!club) redirect("/clubs");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SettingsHeader title={t("discovery.stories.newTitle")} back={club ? `/clubs/${club.id}` : "/"} />
      <main className="mx-auto w-full max-w-xl px-4 py-6">
        <StoryComposer club={club} />
      </main>
    </div>
  );
}
