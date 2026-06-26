import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/guards";

export const dynamic = "force-dynamic";

export default async function StartChat({ params }) {
  const viewer = await getSessionUser();
  if (!viewer) redirect("/login");
  const me = viewer.id;
  const other = params.userId;
  if (other === me) redirect("/messages");

  const target = await prisma.user.findUnique({ where: { id: other }, select: { id: true } });
  if (!target) redirect("/messages");

  const [aId, bId] = [me, other].sort();
  const convo = await prisma.conversation.upsert({
    where: { aId_bId: { aId, bId } },
    update: {},
    create: { aId, bId },
  });
  redirect(`/messages/${convo.id}`);
}
