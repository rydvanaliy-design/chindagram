import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/guards";
import { isAdmin } from "@/lib/roles";
import { getLocale } from "@/lib/i18n/getLocale";
import { makeT } from "@/lib/i18n/t";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import Avatar from "@/components/Avatar";
import EventRSVPButtons from "@/components/EventRSVPButtons";
import CancelEventButton from "@/components/CancelEventButton";

export const dynamic = "force-dynamic";

function formatWhen(startAt, endAt, locale) {
  const lang = locale === "th" ? "th-TH" : undefined;
  const opts = { weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" };
  const start = new Date(startAt).toLocaleString(lang, opts);
  if (!endAt) return start;
  const end = new Date(endAt).toLocaleString(lang, { hour: "numeric", minute: "2-digit" });
  return `${start} – ${end}`;
}

export default async function EventPage({ params }) {
  const viewer = await getSessionUser();
  if (!viewer) redirect("/login");
  const me = viewer.id;
  const locale = await getLocale();
  const t = makeT(locale);

  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: {
      club: { select: { id: true, name: true } },
      createdBy: { select: { id: true, name: true } },
      rsvps: { include: { user: { select: { id: true, name: true, image: true } } } },
    },
  });
  if (!event) notFound();

  const myRsvp = event.rsvps.find((r) => r.userId === me);
  const going = event.rsvps.filter((r) => r.status === "GOING");
  const interested = event.rsvps.filter((r) => r.status === "INTERESTED");
  const canCancel = event.createdById === me || isAdmin(viewer.role);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <TopBar />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6">
        <Link href="/events" className="mb-3 inline-block text-sm text-brand">{t("events.detail.backToAll")}</Link>
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <h1 className="text-lg font-semibold">{event.title}</h1>
          <p className="mt-1 text-sm text-gray-700">{formatWhen(event.startAt, event.endAt, locale)}</p>
          {event.location && <p className="mt-1 text-sm text-gray-500">{t("events.detail.location", { location: event.location })}</p>}
          {event.description && <p className="mt-3 whitespace-pre-wrap text-sm text-gray-700">{event.description}</p>}
          <p className="mt-3 text-xs text-gray-400">
            {t("events.detail.createdBy", { name: event.createdBy.name })}
            {event.club && <> · <Link href={`/clubs/${event.club.id}`} className="text-brand hover:underline">{event.club.name}</Link></>}
            {event.gradeClass && <> · {event.gradeClass}</>}
          </p>

          <div className="mt-4 flex items-center justify-between gap-3">
            <EventRSVPButtons eventId={event.id} initialStatus={myRsvp?.status || null} />
            {canCancel && <CancelEventButton eventId={event.id} />}
          </div>
        </div>

        <h2 className="mb-3 mt-6 text-sm font-semibold uppercase tracking-wide text-gray-500">{t("events.detail.goingHeading", { count: going.length })}</h2>
        {going.length === 0 ? (
          <p className="rounded-2xl border border-gray-200 bg-white px-4 py-6 text-center text-sm text-gray-400">{t("events.detail.noOneYet")}</p>
        ) : (
          <ul className="divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white">
            {going.map((r) => (
              <li key={r.id}>
                <Link href={`/u/${r.user.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                  <Avatar name={r.user.name} image={r.user.image} size={36} />
                  <span className="text-sm font-medium">{r.user.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {interested.length > 0 && (
          <>
            <h2 className="mb-3 mt-6 text-sm font-semibold uppercase tracking-wide text-gray-500">{t("events.detail.interestedHeading", { count: interested.length })}</h2>
            <ul className="divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white">
              {interested.map((r) => (
                <li key={r.id}>
                  <Link href={`/u/${r.user.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                    <Avatar name={r.user.name} image={r.user.image} size={36} />
                    <span className="text-sm font-medium">{r.user.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
