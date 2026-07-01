"use client";
import { useState } from "react";
import { BUILTIN_GIFS } from "@/lib/gifs";

// The comment box at the bottom of a post: text, plus an optional attached
// image (uploaded) or a small built-in GIF — not both at once.
export default function CommentComposer({ onSubmit }) {
  const [draft, setDraft] = useState("");
  const [attachment, setAttachment] = useState(null); // { previewUrl, file? , gifUrl?, type }
  const [showGifs, setShowGifs] = useState(false);
  const [busy, setBusy] = useState(false);

  function pickImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachment({ type: "IMAGE", file, previewUrl: URL.createObjectURL(file) });
    setShowGifs(false);
  }
  function pickGif(gif) {
    setAttachment({ type: "GIF", gifUrl: gif.url, previewUrl: gif.url, label: gif.label });
    setShowGifs(false);
  }

  async function submit(e) {
    e.preventDefault();
    const text = draft.trim();
    if ((!text && !attachment) || busy) return;
    setBusy(true);

    let mediaUrl = null, mediaType = null;
    if (attachment?.type === "GIF") {
      mediaUrl = attachment.gifUrl; mediaType = "GIF";
    } else if (attachment?.type === "IMAGE") {
      const form = new FormData();
      form.append("image", attachment.file);
      const res = await fetch("/api/comments/upload-image", { method: "POST", body: form });
      if (!res.ok) { setBusy(false); window.alert("Could not upload image."); return; }
      const d = await res.json();
      mediaUrl = d.url; mediaType = "IMAGE";
    }

    await onSubmit(text, mediaUrl, mediaType);
    setBusy(false);
    setDraft("");
    setAttachment(null);
  }

  return (
    <div className="border-t border-gray-100 px-4 py-3">
      {attachment && (
        <div className="relative mb-2 inline-block">
          <img src={attachment.previewUrl} alt="" className="h-16 w-16 rounded-lg object-cover" />
          <button type="button" onClick={() => setAttachment(null)}
            className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-gray-800 text-xs text-white">✕</button>
        </div>
      )}

      {showGifs && (
        <div className="mb-2 flex flex-wrap gap-2 rounded-xl border border-gray-200 bg-gray-50 p-2">
          {BUILTIN_GIFS.map((g) => (
            <button key={g.key} type="button" onClick={() => pickGif(g)} title={g.label}
              className="flex flex-col items-center gap-1 rounded-lg p-1 hover:bg-white">
              <img src={g.url} alt={g.label} className="h-12 w-12 rounded-md object-cover" />
              <span className="text-[10px] text-gray-500">{g.label}</span>
            </button>
          ))}
        </div>
      )}

      <form onSubmit={submit} className="flex items-center gap-2">
        <label className="shrink-0 cursor-pointer text-lg" title="Attach an image">
          🖼️
          <input type="file" accept="image/*" onChange={pickImage} className="hidden" />
        </label>
        <button type="button" onClick={() => setShowGifs((v) => !v)} title="Add a GIF"
          className="shrink-0 rounded px-1.5 py-0.5 text-xs font-bold text-gray-500 hover:bg-gray-100">GIF</button>
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add a comment…"
          className="flex-1 text-sm outline-none placeholder:text-gray-400" />
        <button type="submit" disabled={(!draft.trim() && !attachment) || busy} className="shrink-0 text-sm font-semibold text-brand disabled:text-gray-300">
          {busy ? "Posting…" : "Post"}
        </button>
      </form>
    </div>
  );
}
