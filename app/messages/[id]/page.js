import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/guards";
import { messageInclude, toMessageProps, conversationDisplay } from "@/lib/messages";
import ChatThread from "@/components/ChatThread";

export const dynamic = "force-dynamic";

export default async function ThreadPage({ params }) {
  const viewer = await getSessionUser();
  if (!viewer) redirect("/login");
  const me = viewer.id;

  const convo = await prisma.conversation.findUnique({
    where: { id: params.id },
    include: { members: { include: { user: { select: { id: true, name: true, image: true } } } } },
  });
  if (!convo) notFound();
  const myMembership = convo.members.find((m) => m.userId === me);
  if (!myMembership) notFound();

  const rows = await prisma.message.findMany({ where: { conversationId: convo.id }, orderBy: { createdAt: "asc" }, take: 100, include: messageInclude });
  const initial = rows.map((m) => toMessageProps(m, me));

  await prisma.conversationMember.update({ where: { id: myMembership.id }, data: { lastReadAt: new Date() } });

  const display = conversationDisplay(convo, me);
  const members = convo.members.map((m) => ({ id: m.user.id, name: m.user.name, image: m.user.image, role: m.role }));

  return (
    <ChatThread
      conversationId={convo.id} me={me} initial={initial} isAdmin={viewer.role === "ADMIN"}
      isGroup={convo.isGroup} name={display.name} image={display.image} otherId={display.otherId || null}
      members={members} createdById={convo.createdById} iAmGroupAdmin={myMembership.role === "ADMIN"}
    />
  );
}
