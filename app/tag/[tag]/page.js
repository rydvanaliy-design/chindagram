import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/guards";
import { getPostList } from "@/lib/posts";
import TopBar from "@/components/TopBar";
import BottomNav from "@/components/BottomNav";
import PostCard from "@/components/PostCard";
import { getLocale } from "@/lib/i18n/getLocale";
import { makeT } from "@/lib/i18n/t";

export const dynamic = "force-dynamic";

export default async function TagPage({ params }) {
  const viewer = await getSessionUser();
  if (!viewer) redirect("/login");
  const locale = await getLocale();
  const t = makeT(locale);
  const me = viewer.id;

  const tag = String(params.tag || "").toLowerCase().replace(/[^a-z0-9_]/g, "");

  // `mode: "insensitive"` is what makes #Tag match #tag on Postgres — SQLite
  // gave this for free, Postgres does not.
  // We then keep only exact-token matches (so "#tag" doesn't match "#tagger").
  // Club posts live on the club's own page, not general hashtag discovery.
  const candidates = tag ? await getPostList({ caption: { contains: `#${tag}`, mode: "insensitive" }, clubId: null }, me, 60) : [];
  const re = new RegExp(`#${tag}\\b`, "i");
  const posts = candidates.filter((p) => p.caption && re.test(p.caption));

  const isAdmin = viewer.role === "ADMIN";

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <TopBar />
      <main className="mx-auto w-full max-w-xl flex-1 py-4">
        <h1 className="px-4 pb-2 text-lg font-semibold">#{tag}</h1>
        {posts.length === 0 ? (
          <p className="px-6 py-16 text-center text-sm text-gray-400">{t("discovery.tag.empty", { tag })}</p>
        ) : (
          <div className="flex flex-col gap-4">
            {posts.map((post) => <PostCard key={post.id} post={post} currentUserId={me} isAdmin={isAdmin} />)}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
