import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/guards";
import ChatThread from "@/components/ChatThread";

export const dynamic = "force-dynamic";

export default async function ThreadPage({ params }) {
  const viewer = await getSessionUser();
  if (!viewer) redirect("/login");
  const me = viewer.id;

  const convo = await prisma.conversation.findUnique({
    where: { id: params.id },
    include: { a: { select: { id: true, name: true, image: true } }, b: { select: { id: true, name: true, image: true } } },
  });
  if (!convo || (convo.aId !== me && convo.bId !== me)) notFound();
  const other = convo.aId === me ? convo.b : convo.a;

  const rows = await prisma.message.findMany({ where: { conversationId: convo.id }, orderBy: { createdAt: "asc" }, take: 100 });
  const initial = rows.map((m) => ({ id: m.id, body: m.removed ? null : m.body, removed: m.removed, senderId: m.senderId, createdAt: m.createdAt.toISOString() }));

  return <ChatThread conversationId={convo.id} me={me} other={other} initial={initial} isAdmin={viewer.role === "ADMIN"} />;
}
