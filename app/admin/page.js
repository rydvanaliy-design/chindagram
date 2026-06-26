import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { RemovePostBtn, RemoveCommentBtn, RemoveMessageBtn, DisableUserBtn } from "@/components/AdminActions";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const viewer = await getSessionUser();
  if (!viewer) redirect("/login");
  if (viewer.role !== "ADMIN") redirect("/");

  const reports = await prisma.report.findMany({
    where: { status: "OPEN" },
    orderBy: { createdAt: "desc" },
    include: {
      reporter: { select: { name: true } },
      post: { include: { author: { select: { name: true } }, media: { orderBy: { order: "asc" }, take: 1 } } },
      comment: { include: { author: { select: { name: true } }, post: { select: { id: true } } } },
      message: { include: { sender: { select: { name: true } } } },
    },
  });

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, role: true, disabled: true },
  });

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <TopBar />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6">
        <h1 className="mb-1 text-lg font-semibold">Admin</h1>
        <p className="mb-6 text-sm text-gray-500">Reported content and accounts. Function over polish.</p>

        {/* Reports queue */}
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Reports ({reports.length})
          </h2>
          {reports.length === 0 ? (
            <p className="rounded-xl border border-gray-200 bg-white px-4 py-6 text-center text-sm text-gray-400">
              Nothing reported. 🎉
            </p>
          ) : (
            <ul className="space-y-3">
              {reports.map((r) => (
                <li key={r.id} className="rounded-xl border border-gray-200 bg-white p-4">
                  <p className="mb-2 text-xs text-gray-400">
                    Reported by {r.reporter.name}
                    {r.reason ? ` — “${r.reason}”` : ""}
                  </p>

                  {r.post && (
                    <div className="flex items-center gap-3">
                      {r.post.media[0]?.type === "VIDEO"
                        ? <video src={r.post.media[0]?.url} className="h-16 w-16 rounded-md object-cover" muted />
                        : <img src={r.post.media[0]?.url} alt="" className="h-16 w-16 rounded-md object-cover" />}
                      <div className="flex-1 text-sm">
                        <p className="font-semibold">Post by {r.post.author.name}</p>
                        <p className="line-clamp-2 text-gray-600">{r.post.caption || <span className="text-gray-400">No caption</span>}</p>
                      </div>
                      {r.post.removed
                        ? <span className="text-xs font-semibold text-gray-400">Removed</span>
                        : <RemovePostBtn postId={r.post.id} />}
                    </div>
                  )}

                  {r.comment && (
                    <div className="flex items-center gap-3">
                      <div className="flex-1 text-sm">
                        <p className="font-semibold">Comment by {r.comment.author.name}</p>
                        <p className="text-gray-600">{r.comment.body}</p>
                      </div>
                      {r.comment.removed
                        ? <span className="text-xs font-semibold text-gray-400">Removed</span>
                        : <RemoveCommentBtn commentId={r.comment.id} />}
                    </div>
                  )}

                  {r.message && (
                    <div className="flex items-center gap-3">
                      <div className="flex-1 text-sm">
                        <p className="font-semibold">Message from {r.message.sender.name}</p>
                        <p className="text-gray-600">{r.message.removed ? "(removed)" : r.message.body}</p>
                      </div>
                      {r.message.removed
                        ? <span className="text-xs font-semibold text-gray-400">Removed</span>
                        : <RemoveMessageBtn messageId={r.message.id} />}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Accounts */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Accounts ({users.length})
          </h2>
          <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
            {users.map((u) => (
              <li key={u.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                <div className="min-w-0 flex-1">
                  <Link href={`/u/${u.id}`} className="font-semibold hover:underline">{u.name}</Link>
                  {u.role === "ADMIN" && <span className="ml-2 rounded bg-accent/30 px-1.5 py-0.5 text-[11px] font-semibold text-brand">admin</span>}
                  {u.disabled && <span className="ml-2 text-[11px] font-semibold text-red-600">disabled</span>}
                  <p className="truncate text-xs text-gray-400">{u.email}</p>
                </div>
                {u.id === viewer.id
                  ? <span className="text-xs text-gray-400">you</span>
                  : <DisableUserBtn userId={u.id} disabled={u.disabled} />}
              </li>
            ))}
          </ul>
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
