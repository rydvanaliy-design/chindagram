"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Avatar from "@/components/Avatar";
import PostMedia from "@/components/PostMedia";
import Poll from "@/components/Poll";
import RichText from "@/components/RichText";
import { Heart, HeartFilled, Comment as CommentIcon, Bookmark, BookmarkFilled, Flag } from "@/components/icons";
import { RoleBadge, ClassBadge } from "@/components/Badge";
import { CATEGORY_LABELS } from "@/lib/postkinds";

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60); if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function LinkCard({ url }) {
  const href = /^https?:\/\//.test(url) ? url : `https://${url}`;
  let host = "";
  try { host = new URL(href).hostname.replace(/^www\./, ""); } catch {}
  return (
    <a href={href} target="_blank" rel="noreferrer noopener"
      className="mx-4 mb-1 block rounded-xl border border-gray-200 p-3 hover:bg-gray-50">
      {host && <p className="text-xs text-gray-400">{host}</p>}
      <p className="truncate text-sm font-medium text-brand">{url}</p>
    </a>
  );
}

function AudioCard({ media }) {
  return (
    <div className="mx-4 mb-1 rounded-xl border border-gray-200 p-3">
      {media.name && <p className="mb-2 truncate text-sm font-medium">🎵 {media.name}</p>}
      <audio src={media.url} controls className="w-full" />
    </div>
  );
}

function DocCard({ media }) {
  return (
    <a href={media.url} target="_blank" rel="noreferrer noopener" download={media.name || true}
      className="mx-4 mb-1 flex items-center gap-3 rounded-xl border border-gray-200 p-3 hover:bg-gray-50">
      <span className="text-2xl">📄</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-gray-900">{media.name || "Document"}</span>
        <span className="text-xs text-brand">Open / download</span>
      </span>
    </a>
  );
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
  const [pinned, setPinned] = useState(post.pinned);
  const [invite, setInvite] = useState(post.myInvite);
  if (removed) return null;

  async function respondInvite(action) {
    if (!invite) return;
    const res = await fetch(`/api/collab/${invite.id}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }),
    });
    if (res.ok) { setInvite(null); router.refresh(); }
  }

  const isOwner = post.author.id === currentUserId;
  const hasMedia = post.media && post.media.length > 0;

  async function togglePin() {
    const res = await fetch(`/api/posts/${post.id}/pin`, { method: "POST" });
    if (res.ok) { const d = await res.json(); setPinned(d.pinned); router.refresh(); }
  }

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
    if (res.ok) {
      const d = await res.json();
      setComments((cs) => [...cs, { ...d.comment, pending: d.comment.status === "PENDING" }]);
      setDraft("");
    }
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
          <span className="flex flex-wrap items-center gap-1.5">
            <Link href={`/u/${post.author.id}`} className="text-sm font-semibold hover:underline">{post.author.name}</Link>
            {post.coAuthors && post.coAuthors.map((c) => (
              <span key={c.id} className="text-sm text-gray-500">
                & <Link href={`/u/${c.id}`} className="font-semibold text-gray-700 hover:underline">{c.name}</Link>
              </span>
            ))}
            <RoleBadge role={post.author.role} />
            <ClassBadge gradeClass={post.author.gradeClass} />
          </span>
          <p className="text-xs text-gray-400">
            {post.kind === "REEL" ? "Reel · " : ""}{timeAgo(post.createdAt)}
            {pinned && <span className="ml-1 font-semibold text-brand">· 📌 Pinned</span>}
            {post.pending && <span className="ml-1 font-semibold text-amber-600">· Pending review</span>}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-3 text-gray-400">
          {isOwner && <button onClick={togglePin} title={pinned ? "Unpin" : "Pin to profile"} className="text-xs font-semibold text-gray-500 hover:text-brand">{pinned ? "Unpin" : "Pin"}</button>}
          {!isOwner && <button onClick={() => report({ postId: post.id })} title="Report" className="hover:text-brand"><Flag /></button>}
          {(isOwner || isAdmin) && <button onClick={deletePost} className="text-xs font-semibold text-red-600 hover:underline">{isOwner ? "Delete" : "Remove"}</button>}
        </div>
      </div>

      {post.pending && (
        <p className="mx-4 mb-1 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Waiting for a teacher or admin to review. Only you can see this for now.
        </p>
      )}

      {invite && (
        <div className="mx-4 mb-2 flex items-center justify-between gap-2 rounded-lg bg-brand/5 px-3 py-2 text-xs">
          <span className="text-gray-700">{post.author.name} invited you to co-author this post.</span>
          <span className="flex shrink-0 gap-2">
            <button onClick={() => respondInvite("accept")} className="rounded-md bg-brand px-2 py-1 font-semibold text-white">Accept</button>
            <button onClick={() => respondInvite("decline")} className="rounded-md border border-gray-300 px-2 py-1 font-semibold text-gray-600">Decline</button>
          </span>
        </div>
      )}

      {post.category && post.category !== "NONE" && (
        <div className="mx-4 mb-2 inline-block rounded-lg bg-accent/20 px-3 py-1 text-xs font-semibold text-brand">
          {CATEGORY_LABELS[post.category] || post.category}
        </div>
      )}

      {post.kind === "AUDIO" && hasMedia ? (
        <AudioCard media={post.media[0]} />
      ) : post.kind === "DOCUMENT" && hasMedia ? (
        <DocCard media={post.media[0]} />
      ) : hasMedia ? (
        <PostMedia media={post.media} />
      ) : post.kind === "LINK" ? (
        <LinkCard url={post.linkUrl} />
      ) : post.kind === "TEXT" ? (
        <p className="px-4 pb-1 text-[15px] text-gray-900"><RichText text={post.caption} /></p>
      ) : post.kind === "POLL" && post.poll ? (
        <>
          {post.caption && <p className="px-4 pb-2 text-[15px] font-medium text-gray-900"><RichText text={post.caption} /></p>}
          <Poll postId={post.id} poll={post.poll} />
        </>
      ) : null}

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

      {post.caption && post.kind !== "TEXT" && post.kind !== "POLL" && (
        <p className="px-4 pt-1 text-sm">
          <Link href={`/u/${post.author.id}`} className="font-semibold hover:underline">{post.author.name}</Link>{" "}
          <RichText text={post.caption} />
        </p>
      )}

      {comments.length > 0 && (
        <ul className="space-y-1 px-4 pt-2 text-sm">
          {comments.map((c) => (
            <li key={c.id} className="group flex items-start gap-2">
              <span className="flex-1">
                <Link href={`/u/${c.author.id}`} className="font-semibold hover:underline">{c.author.name}</Link>{" "}
                <RichText text={c.body} />
                {c.pending && <span className="ml-1 text-[11px] font-semibold text-amber-600">· pending review</span>}
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
