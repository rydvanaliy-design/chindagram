"use client";
import { useState } from "react";
import Link from "next/link";
import Avatar from "@/components/Avatar";
import RichText from "@/components/RichText";

function ago(iso) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60); if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

// Profile wall: anyone can post; the author or wall owner can delete; teachers/
// admins moderate. Wall posts are filtered by the auto-moderator like everything.
export default function Wall({ ownerId, ownerName, viewerId, isOwner, canModerate, initial }) {
  const [posts, setPosts] = useState(initial);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  async function submit(e) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || busy) return;
    setBusy(true); setNote("");
    const res = await fetch("/api/wall", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ownerId, body }),
    });
    setBusy(false);
    if (!res.ok) { const d = await res.json().catch(() => ({})); setNote(d.error || "Could not post."); return; }
    const d = await res.json();
    setPosts((ps) => [d.wallPost, ...ps]);
    setDraft("");
    if (d.status === "PENDING") setNote("Sent for review — only you can see it until it's approved.");
  }

  async function remove(id) {
    if (!window.confirm("Remove this wall post?")) return;
    const res = await fetch(`/api/wall/${id}`, { method: "DELETE" });
    if (res.ok) setPosts((ps) => ps.filter((p) => p.id !== id));
  }

  async function report(id) {
    const reason = window.prompt("Tell admins what's wrong (optional):") ?? "";
    const res = await fetch("/api/reports", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallPostId: id, reason }),
    });
    if (res.ok) window.alert("Thanks — this was flagged for admins.");
  }

  return (
    <div>
      <form onSubmit={submit} className="mb-3 rounded-xl border border-gray-200 bg-white p-3">
        <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={2}
          placeholder={isOwner ? "Post on your own wall…" : `Write something on ${ownerName}'s wall…`}
          className="w-full resize-none text-sm outline-none placeholder:text-gray-400" />
        <div className="mt-1 flex items-center justify-between">
          {note ? <span className="text-xs text-amber-600">{note}</span> : <span />}
          <button disabled={busy || !draft.trim()} className="text-sm font-semibold text-brand disabled:text-gray-300">Post</button>
        </div>
      </form>

      {posts.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400">No wall posts yet.</p>
      ) : (
        <ul className="space-y-2">
          {posts.map((p) => {
            const canRemove = p.mine || isOwner || canModerate;
            return (
              <li key={p.id} className="group rounded-xl border border-gray-200 bg-white p-3">
                <div className="flex items-start gap-2">
                  <Link href={`/u/${p.author.id}`}><Avatar name={p.author.name} image={p.author.image} size={28} /></Link>
                  <div className="min-w-0 flex-1 text-sm">
                    <Link href={`/u/${p.author.id}`} className="font-semibold hover:underline">{p.author.name}</Link>
                    <span className="ml-2 text-xs text-gray-400">{ago(p.createdAt)}</span>
                    {p.pending && <span className="ml-1 text-[11px] font-semibold text-amber-600">· pending review</span>}
                    <p className="text-gray-800"><RichText text={p.body} /></p>
                  </div>
                  <span className="flex shrink-0 items-center gap-2 opacity-0 transition group-hover:opacity-100">
                    {!p.mine && <button onClick={() => report(p.id)} className="text-[11px] font-medium text-gray-400 hover:text-brand">report</button>}
                    {canRemove && <button onClick={() => remove(p.id)} className="text-[11px] font-semibold text-red-600 hover:underline">remove</button>}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
