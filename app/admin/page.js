import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { requireApproval } from "@/lib/settings";
import { getLocale } from "@/lib/i18n/getLocale";
import { makeT } from "@/lib/i18n/t";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { RemovePostBtn, RemoveCommentBtn, RemoveMessageBtn } from "@/components/AdminActions";
import { ApprovalToggle } from "@/components/AdminOnboarding";
import AccountsPanel from "@/components/AccountsPanel";
import BroadcastForm from "@/components/BroadcastForm";
import ClubAdminRow from "@/components/ClubAdminRow";

export const dynamic = "force-dynamic";

export default async function AdminPage({ searchParams }) {
  const viewer = await getSessionUser();
  if (!viewer) redirect("/login");
  if (viewer.role !== "ADMIN") redirect("/");

  const locale = await getLocale();
  const t = makeT(locale);

  const q = (searchParams?.q || "").trim();

  const [userCount, postCount, clubCount, eventCount, studentCount, teacherCount] = await Promise.all([
    prisma.user.count(),
    prisma.post.count({ where: { removed: false } }),
    prisma.club.count(),
    prisma.event.count(),
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.user.count({ where: { role: { in: ["TEACHER", "ADMIN"] } } }),
  ]);

  // Content search — bypasses normal visibility so admins can investigate
  // anything, but skips already-removed content (nothing to act on there).
  const [matchedPosts, matchedComments, matchedMessages] = q ? await Promise.all([
    prisma.post.findMany({
      where: { removed: false, caption: { contains: q } }, take: 15, orderBy: { createdAt: "desc" },
      select: { id: true, caption: true, author: { select: { name: true } } },
    }),
    prisma.comment.findMany({
      where: { removed: false, body: { contains: q } }, take: 15, orderBy: { createdAt: "desc" },
      select: { id: true, body: true, postId: true, author: { select: { name: true } } },
    }),
    prisma.message.findMany({
      where: { removed: false, body: { contains: q } }, take: 15, orderBy: { createdAt: "desc" },
      select: { id: true, body: true, sender: { select: { name: true } } },
    }),
  ]) : [[], [], []];

  const clubsRaw = await prisma.club.findMany({
    orderBy: { createdAt: "desc" },
    include: { createdBy: { select: { name: true } }, _count: { select: { members: { where: { status: "ACCEPTED" } } } } },
  });
  const clubs = clubsRaw.map((c) => ({ id: c.id, name: c.name, createdBy: c.createdBy, memberCount: c._count.members }));

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

  const approvalOn = await requireApproval();
  const pendingCount = await prisma.post.count({ where: { status: "PENDING", removed: false } })
    + await prisma.comment.count({ where: { status: "PENDING", removed: false } })
    + await prisma.wallPost.count({ where: { status: "PENDING", removed: false } });

  // Safety review: who has blocked whom (spec: "Admins can view block relationships").
  const blocks = await prisma.block.findMany({
    orderBy: { createdAt: "desc" },
    include: { blocker: { select: { name: true } }, blocked: { select: { name: true } } },
  });

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <TopBar />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6">
        <h1 className="mb-1 text-lg font-semibold">{t("admin.page.title")}</h1>
        <p className="mb-6 text-sm text-gray-500">{t("admin.page.subtitle")}</p>

        {/* Usage stats */}
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">{t("admin.stats.heading")}</h2>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {[
              { label: t("admin.stats.users"), value: userCount },
              { label: t("admin.stats.students"), value: studentCount },
              { label: t("admin.stats.staff"), value: teacherCount },
              { label: t("admin.stats.posts"), value: postCount },
              { label: t("admin.stats.clubs"), value: clubCount },
              { label: t("admin.stats.events"), value: eventCount },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-3 text-center">
                <p className="text-lg font-semibold">{s.value}</p>
                <p className="text-[11px] text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Broadcast */}
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">{t("admin.broadcast.heading")}</h2>
          <BroadcastForm />
        </section>

        {/* Content search */}
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">{t("admin.search.heading")}</h2>
          <form action="/admin" className="mb-3 flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2">
            <input name="q" defaultValue={q} placeholder={t("admin.search.placeholder")} className="flex-1 text-sm outline-none" />
          </form>
          {q && (
            <div className="space-y-3">
              {matchedPosts.length === 0 && matchedComments.length === 0 && matchedMessages.length === 0 ? (
                <p className="rounded-xl border border-gray-200 bg-white px-4 py-6 text-center text-sm text-gray-400">{t("admin.search.noMatches", { query: q })}</p>
              ) : (
                <>
                  {matchedPosts.map((p) => (
                    <div key={p.id} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4">
                      <div className="flex-1 text-sm">
                        <p className="font-semibold">{t("admin.search.postBy", { name: p.author.name })}</p>
                        <Link href={`/p/${p.id}`} className="line-clamp-2 text-gray-600 hover:underline">{p.caption}</Link>
                      </div>
                      <RemovePostBtn postId={p.id} />
                    </div>
                  ))}
                  {matchedComments.map((c) => (
                    <div key={c.id} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4">
                      <div className="flex-1 text-sm">
                        <p className="font-semibold">{t("admin.search.commentBy", { name: c.author.name })}</p>
                        <Link href={`/p/${c.postId}`} className="text-gray-600 hover:underline">{c.body}</Link>
                      </div>
                      <RemoveCommentBtn commentId={c.id} />
                    </div>
                  ))}
                  {matchedMessages.map((m) => (
                    <div key={m.id} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4">
                      <div className="flex-1 text-sm">
                        <p className="font-semibold">{t("admin.search.messageFrom", { name: m.sender.name })}</p>
                        <p className="text-gray-600">{m.body}</p>
                      </div>
                      <RemoveMessageBtn messageId={m.id} />
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </section>

        {/* Moderation */}
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">{t("admin.moderation.heading")}</h2>
          <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold">{t("admin.moderation.holdAllTitle")}</p>
                <p className="text-xs text-gray-500">{t("admin.moderation.holdAllDescription")}</p>
              </div>
              <ApprovalToggle enabled={approvalOn} />
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-3">
              <p className="text-sm">
                {pendingCount > 0
                  ? t(pendingCount === 1 ? "admin.moderation.pendingOne" : "admin.moderation.pendingOther", { count: pendingCount })
                  : t("admin.moderation.nothingPending")}
              </p>
              <Link href="/review" className="rounded-md bg-brand px-3 py-1.5 text-xs font-semibold text-white">{t("admin.moderation.openQueue")}</Link>
            </div>
          </div>
        </section>

        {/* Reports queue */}
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            {t("admin.reports.heading", { count: reports.length })}
          </h2>
          {reports.length === 0 ? (
            <p className="rounded-xl border border-gray-200 bg-white px-4 py-6 text-center text-sm text-gray-400">
              {t("admin.reports.empty")} 🎉
            </p>
          ) : (
            <ul className="space-y-3">
              {reports.map((r) => (
                <li key={r.id} className="rounded-xl border border-gray-200 bg-white p-4">
                  <p className="mb-2 text-xs text-gray-400">
                    {t("admin.reports.reportedBy", { name: r.reporter.name })}
                    {r.reason ? t("admin.reports.reasonSuffix", { reason: r.reason }) : ""}
                  </p>

                  {r.post && (
                    <div className="flex items-center gap-3">
                      {r.post.media[0]?.type === "VIDEO"
                        ? <video src={r.post.media[0]?.url} className="h-16 w-16 rounded-md object-cover" muted />
                        : <img src={r.post.media[0]?.url} alt="" className="h-16 w-16 rounded-md object-cover" />}
                      <div className="flex-1 text-sm">
                        <p className="font-semibold">{t("admin.search.postBy", { name: r.post.author.name })}</p>
                        <p className="line-clamp-2 text-gray-600">{r.post.caption || <span className="text-gray-400">{t("admin.reports.noCaption")}</span>}</p>
                      </div>
                      {r.post.removed
                        ? <span className="text-xs font-semibold text-gray-400">{t("admin.reports.removed")}</span>
                        : <RemovePostBtn postId={r.post.id} />}
                    </div>
                  )}

                  {r.comment && (
                    <div className="flex items-center gap-3">
                      <div className="flex-1 text-sm">
                        <p className="font-semibold">{t("admin.search.commentBy", { name: r.comment.author.name })}</p>
                        <p className="text-gray-600">{r.comment.body}</p>
                      </div>
                      {r.comment.removed
                        ? <span className="text-xs font-semibold text-gray-400">{t("admin.reports.removed")}</span>
                        : <RemoveCommentBtn commentId={r.comment.id} />}
                    </div>
                  )}

                  {r.message && (
                    <div className="flex items-center gap-3">
                      <div className="flex-1 text-sm">
                        <p className="font-semibold">{t("admin.search.messageFrom", { name: r.message.sender.name })}</p>
                        <p className="text-gray-600">{r.message.removed ? t("admin.reports.messageRemoved") : r.message.body}</p>
                      </div>
                      {r.message.removed
                        ? <span className="text-xs font-semibold text-gray-400">{t("admin.reports.removed")}</span>
                        : <RemoveMessageBtn messageId={r.message.id} />}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Block relationships — safety review */}
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            {t("admin.blocks.heading", { count: blocks.length })}
          </h2>
          {blocks.length === 0 ? (
            <p className="rounded-xl border border-gray-200 bg-white px-4 py-6 text-center text-sm text-gray-400">
              {t("admin.blocks.empty")}
            </p>
          ) : (
            <ul className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white">
              {blocks.map((b) => {
                const [beforeBlocked, afterBlocked] = t("admin.blocks.blockedLine", { blocker: " BLOCKER ", blocked: " BLOCKED " })
                  .split(" BLOCKED ");
                const [before, afterBlocker] = beforeBlocked.split(" BLOCKER ");
                return (
                  <li key={b.id} className="px-4 py-3 text-sm">
                    {before}<b>{b.blocker.name}</b>{afterBlocker}<b>{b.blocked.name}</b>{afterBlocked}
                    <span className="ml-2 text-xs text-gray-400">{new Date(b.createdAt).toLocaleDateString()}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Clubs */}
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            {t("admin.clubs.heading", { count: clubs.length })}
          </h2>
          {clubs.length === 0 ? (
            <p className="rounded-xl border border-gray-200 bg-white px-4 py-6 text-center text-sm text-gray-400">{t("admin.clubs.empty")}</p>
          ) : (
            <ul className="space-y-2">
              {clubs.map((c) => <ClubAdminRow key={c.id} club={c} />)}
            </ul>
          )}
        </section>

        {/* Accounts */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            {t("admin.accounts.heading", { count: users.length })}
          </h2>
          <AccountsPanel users={users} students={students} viewerId={viewer.id} />
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
