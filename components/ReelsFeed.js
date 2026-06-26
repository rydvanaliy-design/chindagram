"use client";
import { useState } from "react";
import Link from "next/link";
import Avatar from "@/components/Avatar";
import { Heart, HeartFilled } from "@/components/icons";

function ReelItem({ reel }) {
  const [liked, setLiked] = useState(reel.likedByMe);
  const [count, setCount] = useState(reel.likeCount);
  async function toggle() {
    setLiked((v) => !v); setCount((c) => c + (liked ? -1 : 1));
    const res = await fetch(`/api/posts/${reel.id}/like`, { method: "POST" });
    if (res.ok) { const d = await res.json(); setLiked(d.liked); setCount(d.count); }
  }
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
      <button onClick={toggle} className="absolute bottom-28 right-4 flex flex-col items-center text-white sm:bottom-8">
        <span className={liked ? "text-red-500" : "text-white"}>{liked ? <HeartFilled /> : <Heart />}</span>
        <span className="text-xs font-semibold">{count}</span>
      </button>
    </section>
  );
}

export default function ReelsFeed({ reels }) {
  if (reels.length === 0) {
    return <p className="py-20 text-center text-sm text-gray-400">No reels yet. Post a video to start.</p>;
  }
  return (
    <div className="h-[100dvh] snap-y snap-mandatory overflow-y-scroll no-scrollbar">
      {reels.map((r) => <ReelItem key={r.id} reel={r} />)}
    </div>
  );
}
