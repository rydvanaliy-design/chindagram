import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/guards";
import { blockedIdsFor } from "@/lib/privacy";
import { isConversationAdmin } from "@/lib/messages";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import AddMembersForm from "@/components/AddMembersForm";

export const dynamic = "force-dynamic";

export default async function AddMembersPage({ params }) {
  const viewer = await getSessionUser();
  if (!viewer) redirect("/login");
  const me = viewer.id;

  const convo = await prisma.conversation.findUnique({ where: { id: params.id }, select: { isGroup: true, members: { select: { userId: true } } } });
  if (!convo || !convo.isGroup) notFound();
  if (!(await isConversationAdmin(params.id, me))) redirect(`/messages/${params.id}`);

  const blockedIds = await blockedIdsFor(me);
  const existingIds = convo.members.map((m) => m.userId);
  const users = await prisma.user.findMany({
    where: { id: { notIn: [...existingIds, ...blockedIds] }, disabled: false },
    orderBy: { name: "asc" },
    select: { id: true, name: true, image: true },
  });

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <TopBar />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6">
        <h1 className="mb-4 text-lg font-semibold">Add people</h1>
        <AddMembersForm conversationId={params.id} users={users} spotsLeft={Math.max(0, 30 - existingIds.length)} />
      </main>
      <BottomNav />
    </div>
  );
}
