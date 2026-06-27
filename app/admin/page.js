import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import QRCode from "qrcode";
import { getSessionUser } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { getActiveCode } from "@/lib/access";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { RemovePostBtn, RemoveCommentBtn, RemoveMessageBtn, DisableUserBtn } from "@/components/AdminActions";
import { AccessCodeControls, RoleSelect, GradeClassEditor, ParentLinker } from "@/components/AdminOnboarding";
import { RoleBadge, ClassBadge } from "@/components/Badge";

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
    select: {
      id: true, name: true, email: true, role: true, gradeClass: true, disabled: true,
      childrenLinks: { select: { child: { select: { id: true, name: true } } } },
    },
  });

  // Students available to link as a parent's child.
  const students = users
    .filter((u) => u.role === "STUDENT")
    .map((u) => ({ id: u.id, name: u.name }));

  // School access code + QR (encodes the absolute /join link).
  const code = await getActiveCode();
  const h = headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || "http";
  const joinUrl = code ? `${proto}://${host}/join?code=${encodeURIComponent(code.code)}` : "";
  const qrSvg = code ? await QRCode.toString(joinUrl, { type: "svg", margin: 1 }) : "";

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <TopBar />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6">
        <h1 className="mb-1 text-lg font-semibold">Admin</h1>
        <p className="mb-6 text-sm text-gray-500">Onboarding, reported content, and accounts.</p>

        {/* School access code */}
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">School access code</h2>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            {code ? (
              <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center">
                <div className="h-32 w-32 shrink-0" dangerouslySetInnerHTML={{ __html: qrSvg }} />
                <div className="min-w-0 flex-1 text-center sm:text-left">
                  <p className="text-xs text-gray-500">Share this code or QR with the school. Anyone with it can join as a Student.</p>
                  <p className="my-2 select-all font-mono text-lg font-bold tracking-wider text-brand">{code.code}</p>
                  <p className="mb-3 break-all text-xs text-gray-400">{joinUrl}</p>
                  <AccessCodeControls hasCode={true} />
                </div>
              </div>
            ) : (
              <div className="text-center">
                <p className="mb-3 text-sm text-gray-500">No active code — joining is currently closed.</p>
                <AccessCodeControls hasCode={false} />
              </div>
            )}
          </div>
        </section>

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
          <ul className="space-y-2">
            {users.map((u) => {
              const isSelf = u.id === viewer.id;
              const children = u.childrenLinks.map((l) => l.child);
              return (
                <li key={u.id} className="rounded-xl border border-gray-200 bg-white p-4 text-sm">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/u/${u.id}`} className="font-semibold hover:underline">{u.name}</Link>
                        <RoleBadge role={u.role} />
                        <ClassBadge gradeClass={u.gradeClass} />
                        {u.disabled && <span className="text-[11px] font-semibold text-red-600">disabled</span>}
                        {isSelf && <span className="text-[11px] text-gray-400">you</span>}
                      </div>
                      <p className="truncate text-xs text-gray-400">{u.email}</p>
                    </div>
                    {!isSelf && <DisableUserBtn userId={u.id} disabled={u.disabled} />}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <RoleSelect userId={u.id} role={u.role} isSelf={isSelf} />
                    <GradeClassEditor userId={u.id} gradeClass={u.gradeClass} />
                  </div>

                  {u.role === "PARENT" && (
                    <ParentLinker parentId={u.id} students={students} children={children} />
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
