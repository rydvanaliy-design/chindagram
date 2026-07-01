"use client";
import Link from "next/link";
import Avatar from "@/components/Avatar";

// Compact clickable preview of an original post — used when a post is a
// repost, and when a shared post appears in a story or a DM.
export default function PostEmbed({ post, className = "" }) {
  if (!post || post.unavailable) {
    return (
      <div className={`rounded-xl border border-gray-200 p-4 text-center text-xs text-gray-400 ${className}`}>
        This post is no longer available.
      </div>
    );
  }
  const media = post.media && post.media[0];

  return (
    <Link href={`/p/${post.id}`} className={`block overflow-hidden rounded-xl border border-gray-200 bg-white hover:bg-gray-50 ${className}`}>
      <div className="flex items-center gap-2 px-3 py-2">
        <Avatar name={post.author.name} image={post.author.image} size={24} />
        <span className="text-xs font-semibold">{post.author.name}</span>
      </div>
      {media ? (
        media.type === "VIDEO" ? (
          <video src={media.url} className="max-h-72 w-full bg-black object-contain" muted />
        ) : (
          <img src={media.url} alt="" className="max-h-72 w-full bg-black object-contain" />
        )
      ) : null}
      {post.linkUrl && <p className="truncate px-3 pb-2 pt-2 text-xs text-brand">{post.linkUrl}</p>}
      {post.caption && <p className="line-clamp-3 px-3 pb-2 pt-2 text-xs text-gray-700">{post.caption}</p>}
    </Link>
  );
}
