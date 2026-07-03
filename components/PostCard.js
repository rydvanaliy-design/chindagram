"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Avatar from "@/components/Avatar";
import PostMedia from "@/components/PostMedia";
import Poll from "@/components/Poll";
import RichText from "@/components/RichText";
import ReactionBar from "@/components/ReactionBar";
import RepostMenu from "@/components/RepostMenu";
import SaveButton from "@/components/SaveButton";
import PostEmbed from "@/components/PostEmbed";
import CommentItem from "@/components/CommentItem";
import CommentComposer from "@/components/CommentComposer";
import { Comment as CommentIcon, Flag } from "@/components/icons";
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
  const [comments, setComments] = useState(post.comments);
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

  async function addComment(text, mediaUrl, mediaType) {
    const res = await fetch(`/api/posts/${post.id}/comments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: text, mediaUrl, mediaType }) });
    if (res.ok) {
      const d = await res.json();
      setComments((cs) => [...cs, { ...d.comment, pending: d.comment.status === "PENDING" }]);
    }
  }
  async function addReply(parentId, text) {
    const res = await fetch(`/api/posts/${post.id}/comments`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body: text, parentId }),
    });
    if (res.ok) {
      const d = await res.json();
      const reply = { ...d.comment, pending: d.comment.status === "PENDING" };
      // The API may auto-flatten a reply-to-a-reply onto its top-level parent.
      setComments((cs) => cs.map((c) => c.id === d.comment.parentId ? { ...c, replies: [...c.replies, reply] } : c));
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
  async function deleteComment(id) {
    // Search top-level comments and one level of replies for the matching id.
    let mine = false;
    for (const c of comments) {
      if (c.id === id) { mine = c.mine; break; }
      const r = c.replies.find((x) => x.id === id);
      if (r) { mine = r.mine; break; }
    }
    const res = mine
      ? await fetch(`/api/comments/${id}`, { method: "DELETE" })
      : await fetch("/api/admin/remove-comment", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ commentId: id }) });
    if (res.ok) {
      setComments((cs) => cs
        .filter((c) => c.id !== id)
        .map((c) => ({ ...c, replies: c.replies.filter((r) => r.id !== id) })));
    }
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

      {post.kind === "REPOST" ? (
        <>
          {post.caption && <p className="px-4 pb-2 text-[15px] text-gray-900"><RichText text={post.caption} /></p>}
          <PostEmbed post={post.repostOf} className="mx-4 mb-1" />
        </>
      ) : post.kind === "AUDIO" && hasMedia ? (
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

      <div className="flex items-start gap-4 px-4 pt-3 text-gray-900">
        <ReactionBar postId={post.id} initialMyReaction={post.myReaction} initialBreakdown={post.reactionBreakdown} initialTotal={post.totalReactions} />
        <span className="pt-0.5 text-gray-700"><CommentIcon /></span>
        <RepostMenu postId={post.id} />
        <div className="ml-auto">
          <SaveButton postId={post.id} initialSaved={post.savedByMe} initialCollectionId={post.savedCollectionId} />
        </div>
      </div>

      {post.caption && post.kind !== "TEXT" && post.kind !== "POLL" && post.kind !== "REPOST" && (
        <p className="px-4 pt-1 text-sm">
          <Link href={`/u/${post.author.id}`} className="font-semibold hover:underline">{post.author.name}</Link>{" "}
          <RichText text={post.caption} />
        </p>
      )}

      {comments.length > 0 && (
        <ul className="space-y-2 px-4 pt-2">
          {comments.map((c) => (
            <CommentItem
              key={c.id} comment={c} isAdmin={isAdmin} canPin={isOwner || isAdmin}
              onReply={addReply} onDelete={deleteComment}
              onReport={(id) => report({ commentId: id })}
            />
          ))}
        </ul>
      )}

      <CommentComposer onSubmit={addComment} />
    </article>
  );
}
