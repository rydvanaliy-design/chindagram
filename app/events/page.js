import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/guards";
import { canModerateContent } from "@/lib/roles";
import { myClubIds } from "@/lib/groups";
import { getLocale } from "@/lib/i18n/getLocale";
import { makeT } from "@/lib/i18n/t";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import EventRSVPButtons from "@/components/EventRSVPButtons";

export const dynamic = "force-dynamic";

function formatWhen(startAt, endAt) {
  const opts = { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" };
  const start = new Date(startAt).toLocaleString(undefined, opts);
  if (!endAt) return start;
  const end = new Date(endAt).toLocaleString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${start} – ${end}`;
}

export default async function EventsPage({ searchParams }) {
  const viewer = await getSessionUser();
  if (!viewer) redirect("/login");
  const me = viewer.id;
  const isStaff = canModerateContent(viewer.role);
  const locale = await getLocale();
  const t = makeT(locale);

  const meUser = await prisma.user.findUnique({ where: { id: me }, select: { gradeClass: true } });
  const filter = ["myclubs", "myclass"].includes(searchParams?.filter) ? searchParams.filter : "all";

  let where = { startAt: { gte: new Date() } };
  let noneReason = null;
  if (filter === "myclubs") {
    const clubIds = await myClubIds(me);
    if (clubIds.length === 0) noneReason = t("events.page.noClubsJoined");
    else where = { ...where, clubId: { in: clubIds } };
  } else if (filter === "myclass") {
    if (!meUser.gradeClass) noneReason = t("events.page.noClassSet");
    else where = { ...where, gradeClass: meUser.gradeClass };
  }

  const events = noneReason ? [] : await prisma.event.findMany({
    where,
    orderBy: { startAt: "asc" },
    take: 60,
    include: {
      club: { select: { id: true, name: true } },
      createdBy: { select: { name: true } },
      rsvps: { where: { userId: me }, select: { status: true } },
      _count: { select: { rsvps: { where: { status: "GOING" } } } },
    },
  });

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <TopBar />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold">{t("events.page.title")}</h1>
          {isStaff && <Link href="/events/new" className="ig-btn-soft py-1.5">{t("events.page.newEvent")}</Link>}
        </div>

        <nav className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
          {[{ key: "all", label: t("events.page.filterAll") }, { key: "myclubs", label: t("events.page.filterMyClubs") }, { key: "myclass", label: t("events.page.filterMyClass") }].map((tab) => (
            <Link
              key={tab.key} href={tab.key === "all" ? "/events" : `/events?filter=${tab.key}`}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold ${filter === tab.key ? "border-brand bg-brand text-white" : "border-gray-200 text-gray-600"}`}
            >
              {tab.label}
            </Link>
          ))}
        </nav>

        {noneReason ? (
          <p className="rounded-2xl border border-gray-200 bg-white px-4 py-10 text-center text-sm text-gray-400">{noneReason}</p>
        ) : events.length === 0 ? (
          <p className="rounded-2xl border border-gray-200 bg-white px-4 py-10 text-center text-sm text-gray-400">{t("events.page.noUpcoming")}</p>
        ) : (
          <ul className="space-y-3">
            {events.map((e) => (
              <li key={e.id} className="rounded-2xl border border-gray-200 bg-white p-4">
                <Link href={`/events/${e.id}`} className="block">
                  <p className="font-semibold hover:underline">{e.title}</p>
                  <p className="mt-0.5 text-sm text-gray-600">{formatWhen(e.startAt, e.endAt)}</p>
                  {e.location && <p className="mt-0.5 text-xs text-gray-400">{t("events.page.location", { location: e.location })}</p>}
                  <p className="mt-1 text-xs text-gray-400">
                    {e.club ? `${e.club.name} · ` : e.gradeClass ? `${e.gradeClass} · ` : ""}
                    {t("events.page.goingCount", { count: e._count.rsvps })}
                  </p>
                </Link>
                <div className="mt-3">
                  <EventRSVPButtons eventId={e.id} initialStatus={e.rsvps[0]?.status || null} />
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
