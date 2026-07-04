import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/guards";
import { conversationDisplay } from "@/lib/messages";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import Avatar from "@/components/Avatar";
import { getLocale } from "@/lib/i18n/getLocale";
import { makeT } from "@/lib/i18n/t";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const locale = await getLocale();
  const t = makeT(locale);
  const MEDIA_LABEL = { IMAGE: t("messages.media.photo"), VIDEO: t("messages.media.video"), VOICE: t("messages.media.voice") };
  const viewer = await getSessionUser();
  if (!viewer) redirect("/login");
  const me = viewer.id;

  const memberships = await prisma.conversationMember.findMany({ where: { userId: me }, select: { conversationId: true, lastReadAt: true } });
  const lastReadMap = new Map(memberships.map((m) => [m.conversationId, m.lastReadAt]));
  const convoIds = memberships.map((m) => m.conversationId);

  const convos = convoIds.length ? await prisma.conversation.findMany({
    where: { id: { in: convoIds } },
    orderBy: { updatedAt: "desc" },
    include: {
      members: { include: { user: { select: { id: true, name: true, image: true } } } },
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { senderId: true, body: true, removed: true, mediaType: true, createdAt: true } },
    },
  }) : [];

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <TopBar />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-5">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold">{t("messages.list.title")}</h1>
          <Link href="/messages/new" className="ig-btn-soft py-1.5">{t("messages.list.newGroup")}</Link>
        </div>
        {convos.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">
            {t("messages.list.empty").split("{messageAction}").flatMap((part, i, arr) =>
              i < arr.length - 1 ? [part, <b key={i}>{t("messages.list.messageAction")}</b>] : [part]
            )}
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white">
            {convos.map((c) => {
              const display = conversationDisplay(c, me);
              const last = c.messages[0];
              const lastReadAt = lastReadMap.get(c.id);
              const unread = Boolean(last && last.senderId !== me && (!lastReadAt || last.createdAt > lastReadAt));
              const preview = last ? (last.removed ? t("messages.list.messageRemoved") : last.body || MEDIA_LABEL[last.mediaType] || "") : t("messages.list.sayHi");
              return (
                <li key={c.id}>
                  <Link href={`/messages/${c.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                    <Avatar name={display.name} image={display.image} size={48} />
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm ${unread ? "font-bold" : "font-semibold"}`}>
                        {display.name}{display.isGroup && <span className="ml-1 font-normal text-gray-400">· {display.memberCount}</span>}
                      </p>
                      <p className={`truncate text-xs ${unread ? "font-semibold text-gray-800" : "text-gray-500"}`}>{preview}</p>
                    </div>
                    {unread && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-brand" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
