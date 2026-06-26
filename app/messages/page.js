import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/guards";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import Avatar from "@/components/Avatar";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const viewer = await getSessionUser();
  if (!viewer) redirect("/login");
  const me = viewer.id;

  const convos = await prisma.conversation.findMany({
    where: { OR: [{ aId: me }, { bId: me }] },
    orderBy: { updatedAt: "desc" },
    include: {
      a: { select: { id: true, name: true, image: true } },
      b: { select: { id: true, name: true, image: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <TopBar />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-5">
        <h1 className="mb-4 text-lg font-semibold">Messages</h1>
        {convos.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">
            No conversations yet. Open someone's profile and tap <b>Message</b>.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white">
            {convos.map((c) => {
              const other = c.aId === me ? c.b : c.a;
              const last = c.messages[0];
              return (
                <li key={c.id}>
                  <Link href={`/messages/${c.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
                    <Avatar name={other.name} image={other.image} size={48} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{other.name}</p>
                      <p className="truncate text-xs text-gray-500">{last ? last.body : "Say hi 👋"}</p>
                    </div>
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
