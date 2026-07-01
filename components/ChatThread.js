"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Avatar from "@/components/Avatar";
import PostEmbed from "@/components/PostEmbed";
import { ChevronLeft, Send } from "@/components/icons";

export default function ChatThread({ conversationId, me, other, initial, isAdmin }) {
  const [messages, setMessages] = useState(initial);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    const t = setInterval(async () => {
      const last = messages[messages.length - 1];
      const q = last ? `?after=${encodeURIComponent(last.createdAt)}` : "";
      const res = await fetch(`/api/messages/${conversationId}${q}`);
      if (res.ok) { const d = await res.json(); if (d.messages.length) setMessages((m) => [...m, ...d.messages]); }
    }, 4000);
    return () => clearInterval(t);
  }, [conversationId, messages]);

  async function send(e) {
    e.preventDefault();
    const text = draft.trim(); if (!text || busy) return;
    setBusy(true);
    const res = await fetch("/api/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recipientId: other.id, body: text }) });
    setBusy(false);
    if (res.ok) { const d = await res.json(); setMessages((m) => [...m, d.message]); setDraft(""); }
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

  return (
    <div className="flex h-[100dvh] flex-col bg-white">
      <header className="flex items-center gap-3 border-b border-gray-200 px-3 py-2.5">
        <Link href="/messages" aria-label="Back" className="text-gray-700"><ChevronLeft /></Link>
        <Avatar name={other.name} image={other.image} size={36} />
        <Link href={`/u/${other.id}`} className="text-sm font-semibold hover:underline">{other.name}</Link>
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
              {!m.removed && m.sharedPost ? (
                <div className="max-w-[75%]">
                  <PostEmbed post={m.sharedPost} className="w-64 max-w-full" />
                  {m.body && (
                    <span className={`mt-1 block whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm ${mine ? "bg-brand text-white" : "bg-gray-100 text-gray-900"}`}>
                      {m.body}
                    </span>
                  )}
                </div>
              ) : (
                <span className={`max-w-[75%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm ${m.removed ? "bg-gray-100 italic text-gray-400" : mine ? "bg-brand text-white" : "bg-gray-100 text-gray-900"}`}>
                  {m.removed ? "message removed" : m.body}
                </span>
              )}
              {isAdmin && !m.removed && (
                <button onClick={() => remove(m.id)} className="text-[11px] text-red-400 opacity-0 transition group-hover:opacity-100 hover:text-red-600">remove</button>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="flex items-center gap-2 border-t border-gray-200 p-3">
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Message…" className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm outline-none focus:border-gray-400" />
        <button type="submit" disabled={!draft.trim() || busy} className="grid h-10 w-10 place-items-center rounded-full bg-brand text-white disabled:opacity-40" aria-label="Send"><Send /></button>
      </form>
    </div>
  );
}
