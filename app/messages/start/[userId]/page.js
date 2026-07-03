import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/guards";
import { isBlockedEitherWay } from "@/lib/privacy";
import { findOrCreate1to1 } from "@/lib/messages";

export const dynamic = "force-dynamic";

export default async function StartChat({ params }) {
  const viewer = await getSessionUser();
  if (!viewer) redirect("/login");
  const me = viewer.id;
  const other = params.userId;
  if (other === me) redirect("/messages");

  const target = await prisma.user.findUnique({ where: { id: other }, select: { id: true } });
  if (!target) redirect("/messages");

  if (await isBlockedEitherWay(me, other, viewer.role)) redirect("/messages");

  const convo = await findOrCreate1to1(me, other);
  redirect(`/messages/${convo.id}`);
}
