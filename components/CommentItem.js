"use client";
import { useState } from "react";
import Link from "next/link";
import RichText from "@/components/RichText";
import { Heart, HeartFilled } from "@/components/icons";
import { useT } from "@/lib/i18n/LocaleProvider";

function ago(iso, t) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return t("posts.card.justNow");
  const m = Math.floor(s / 60); if (m < 60) return `${m}${t("posts.card.minutesSuffix")}`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}${t("posts.card.hoursSuffix")}`;
  return `${Math.floor(h / 24)}${t("posts.card.daysSuffix")}`;
}

export default function CommentItem({ comment, isAdmin, canPin, onReply, onDelete, onReport, isReply = false }) {
  const { t } = useT();
  const [liked, setLiked] = useState(comment.likedByMe);
  const [likeCount, setLikeCount] = useState(comment.likeCount);
  const [pinned, setPinned] = useState(comment.pinned);
  const [replying, setReplying] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  async function toggleLike() {
    setLiked((v) => !v); setLikeCount((c) => c + (liked ? -1 : 1));
    const res = await fetch(`/api/comments/${comment.id}/like`, { method: "POST" });
    if (res.ok) { const d = await res.json(); setLiked(d.liked); setLikeCount(d.count); }
  }
  async function togglePin() {
    const res = await fetch(`/api/comments/${comment.id}/pin`, { method: "POST" });
    if (res.ok) { const d = await res.json(); setPinned(d.pinned); }
  }
  async function submitReply(e) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || busy) return;
    setBusy(true);
    await onReply(comment.id, text);
    setBusy(false);
    setDraft("");
    setReplying(false);
  }

  return (
    <li className={isReply ? "ml-8" : ""}>
      <div className="group flex items-start gap-2">
        <span className="flex-1 text-sm">
          <Link href={`/u/${comment.author.id}`} className="font-semibold hover:underline">{comment.author.name}</Link>{" "}
          {comment.body && <RichText text={comment.body} />}
          {comment.pending && <span className="ml-1 text-[11px] font-semibold text-amber-600">· {t("posts.comments.pendingReview")}</span>}
          {pinned && <span className="ml-1 text-[11px] font-semibold text-brand">· 📌 {t("posts.comments.pinned")}</span>}
          {comment.mediaUrl && (
            <img src={comment.mediaUrl} alt="" className="mt-1 h-24 w-24 rounded-lg object-cover" />
          )}
          <span className="mt-0.5 flex items-center gap-3 text-[11px] text-gray-400">
            <span>{ago(comment.createdAt, t)}</span>
            {likeCount > 0 && <span>{likeCount === 1 ? t("posts.comments.like") : t("posts.comments.likes", { count: likeCount })}</span>}
            <button onClick={() => setReplying((v) => !v)} className="font-semibold hover:text-gray-600">{t("posts.comments.reply")}</button>
            {canPin && <button onClick={togglePin} className="font-semibold hover:text-brand">{pinned ? t("posts.comments.unpin") : t("posts.comments.pin")}</button>}
            <span className="opacity-0 transition group-hover:opacity-100">
              {!comment.mine && <button onClick={() => onReport(comment.id)} className="font-medium hover:text-brand">{t("posts.comments.report")}</button>}
            </span>
            {(comment.mine || isAdmin) && (
              <span className="opacity-0 transition group-hover:opacity-100">
                <button onClick={() => onDelete(comment.id)} className="font-semibold text-red-500 hover:underline">{t("posts.comments.delete")}</button>
              </span>
            )}
          </span>
        </span>
        <button onClick={toggleLike} aria-label={t("posts.comments.likeComment")} className="mt-0.5 shrink-0">
          {liked ? <span className="text-red-500"><HeartFilled /></span> : <span className="scale-75 text-gray-400"><Heart /></span>}
        </button>
      </div>

      {replying && (
        <form onSubmit={submitReply} className="ml-2 mt-1 flex items-center gap-2">
          <input
            value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus
            placeholder={t("posts.comments.replyTo", { name: comment.author.name })}
            className="flex-1 rounded-full border border-gray-200 px-3 py-1 text-xs outline-none focus:border-gray-400"
          />
          <button type="submit" disabled={!draft.trim() || busy} className="text-xs font-semibold text-brand disabled:text-gray-300">{t("posts.comments.post")}</button>
        </form>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <ul className="mt-1 space-y-1">
          {comment.replies.map((r) => (
            <CommentItem key={r.id} comment={r} isAdmin={isAdmin} canPin={false} onReply={onReply} onDelete={onDelete} onReport={onReport} isReply />
          ))}
        </ul>
      )}
    </li>
  );
}
