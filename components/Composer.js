"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Composer() {
  const router = useRouter();
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [isVideo, setIsVideo] = useState(false);
  const [caption, setCaption] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [held, setHeld] = useState(false);

  function onPick(e) {
    const picked = Array.from(e.target.files || []);
    setError("");
    if (picked.length === 0) { setFiles([]); setPreviews([]); return; }

    const video = picked.find((f) => f.type.startsWith("video/"));
    if (video) {
      setIsVideo(true);
      setFiles([video]);
      setPreviews([URL.createObjectURL(video)]);
    } else {
      const imgs = picked.slice(0, 10);
      setIsVideo(false);
      setFiles(imgs);
      setPreviews(imgs.map((f) => URL.createObjectURL(f)));
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (files.length === 0) { setError("Choose photos or a video first."); return; }
    setBusy(true); setError("");

    const form = new FormData();
    files.forEach((f) => form.append("media", f));
    form.append("caption", caption);

    const res = await fetch("/api/posts", { method: "POST", body: form });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Could not post. Try again.");
      setBusy(false);
      return;
    }
    const d = await res.json().catch(() => ({}));
    if (d.status === "PENDING") {
      // Held by the filter — tell the author instead of dropping them into the feed.
      setHeld(true);
      setBusy(false);
      return;
    }
    router.push(isVideo ? "/reels" : "/");
    router.refresh();
  }

  if (held) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
        <p className="mb-1 text-lg font-semibold text-amber-700">Sent for review</p>
        <p className="mb-4 text-sm text-amber-700">
          Your post will appear once a teacher or admin approves it. You can see it on your profile, marked “Pending review,” in the meantime.
        </p>
        <button onClick={() => router.push("/")} className="ig-btn">Back to feed</button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <label className="flex aspect-square w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 text-center text-sm text-gray-400">
        {previews.length === 0 ? (
          <span className="px-6">Tap to choose photos (up to 10) or one video</span>
        ) : isVideo ? (
          <video src={previews[0]} className="h-full w-full object-cover" muted />
        ) : (
          <img src={previews[0]} alt="Preview" className="h-full w-full object-cover" />
        )}
        <input type="file" accept="image/*,video/*" multiple onChange={onPick} className="hidden" />
      </label>

      {previews.length > 1 && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {previews.map((src, i) => (
            <img key={i} src={src} alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" />
          ))}
        </div>
      )}
      {isVideo && <p className="text-xs text-gray-500">This will be posted as a Reel.</p>}

      <textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Write a caption…" rows={3}
        className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand" />

      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={busy} className="ig-btn py-2.5">{busy ? "Posting…" : "Share"}</button>
    </form>
  );
}
