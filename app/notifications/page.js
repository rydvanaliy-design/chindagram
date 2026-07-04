import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/guards";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import Avatar from "@/components/Avatar";

export const dynamic = "force-dynamic";

const TEXT = {
  LIKE: "reacted to your post", COMMENT: "commented on your post", FOLLOW: "started following you",
  MESSAGE: "sent you a message", MENTION: "mentioned you in a post", COLLAB: "invited you to co-author a post",
  FOLLOW_REQUEST: "asked to follow you", FOLLOW_ACCEPT: "approved your follow request",
  FRIEND_REQUEST: "wants to be friends", FRIEND_ACCEPT: "accepted your friend request",
  COMMENT_REPLY: "replied to your comment", COMMENT_LIKE: "liked your comment",
  CLUB_JOIN_REQUEST: "asked to join your club", CLUB_REQUEST_ACCEPTED: "accepted your club request",
  CLUB_ROLE_CHANGED: "made you a club admin", EVENT_CREATED: "created a new event",
  CLUB_ANNOUNCEMENT: "posted an announcement in your club",
  GROUP_ADDED: "added you to a group",
  BROADCAST: "posted a school-wide announcement",
};
function linkFor(n) {
  if (n.type === "FOLLOW_REQUEST" || n.type === "FRIEND_REQUEST") return "/requests";
  if (["FOLLOW", "FOLLOW_ACCEPT", "FRIEND_ACCEPT"].includes(n.type)) return `/u/${n.actor.id}`;
  if (n.type === "MESSAGE" || n.type === "GROUP_ADDED") return "/messages";
  if (["CLUB_JOIN_REQUEST", "CLUB_REQUEST_ACCEPTED", "CLUB_ROLE_CHANGED"].includes(n.type)) return n.clubId ? `/clubs/${n.clubId}` : "/clubs";
  if (n.type === "EVENT_CREATED") return n.eventId ? `/events/${n.eventId}` : "/events";
  return n.postId ? `/p/${n.postId}` : "/";
}
function ago(d) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60); if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default async function NotificationsPage() {
  const viewer = await getSessionUser();
  if (!viewer) redirect("/login");
  const me = viewer.id;

  const notifs = await prisma.notification.findMany({
    where: { recipientId: me },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { actor: { select: { id: true, name: true, image: true } } },
  });
  await prisma.notification.updateMany({ where: { recipientId: me, read: false }, data: { read: true } });

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <TopBar />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-4">
        <h1 className="mb-3 text-lg font-semibold">Notifications</h1>
        {notifs.length === 0 ? (
          <p className="py-16 text-center text-sm text-gray-400">Nothing yet. Likes, comments, follows and messages show up here.</p>
        ) : (
          <ul className="divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white">
            {notifs.map((n) => (
              <li key={n.id} className={n.read ? "" : "bg-brand/5"}>
                <Link href={linkFor(n)} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                  <Avatar name={n.actor.name} image={n.actor.image} size={40} />
                  <p className="flex-1 text-sm">
                    <span className="font-semibold">{n.actor.name}</span> {TEXT[n.type] || "did something"}
                  </p>
                  <span className="text-xs text-gray-400">{ago(n.createdAt)}</span>
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
