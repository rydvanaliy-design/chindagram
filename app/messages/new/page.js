import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/guards";
import { blockedIdsFor } from "@/lib/privacy";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import NewGroupForm from "@/components/NewGroupForm";

export const dynamic = "force-dynamic";

export default async function NewGroupPage() {
  const viewer = await getSessionUser();
  if (!viewer) redirect("/login");
  const me = viewer.id;

  const blockedIds = await blockedIdsFor(me);
  const users = await prisma.user.findMany({
    where: { id: { notIn: [me, ...blockedIds] }, disabled: false },
    orderBy: { name: "asc" },
    select: { id: true, name: true, image: true },
  });

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <TopBar />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6">
        <h1 className="mb-4 text-lg font-semibold">New group</h1>
        <NewGroupForm users={users} />
      </main>
      <BottomNav />
    </div>
  );
}
