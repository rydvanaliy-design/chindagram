import { redirect } from "next/navigation";
import Link from "next/link";
import { getSessionUser } from "@/lib/guards";
import { canModerateContent } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import { getLocale } from "@/lib/i18n/getLocale";
import { makeT } from "@/lib/i18n/t";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import { ReviewActions } from "@/components/ReviewActions";

export const dynamic = "force-dynamic";

function PostThumb({ media }) {
  const m = media[0];
  if (!m) return <div className="h-14 w-14 shrink-0 rounded-md bg-gray-100" />;
  return m.type === "VIDEO"
    ? <video src={m.url} className="h-14 w-14 shrink-0 rounded-md object-cover" muted />
    : <img src={m.url} alt="" className="h-14 w-14 shrink-0 rounded-md object-cover" />;
}

export default async function ReviewPage() {
  const viewer = await getSessionUser();
  if (!viewer) redirect("/login");
  if (!canModerateContent(viewer.role)) redirect("/");
  const locale = await getLocale();
  const t = makeT(locale);

  // Held for review (auto-flagged or school-wide approval).
  const heldPosts = await prisma.post.findMany({
    where: { status: "PENDING", removed: false },
    orderBy: { createdAt: "asc" },
    include: { author: { select: { name: true } }, media: { orderBy: { order: "asc" }, take: 1 } },
  });
  const heldComments = await prisma.comment.findMany({
    where: { status: "PENDING", removed: false },
    orderBy: { createdAt: "asc" },
    include: { author: { select: { name: true } } },
  });
  const heldWallPosts = await prisma.wallPost.findMany({
    where: { status: "PENDING", removed: false },
    orderBy: { createdAt: "asc" },
    include: { author: { select: { name: true } }, owner: { select: { name: true } } },
  });

  // Reported (user-flagged) posts, comments and wall posts that are still open.
  const reports = await prisma.report.findMany({
    where: { status: "OPEN", OR: [{ postId: { not: null } }, { commentId: { not: null } }, { wallPostId: { not: null } }] },
    orderBy: { createdAt: "desc" },
    include: {
      reporter: { select: { name: true } },
      post: { include: { author: { select: { name: true } }, media: { orderBy: { order: "asc" }, take: 1 } } },
      comment: { include: { author: { select: { name: true } } } },
      wallPost: { include: { author: { select: { name: true } }, owner: { select: { name: true } } } },
    },
  });

  const heldCount = heldPosts.length + heldComments.length + heldWallPosts.length;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <TopBar />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6">
        <h1 className="mb-1 text-lg font-semibold">{t("review.title")}</h1>
        <p className="mb-6 text-sm text-gray-500">
          {t("review.intro")} {viewer.role === "ADMIN" && (
            <Link href="/admin" className="text-brand hover:underline">{t("review.adminTools")}</Link>
          )}
        </p>

        {/* Held for review */}
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            {t("review.held.heading", { count: heldCount })}
          </h2>
          {heldCount === 0 ? (
            <p className="rounded-xl border border-gray-200 bg-white px-4 py-6 text-center text-sm text-gray-400">
              {t("review.held.empty")}
            </p>
          ) : (
            <ul className="space-y-3">
              {heldPosts.map((p) => (
                <li key={p.id} className="rounded-xl border border-amber-200 bg-white p-4">
                  <div className="flex items-center gap-3">
                    <PostThumb media={p.media} />
                    <div className="min-w-0 flex-1 text-sm">
                      <p className="font-semibold">{t("review.item.postBy", { name: p.author.name })}</p>
                      <p className="line-clamp-2 text-gray-600">{p.caption || <span className="text-gray-400">{t("review.item.noCaption")}</span>}</p>
                      {p.flagReason && <p className="mt-1 text-xs text-amber-600">{p.flagReason}</p>}
                    </div>
                    <ReviewActions type="post" id={p.id} />
                  </div>
                </li>
              ))}
              {heldComments.map((c) => (
                <li key={c.id} className="rounded-xl border border-amber-200 bg-white p-4">
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1 text-sm">
                      <p className="font-semibold">{t("review.item.commentBy", { name: c.author.name })}</p>
                      <p className="text-gray-600">{c.body}</p>
                      {c.flagReason && <p className="mt-1 text-xs text-amber-600">{c.flagReason}</p>}
                    </div>
                    <ReviewActions type="comment" id={c.id} />
                  </div>
                </li>
              ))}
              {heldWallPosts.map((w) => (
                <li key={w.id} className="rounded-xl border border-amber-200 bg-white p-4">
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1 text-sm">
                      <p className="font-semibold">{t("review.item.wallPostBy", { name: w.author.name })} <span className="font-normal text-gray-400">{t("review.item.onWall", { name: w.owner.name })}</span></p>
                      <p className="text-gray-600">{w.body}</p>
                      {w.flagReason && <p className="mt-1 text-xs text-amber-600">{w.flagReason}</p>}
                    </div>
                    <ReviewActions type="wallpost" id={w.id} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Reported */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            {t("review.reported.heading", { count: reports.length })}
          </h2>
          {reports.length === 0 ? (
            <p className="rounded-xl border border-gray-200 bg-white px-4 py-6 text-center text-sm text-gray-400">
              {t("review.reported.empty")}
            </p>
          ) : (
            <ul className="space-y-3">
              {reports.map((r) => (
                <li key={r.id} className="rounded-xl border border-gray-200 bg-white p-4">
                  <p className="mb-2 text-xs text-gray-400">
                    {r.reason
                      ? t("review.reported.byWithReason", { name: r.reporter.name, reason: r.reason })
                      : t("review.reported.by", { name: r.reporter.name })}
                  </p>
                  {r.post && (
                    <div className="flex items-center gap-3">
                      <PostThumb media={r.post.media} />
                      <div className="min-w-0 flex-1 text-sm">
                        <p className="font-semibold">{t("review.item.postBy", { name: r.post.author.name })}</p>
                        <p className="line-clamp-2 text-gray-600">{r.post.caption || <span className="text-gray-400">{t("review.item.noCaption")}</span>}</p>
                      </div>
                      {r.post.removed
                        ? <span className="text-xs font-semibold text-gray-400">{t("review.reported.removed")}</span>
                        : <ReviewActions type="post" id={r.post.id} />}
                    </div>
                  )}
                  {r.comment && (
                    <div className="flex items-center gap-3">
                      <div className="min-w-0 flex-1 text-sm">
                        <p className="font-semibold">{t("review.item.commentBy", { name: r.comment.author.name })}</p>
                        <p className="text-gray-600">{r.comment.body}</p>
                      </div>
                      {r.comment.removed
                        ? <span className="text-xs font-semibold text-gray-400">{t("review.reported.removed")}</span>
                        : <ReviewActions type="comment" id={r.comment.id} />}
                    </div>
                  )}
                  {r.wallPost && (
                    <div className="flex items-center gap-3">
                      <div className="min-w-0 flex-1 text-sm">
                        <p className="font-semibold">{t("review.item.wallPostBy", { name: r.wallPost.author.name })} <span className="font-normal text-gray-400">{t("review.item.onWall", { name: r.wallPost.owner.name })}</span></p>
                        <p className="text-gray-600">{r.wallPost.body}</p>
                      </div>
                      {r.wallPost.removed
                        ? <span className="text-xs font-semibold text-gray-400">{t("review.reported.removed")}</span>
                        : <ReviewActions type="wallpost" id={r.wallPost.id} />}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
