"use client";
import Link from "next/link";
import Avatar from "@/components/Avatar";
import ReactionBar from "@/components/ReactionBar";
import { useT } from "@/lib/i18n/LocaleProvider";

function ReelItem({ reel }) {
  return (
    <section className="relative flex h-[100dvh] snap-start items-center justify-center bg-black">
      {reel.videoUrl && (
        <video src={reel.videoUrl} className="h-full w-full object-contain" controls playsInline loop />
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 pb-24 text-white sm:pb-6">
        <Link href={`/u/${reel.author.id}`} className="pointer-events-auto mb-2 flex items-center gap-2">
          <Avatar name={reel.author.name} image={reel.author.image} size={32} />
          <span className="text-sm font-semibold">{reel.author.name}</span>
        </Link>
        {reel.caption && <p className="max-w-md text-sm">{reel.caption}</p>}
      </div>
      <div className="absolute bottom-28 right-4 flex flex-col items-center sm:bottom-8">
        <ReactionBar postId={reel.id} initialMyReaction={reel.myReaction} initialBreakdown={reel.reactionBreakdown} initialTotal={reel.totalReactions} dark />
      </div>
    </section>
  );
}

export default function ReelsFeed({ reels }) {
  const { t } = useT();
  if (reels.length === 0) {
    return <p className="py-20 text-center text-sm text-gray-400">{t("discovery.reels.empty")}</p>;
  }
  return (
    <div className="h-[100dvh] snap-y snap-mandatory overflow-y-scroll no-scrollbar">
      {reels.map((r) => <ReelItem key={r.id} reel={r} />)}
    </div>
  );
}
