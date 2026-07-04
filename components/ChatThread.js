"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Avatar from "@/components/Avatar";
import PostEmbed from "@/components/PostEmbed";
import GroupInfoPanel from "@/components/GroupInfoPanel";
import MessageReactionButton from "@/components/MessageReactionButton";
import { REACTION_EMOJI } from "@/lib/reactions";
import { ChevronLeft, Send, X } from "@/components/icons";
import { useT } from "@/lib/i18n/LocaleProvider";

function ReactionSummary({ reactions }) {
  const entries = Object.entries(reactions || {}).filter(([, c]) => c > 0);
  if (entries.length === 0) return null;
  const total = entries.reduce((s, [, c]) => s + c, 0);
  const top = entries.sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t]) => REACTION_EMOJI[t]).join("");
  return <span className="mt-0.5 inline-block rounded-full border border-gray-200 bg-white px-1.5 py-0.5 text-[11px] shadow-sm">{top} {total}</span>;
}

function MessageMedia({ url, type }) {
  if (type === "IMAGE") return <img src={url} alt="" className="max-h-64 max-w-full rounded-2xl object-cover" />;
  if (type === "VIDEO") return <video src={url} controls className="max-h-64 max-w-full rounded-2xl" />;
  if (type === "VOICE") return <audio src={url} controls className="w-56" />;
  return null;
}

export default function ChatThread({ conversationId, me, initial, isAdmin, isGroup, name, image, otherId, members, createdById, iAmGroupAdmin }) {
  const { t } = useT();
  const [messages, setMessages] = useState(initial);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [attachment, setAttachment] = useState(null); // { file, previewUrl, kind: "media" | "voice", isVideo }
  const [recording, setRecording] = useState(false);
  const [readState, setReadState] = useState(() => new Map(members.map((m) => [m.id, m.lastReadAt])));
  const bottomRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  function addIfNew(incoming) {
    setMessages((prev) => (prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]));
  }
  function applyReaction(messageId, reactions) {
    setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, reactions } : m)));
  }

  // Realtime delivery via SSE — instant, no polling needed for the common case.
  // Payloads are wrapped as { kind, ...} so the same channel can carry
  // different event kinds (new message, reaction update, read receipt).
  useEffect(() => {
    const es = new EventSource(`/api/conversations/${conversationId}/stream`);
    es.addEventListener("message", (e) => {
      const payload = JSON.parse(e.data);
      if (payload.kind === "message") addIfNew(payload.message);
      else if (payload.kind === "reaction") applyReaction(payload.messageId, payload.reactions);
      else if (payload.kind === "read") setReadState((prev) => new Map(prev).set(payload.userId, payload.lastReadAt));
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

  function pickFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachment({ file, previewUrl: URL.createObjectURL(file), kind: "media", isVideo: file.type.startsWith("video/") });
  }

  async function toggleRecording() {
    if (recording) { recorderRef.current?.stop(); return; }
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      window.alert(t("messages.thread.micError"));
      return;
    }
    const recorder = new MediaRecorder(stream);
    chunksRef.current = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const file = new File([blob], "voice-note.webm", { type: "audio/webm" });
      setAttachment({ file, previewUrl: URL.createObjectURL(blob), kind: "voice" });
      stream.getTracks().forEach((t) => t.stop());
      setRecording(false);
    };
    recorder.start();
    recorderRef.current = recorder;
    setRecording(true);
  }

  async function send(e) {
    e.preventDefault();
    const text = draft.trim();
    if (!text && !attachment) return;
    if (busy) return;
    setBusy(true);

    let mediaUrl = null, mediaType = null;
    if (attachment) {
      const form = new FormData();
      form.append("file", attachment.file);
      form.append("kind", attachment.kind === "voice" ? "voice" : "media");
      const res = await fetch("/api/messages/upload", { method: "POST", body: form });
      if (!res.ok) { setBusy(false); window.alert(t("messages.thread.uploadError")); return; }
      const d = await res.json();
      mediaUrl = d.url; mediaType = d.type;
    }

    const res = await fetch(`/api/conversations/${conversationId}/messages`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: text, parentId: replyingTo?.id || null, mediaUrl, mediaType }),
    });
    setBusy(false);
    if (res.ok) {
      const d = await res.json();
      addIfNew(d.message); setDraft(""); setReplyingTo(null); setAttachment(null);
    }
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
    const reason = window.prompt(t("messages.thread.reportPrompt")) ?? "";
    const res = await fetch("/api/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messageId: id, reason }) });
    if (res.ok) window.alert(t("messages.thread.reported"));
  }
  async function remove(id) {
    const res = await fetch("/api/admin/remove-message", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messageId: id }) });
    if (res.ok) setMessages((ms) => ms.map((m) => (m.id === id ? { ...m, removed: true, body: null } : m)));
  }

  function senderName(id) {
    return members.find((m) => m.id === id)?.name || t("messages.thread.someone");
  }
  function parentPreviewText(p) {
    if (p.removed) return t("messages.thread.messageRemoved");
    if (p.body) return p.body;
    if (p.mediaType) return { IMAGE: t("messages.media.photo"), VIDEO: t("messages.media.video"), VOICE: t("messages.media.voice") }[p.mediaType] || t("messages.media.attachment");
    return "";
  }
  // Read receipt for the most recent message you sent — WhatsApp/Instagram
  // style "Seen" rather than a per-message tick, kept to the last message
  // in the thread to avoid a noisy receipt under every single bubble.
  function seenText(msg) {
    if (msg.senderId !== me) return null;
    const readers = members.filter((m) => {
      const at = readState.get(m.id);
      return m.id !== me && at && new Date(at) >= new Date(msg.createdAt);
    });
    if (readers.length === 0) return null;
    return isGroup ? t("messages.thread.seenByCount", { count: readers.length }) : t("messages.thread.seen");
  }

  return (
    <div className="flex h-[100dvh] flex-col bg-white">
      <header className="flex items-center gap-3 border-b border-gray-200 px-3 py-2.5">
        <Link href="/messages" aria-label={t("messages.thread.back")} className="text-gray-700"><ChevronLeft /></Link>
        <Avatar name={name} image={image} size={36} />
        {isGroup ? (
          <button onClick={() => setShowInfo(true)} className="text-sm font-semibold hover:underline">{name}</button>
        ) : (
          <Link href={`/u/${otherId}`} className="text-sm font-semibold hover:underline">{name}</Link>
        )}
      </header>

      <div className="flex-1 space-y-1.5 overflow-y-auto px-4 py-4">
        {messages.length === 0 && <p className="pt-10 text-center text-sm text-gray-400">{t("messages.thread.empty")}</p>}
        {messages.map((m, i) => {
          const mine = m.senderId === me;
          const seen = i === messages.length - 1 ? seenText(m) : null;
          return (
            <div key={m.id} className="flex flex-col" style={{ alignItems: mine ? "flex-end" : "flex-start" }}>
              <div className={`group flex items-center gap-2 ${mine ? "justify-end" : "justify-start"}`}>
                {!mine && !m.removed && (
                  <button onClick={() => report(m.id)} className="text-[11px] text-gray-300 opacity-0 transition group-hover:opacity-100 hover:text-brand">{t("messages.thread.report")}</button>
                )}
                {!m.removed && (
                  <button onClick={() => setReplyingTo(m)} className="text-[11px] text-gray-300 opacity-0 transition group-hover:opacity-100 hover:text-brand">{t("messages.thread.reply")}</button>
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
                  {!m.removed && m.storyReply ? (
                    <>
                      <div className="mb-1 flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-2 text-xs text-gray-500">
                        {!m.storyReply.unavailable && m.storyReply.imageUrl && (
                          <img src={m.storyReply.imageUrl} alt="" className="h-10 w-10 rounded-lg object-cover" />
                        )}
                        <span>{m.storyReply.unavailable ? t("messages.thread.storyUnavailable") : t("messages.thread.repliedToStory")}</span>
                      </div>
                      {m.body && (
                        <span className={`mt-1 block whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm ${mine ? "bg-brand text-white" : "bg-gray-100 text-gray-900"}`}>
                          {m.body}
                        </span>
                      )}
                    </>
                  ) : !m.removed && m.sharedPost ? (
                    <>
                      <PostEmbed post={m.sharedPost} className="w-64 max-w-full" />
                      {m.body && (
                        <span className={`mt-1 block whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm ${mine ? "bg-brand text-white" : "bg-gray-100 text-gray-900"}`}>
                          {m.body}
                        </span>
                      )}
                    </>
                  ) : !m.removed && m.mediaUrl ? (
                    <>
                      <MessageMedia url={m.mediaUrl} type={m.mediaType} />
                      {m.body && (
                        <span className={`mt-1 block whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm ${mine ? "bg-brand text-white" : "bg-gray-100 text-gray-900"}`}>
                          {m.body}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className={`block whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm ${m.removed ? "bg-gray-100 italic text-gray-400" : mine ? "bg-brand text-white" : "bg-gray-100 text-gray-900"}`}>
                      {m.removed ? t("messages.thread.messageRemoved") : m.body}
                    </span>
                  )}
                  <ReactionSummary reactions={m.reactions} />
                </div>
                {isAdmin && !m.removed && (
                  <button onClick={() => remove(m.id)} className="text-[11px] text-red-400 opacity-0 transition group-hover:opacity-100 hover:text-red-600">{t("messages.thread.remove")}</button>
                )}
              </div>
              {seen && <p className="mt-0.5 px-1 text-[11px] text-gray-400">{seen}</p>}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {replyingTo && (
        <div className="flex items-center justify-between gap-2 border-t border-gray-200 bg-gray-50 px-4 py-2 text-xs">
          <span className="min-w-0 truncate text-gray-600">
            {t("messages.thread.replyingTo", { name: senderName(replyingTo.senderId) })}: {parentPreviewText(replyingTo)}
          </span>
          <button onClick={() => setReplyingTo(null)} aria-label={t("messages.thread.cancelReply")} className="shrink-0 text-gray-400 hover:text-gray-700"><X /></button>
        </div>
      )}
      {attachment && (
        <div className="flex items-center gap-2 border-t border-gray-200 bg-gray-50 px-4 py-2">
          {attachment.kind === "voice" ? (
            <audio src={attachment.previewUrl} controls className="h-8 flex-1" />
          ) : attachment.isVideo ? (
            <video src={attachment.previewUrl} className="h-12 w-12 rounded-lg object-cover" muted />
          ) : (
            <img src={attachment.previewUrl} alt="" className="h-12 w-12 rounded-lg object-cover" />
          )}
          <button onClick={() => setAttachment(null)} aria-label={t("messages.thread.removeAttachment")} className="ml-auto shrink-0 text-gray-400 hover:text-gray-700"><X /></button>
        </div>
      )}
      <form onSubmit={send} className="flex items-center gap-2 border-t border-gray-200 p-3">
        <label className="shrink-0 cursor-pointer text-lg" title={t("messages.thread.attachPhotoVideo")}>
          🖼️
          <input type="file" accept="image/*,video/*" onChange={pickFile} className="hidden" aria-label={t("messages.thread.attachPhotoVideo")} />
        </label>
        <button type="button" onClick={toggleRecording} title={recording ? t("messages.thread.stopRecording") : t("messages.thread.recordVoiceNote")}
          aria-label={recording ? t("messages.thread.stopRecording") : t("messages.thread.recordVoiceNote")}
          className={`shrink-0 text-lg ${recording ? "animate-pulse text-red-500" : ""}`}>
          {recording ? "⏺️" : "🎤"}
        </button>
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={t("messages.thread.composerPlaceholder")} className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm outline-none focus:border-gray-400" />
        <button type="submit" disabled={(!draft.trim() && !attachment) || busy} className="grid h-10 w-10 place-items-center rounded-full bg-brand text-white disabled:opacity-40" aria-label={t("messages.thread.send")}><Send /></button>
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
