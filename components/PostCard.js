"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Avatar from "@/components/Avatar";
import PostMedia from "@/components/PostMedia";
import { Heart, HeartFilled, Comment as CommentIcon, Bookmark, BookmarkFilled, Flag } from "@/components/icons";

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60); if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default function PostCard({ post, currentUserId, isAdmin }) {
  const router = useRouter();
  const [removed, setRemoved] = useState(false);
  const [liked, setLiked] = useState(post.likedByMe);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [saved, setSaved] = useState(post.savedByMe);
  const [comments, setComments] = useState(post.comments);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  if (removed) return null;

  const isOwner = post.author.id === currentUserId;

  async function toggleLike() {
    setLiked((v) => !v); setLikeCount((c) => c + (liked ? -1 : 1));
    const res = await fetch(`/api/posts/${post.id}/like`, { method: "POST" });
    if (res.ok) { const d = await res.json(); setLiked(d.liked); setLikeCount(d.count); }
  }
  async function toggleSave() {
    setSaved((v) => !v);
    const res = await fetch(`/api/posts/${post.id}/save`, { method: "POST" });
    if (res.ok) { const d = await res.json(); setSaved(d.saved); }
  }
  async function addComment(e) {
    e.preventDefault();
    const text = draft.trim(); if (!text || busy) return;
    setBusy(true);
    const res = await fetch(`/api/posts/${post.id}/comments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: text }) });
    setBusy(false);
    if (res.ok) { const d = await res.json(); setComments((cs) => [...cs, d.comment]); setDraft(""); }
  }
  async function report(target) {
    const reason = window.prompt("Tell admins what's wrong (optional):") ?? "";
    const res = await fetch("/api/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...target, reason }) });
    if (res.ok) window.alert("Thanks — this was flagged for admins.");
  }
  async function deletePost() {
    if (!window.confirm(isOwner ? "Delete this post?" : "Remove this post for everyone?")) return;
    const res = isOwner
      ? await fetch(`/api/posts/${post.id}`, { method: "DELETE" })
      : await fetch("/api/admin/remove-post", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ postId: post.id }) });
    if (res.ok) { setRemoved(true); router.refresh(); }
  }
  async function deleteComment(c) {
    const res = c.mine
      ? await fetch(`/api/comments/${c.id}`, { method: "DELETE" })
      : await fetch("/api/admin/remove-comment", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ commentId: c.id }) });
    if (res.ok) setComments((cs) => cs.filter((x) => x.id !== c.id));
  }

  return (
    <article className="card overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <Link href={`/u/${post.author.id}`}><Avatar name={post.author.name} image={post.author.image} size={36} ring={post.kind === "REEL"} /></Link>
        <div className="leading-tight">
          <Link href={`/u/${post.author.id}`} className="text-sm font-semibold hover:underline">{post.author.name}</Link>
          <p className="text-xs text-gray-400">{post.kind === "REEL" ? "Reel · " : ""}{timeAgo(post.createdAt)}</p>
        </div>
        <div className="ml-auto flex items-center gap-3 text-gray-400">
          {!isOwner && <button onClick={() => report({ postId: post.id })} title="Report" className="hover:text-brand"><Flag /></button>}
          {(isOwner || isAdmin) && <button onClick={deletePost} className="text-xs font-semibold text-red-600 hover:underline">{isOwner ? "Delete" : "Remove"}</button>}
        </div>
      </div>

      <PostMedia media={post.media} />

      <div className="flex items-center gap-4 px-4 pt-3 text-gray-900">
        <button onClick={toggleLike} aria-label="Like" className="transition active:scale-90">
          {liked ? <span className="text-red-500"><HeartFilled /></span> : <Heart />}
        </button>
        <span className="text-gray-700"><CommentIcon /></span>
        <button onClick={toggleSave} aria-label="Save" className="ml-auto transition active:scale-90">
          {saved ? <span className="text-brand"><BookmarkFilled /></span> : <Bookmark />}
        </button>
      </div>

      {likeCount > 0 && <p className="px-4 pt-2 text-sm font-semibold">{likeCount} {likeCount === 1 ? "like" : "likes"}</p>}

      {post.caption && (
        <p className="px-4 pt-1 text-sm">
          <Link href={`/u/${post.author.id}`} className="font-semibold hover:underline">{post.author.name}</Link>{" "}
          <span className="whitespace-pre-wrap">{post.caption}</span>
        </p>
      )}

      {comments.length > 0 && (
        <ul className="space-y-1 px-4 pt-2 text-sm">
          {comments.map((c) => (
            <li key={c.id} className="group flex items-start gap-2">
              <span className="flex-1">
                <Link href={`/u/${c.author.id}`} className="font-semibold hover:underline">{c.author.name}</Link>{" "}
                <span className="whitespace-pre-wrap">{c.body}</span>
              </span>
              <span className="flex shrink-0 items-center gap-2 opacity-0 transition group-hover:opacity-100">
                {!c.mine && <button onClick={() => report({ commentId: c.id })} className="text-[11px] font-medium text-gray-400 hover:text-brand">report</button>}
                {(c.mine || isAdmin) && <button onClick={() => deleteComment(c)} className="text-[11px] font-semibold text-red-600 hover:underline">delete</button>}
              </span>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={addComment} className="mt-2 flex items-center gap-2 border-t border-gray-100 px-4 py-3">
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add a comment…" className="flex-1 text-sm outline-none placeholder:text-gray-400" />
        <button type="submit" disabled={!draft.trim() || busy} className="text-sm font-semibold text-brand disabled:text-gray-300">Post</button>
      </form>
    </article>
  );
}
