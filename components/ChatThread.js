"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Avatar from "@/components/Avatar";
import PostEmbed from "@/components/PostEmbed";
import GroupInfoPanel from "@/components/GroupInfoPanel";
import MessageReactionButton from "@/components/MessageReactionButton";
import { REACTION_EMOJI } from "@/lib/reactions";
import { ChevronLeft, Send, X } from "@/components/icons";

function ReactionSummary({ reactions }) {
  const entries = Object.entries(reactions || {}).filter(([, c]) => c > 0);
  if (entries.length === 0) return null;
  const total = entries.reduce((s, [, c]) => s + c, 0);
  const top = entries.sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t]) => REACTION_EMOJI[t]).join("");
  return <span className="mt-0.5 inline-block rounded-full border border-gray-200 bg-white px-1.5 py-0.5 text-[11px] shadow-sm">{top} {total}</span>;
}

export default function ChatThread({ conversationId, me, initial, isAdmin, isGroup, name, image, otherId, members, createdById, iAmGroupAdmin }) {
  const [messages, setMessages] = useState(initial);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  function addIfNew(incoming) {
    setMessages((prev) => (prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]));
  }
  function applyReaction(messageId, reactions) {
    setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, reactions } : m)));
  }

  // Realtime delivery via SSE — instant, no polling needed for the common case.
  // Payloads are wrapped as { kind, ...} so the same channel can carry
  // different event kinds (new message, reaction update) on one connection.
  useEffect(() => {
    const es = new EventSource(`/api/conversations/${conversationId}/stream`);
    es.addEventListener("message", (e) => {
      const payload = JSON.parse(e.data);
      if (payload.kind === "message") addIfNew(payload.message);
      else if (payload.kind === "reaction") applyReaction(payload.messageId, payload.reactions);
    });
    return () => es.close();
  }, [conversationId]);

  // Slow safety-net poll in case the stream drops (spec's own suggestion:
  // "polling can remain the fallback") — SSE is the primary path now.
  useEffect(() => {
    const t = setInterval(async () => {
      const last = messages[messages.length - 1];
      const q = last ? `?after=${encodeURIComponent(last.createdAt)}` : "";
      const res = await fetch(`/api/conversations/${conversationId}/messages${q}`);
      if (res.ok) { const d = await res.json(); d.messages.forEach(addIfNew); }
    }, 10000);
    return () => clearInterval(t);
  }, [conversationId, messages]);

  async function send(e) {
    e.preventDefault();
    const text = draft.trim(); if (!text || busy) return;
    setBusy(true);
    const res = await fetch(`/api/conversations/${conversationId}/messages`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: text, parentId: replyingTo?.id || null }),
    });
    setBusy(false);
    if (res.ok) { const d = await res.json(); addIfNew(d.message); setDraft(""); setReplyingTo(null); }
  }
  async function react(messageId, type) {
    const res = await fetch(`/api/messages/${messageId}/react`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type }),
    });
    if (res.ok) {
      const d = await res.json();
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, reactions: d.reactions, myReaction: d.myReaction } : m)));
    }
  }
  async function report(id) {
    const reason = window.prompt("Report this message (optional reason):") ?? "";
    const res = await fetch("/api/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messageId: id, reason }) });
    if (res.ok) window.alert("Reported to admins.");
  }
  async function remove(id) {
    const res = await fetch("/api/admin/remove-message", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messageId: id }) });
    if (res.ok) setMessages((ms) => ms.map((m) => (m.id === id ? { ...m, removed: true, body: null } : m)));
  }

  function senderName(id) {
    return members.find((m) => m.id === id)?.name || "Someone";
  }
  function parentPreviewText(p) {
    if (p.removed) return "message removed";
    if (p.body) return p.body;
    if (p.mediaType) return { IMAGE: "📷 Photo", VIDEO: "📹 Video", VOICE: "🎤 Voice note" }[p.mediaType] || "Attachment";
    return "";
  }

  return (
    <div className="flex h-[100dvh] flex-col bg-white">
      <header className="flex items-center gap-3 border-b border-gray-200 px-3 py-2.5">
        <Link href="/messages" aria-label="Back" className="text-gray-700"><ChevronLeft /></Link>
        <Avatar name={name} image={image} size={36} />
        {isGroup ? (
          <button onClick={() => setShowInfo(true)} className="text-sm font-semibold hover:underline">{name}</button>
        ) : (
          <Link href={`/u/${otherId}`} className="text-sm font-semibold hover:underline">{name}</Link>
        )}
      </header>

      <div className="flex-1 space-y-1.5 overflow-y-auto px-4 py-4">
        {messages.length === 0 && <p className="pt-10 text-center text-sm text-gray-400">No messages yet. Say hi.</p>}
        {messages.map((m) => {
          const mine = m.senderId === me;
          return (
            <div key={m.id} className={`group flex items-center gap-2 ${mine ? "justify-end" : "justify-start"}`}>
              {!mine && !m.removed && (
                <button onClick={() => report(m.id)} className="text-[11px] text-gray-300 opacity-0 transition group-hover:opacity-100 hover:text-brand">report</button>
              )}
              {!m.removed && (
                <button onClick={() => setReplyingTo(m)} className="text-[11px] text-gray-300 opacity-0 transition group-hover:opacity-100 hover:text-brand">reply</button>
              )}
              {!m.removed && <MessageReactionButton myReaction={m.myReaction} onReact={(type) => react(m.id, type)} />}
              <div className="max-w-[75%]">
                {isGroup && !mine && !m.removed && (
                  <p className="mb-0.5 px-1 text-[11px] font-semibold text-gray-500">{senderName(m.senderId)}</p>
                )}
                {!m.removed && m.parent && (
                  <div className="mb-1 truncate rounded-lg border-l-2 border-gray-300 bg-gray-50 px-2 py-1 text-[11px] text-gray-500">
                    <span className="font-semibold">{m.parent.senderName}</span>: {parentPreviewText(m.parent)}
                  </div>
                )}
                {!m.removed && m.sharedPost ? (
                  <>
                    <PostEmbed post={m.sharedPost} className="w-64 max-w-full" />
                    {m.body && (
                      <span className={`mt-1 block whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm ${mine ? "bg-brand text-white" : "bg-gray-100 text-gray-900"}`}>
                        {m.body}
                      </span>
                    )}
                  </>
                ) : (
                  <span className={`block whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm ${m.removed ? "bg-gray-100 italic text-gray-400" : mine ? "bg-brand text-white" : "bg-gray-100 text-gray-900"}`}>
                    {m.removed ? "message removed" : m.body}
                  </span>
                )}
                <ReactionSummary reactions={m.reactions} />
              </div>
              {isAdmin && !m.removed && (
                <button onClick={() => remove(m.id)} className="text-[11px] text-red-400 opacity-0 transition group-hover:opacity-100 hover:text-red-600">remove</button>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {replyingTo && (
        <div className="flex items-center justify-between gap-2 border-t border-gray-200 bg-gray-50 px-4 py-2 text-xs">
          <span className="min-w-0 truncate text-gray-600">
            Replying to <span className="font-semibold">{senderName(replyingTo.senderId)}</span>: {parentPreviewText(replyingTo)}
          </span>
          <button onClick={() => setReplyingTo(null)} aria-label="Cancel reply" className="shrink-0 text-gray-400 hover:text-gray-700"><X /></button>
        </div>
      )}
      <form onSubmit={send} className="flex items-center gap-2 border-t border-gray-200 p-3">
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Message…" className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm outline-none focus:border-gray-400" />
        <button type="submit" disabled={!draft.trim() || busy} className="grid h-10 w-10 place-items-center rounded-full bg-brand text-white disabled:opacity-40" aria-label="Send"><Send /></button>
      </form>

      {isGroup && showInfo && (
        <GroupInfoPanel
          conversationId={conversationId} name={name} members={members} createdById={createdById}
          currentUserId={me} iAmGroupAdmin={iAmGroupAdmin} onClose={() => setShowInfo(false)}
        />
      )}
    </div>
  );
}
