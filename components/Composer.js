"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/postkinds";
import { useT } from "@/lib/i18n/LocaleProvider";
import { useAiEnabled } from "@/lib/useAiEnabled";

const DOC_ACCEPT = ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,application/pdf,text/plain";

export default function Composer({ isStaff = false, clubId = null }) {
  const router = useRouter();
  const { t } = useT();
  const aiEnabled = useAiEnabled();
  const [aiBusy, setAiBusy] = useState(false);
  // Post types the composer can create. More are added in later parts.
  const TYPES = [
    { key: "photo", label: t("posts.composer.types.photo") },
    { key: "text", label: t("posts.composer.types.text") },
    { key: "link", label: t("posts.composer.types.link") },
    { key: "poll", label: t("posts.composer.types.poll") },
    { key: "audio", label: t("posts.composer.types.audio") },
    { key: "document", label: t("posts.composer.types.document") },
  ];
  const [type, setType] = useState("photo");
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [altTexts, setAltTexts] = useState([]);
  const [isVideo, setIsVideo] = useState(false);
  const [caption, setCaption] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [attachment, setAttachment] = useState(null);
  const [collaborator, setCollaborator] = useState("");
  const [category, setCategory] = useState("NONE");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [held, setHeld] = useState(false);

  function onPick(e) {
    const picked = Array.from(e.target.files || []);
    setError("");
    if (picked.length === 0) { setFiles([]); setPreviews([]); setAltTexts([]); return; }
    const video = picked.find((f) => f.type.startsWith("video/"));
    if (video) {
      setIsVideo(true);
      setFiles([video]);
      setPreviews([URL.createObjectURL(video)]);
      setAltTexts([]);
    } else {
      const imgs = picked.slice(0, 10);
      setIsVideo(false);
      setFiles(imgs);
      setPreviews(imgs.map((f) => URL.createObjectURL(f)));
      setAltTexts(imgs.map(() => ""));
    }
  }

  function onAltTextChange(i, value) {
    setAltTexts((arr) => arr.map((v, j) => (j === i ? value : v)));
  }

  // One button covers both spec asks: an empty caption gets a fresh
  // suggestion from a short hint; a caption that already has a draft gets
  // lightly polished instead.
  async function useAiHelper() {
    setAiBusy(true);
    try {
      if (!caption.trim()) {
        const hint = window.prompt(t("posts.composer.aiHintPrompt"));
        if (!hint || !hint.trim()) { setAiBusy(false); return; }
        const res = await fetch("/api/ai/caption", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hint: hint.trim() }) });
        const d = await res.json().catch(() => ({}));
        if (res.ok) setCaption(d.suggestion); else setError(d.error || t("posts.composer.aiError"));
      } else {
        const res = await fetch("/api/ai/assist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ draft: caption }) });
        const d = await res.json().catch(() => ({}));
        if (res.ok) setCaption(d.suggestion); else setError(d.error || t("posts.composer.aiError"));
      }
    } finally {
      setAiBusy(false);
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    if (type === "photo" && files.length === 0) { setError(t("posts.composer.errors.choosePhotos")); return; }
    if (type === "text" && !caption.trim()) { setError(t("posts.composer.errors.writeSomething")); return; }
    if (type === "link" && !linkUrl.trim()) { setError(t("posts.composer.errors.addLink")); return; }
    if ((type === "audio" || type === "document") && !attachment) { setError(t("posts.composer.errors.chooseFile")); return; }
    const cleanOptions = pollOptions.map((o) => o.trim()).filter(Boolean);
    if (type === "poll") {
      if (!caption.trim()) { setError(t("posts.composer.errors.addPollQuestion")); return; }
      if (cleanOptions.length < 2) { setError(t("posts.composer.errors.pollNeedsTwoOptions")); return; }
    }
    setBusy(true);

    const form = new FormData();
    form.append("kind", type === "photo" ? "" : type.toUpperCase());
    form.append("caption", caption);
    form.append("category", category);
    if (type === "link") form.append("linkUrl", linkUrl);
    if (type === "poll") cleanOptions.forEach((o) => form.append("option", o));
    if (type === "photo") {
      files.forEach((f) => form.append("media", f));
      if (!isVideo) form.append("altTexts", JSON.stringify(altTexts));
    }
    if (type === "audio" || type === "document") form.append("media", attachment);
    if (collaborator.trim()) form.append("collaborator", collaborator.trim());
    if (clubId) form.append("clubId", clubId);

    const res = await fetch("/api/posts", { method: "POST", body: form });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || t("posts.composer.errors.generic"));
      setBusy(false);
      return;
    }
    const d = await res.json().catch(() => ({}));
    if (d.status === "PENDING") {
      setHeld(true);
      setBusy(false);
      return;
    }
    if (clubId) {
      // Posting to a club keeps you on the same page — reset the form
      // instead of leaving it stuck on "Posting…".
      setType("photo"); setFiles([]); setPreviews([]); setAltTexts([]); setIsVideo(false);
      setCaption(""); setLinkUrl(""); setPollOptions(["", ""]); setAttachment(null);
      setCollaborator(""); setCategory("NONE"); setBusy(false);
    }
    router.push(clubId ? `/clubs/${clubId}` : type === "photo" && isVideo ? "/reels" : "/");
    router.refresh();
  }

  if (held) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
        <p className="mb-1 text-lg font-semibold text-amber-700">{t("posts.composer.heldTitle")}</p>
        <p className="mb-4 text-sm text-amber-700">
          {t("posts.composer.heldBody")}
        </p>
        <button onClick={() => router.push(clubId ? `/clubs/${clubId}` : "/")} className="ig-btn">{t("posts.composer.back")}</button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {/* Type picker */}
      <div className="flex flex-wrap gap-2">
        {TYPES.map((typeOption) => (
          <button type="button" key={typeOption.key} onClick={() => { setType(typeOption.key); setError(""); }}
            className={type === typeOption.key
              ? "rounded-full bg-brand px-3 py-1 text-sm font-semibold text-white"
              : "rounded-full border border-gray-300 px-3 py-1 text-sm text-gray-600"}>
            {typeOption.label}
          </button>
        ))}
      </div>

      {type === "photo" && (
        <>
          <label className="flex aspect-square w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 text-center text-sm text-gray-400">
            {previews.length === 0 ? (
              <span className="px-6">{t("posts.composer.choosePhotosHint")}</span>
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
          {!isVideo && previews.length > 0 && (
            <div className="space-y-2">
              {previews.map((src, i) => (
                <div key={i} className="flex items-center gap-2">
                  <img src={src} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                  <input
                    value={altTexts[i] || ""}
                    onChange={(e) => onAltTextChange(i, e.target.value)}
                    aria-label={t("posts.composer.altTextLabel")}
                    placeholder={t("posts.composer.altTextPlaceholder")}
                    className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs outline-none focus:border-brand"
                  />
                </div>
              ))}
            </div>
          )}
          {isVideo && <p className="text-xs text-gray-500">{t("posts.composer.willBeReel")}</p>}
        </>
      )}

      {type === "link" && (
        <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder={t("posts.composer.linkPlaceholder")} inputMode="url"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand" />
      )}

      {(type === "audio" || type === "document") && (
        <label className="flex cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
          {attachment ? (
            <span className="truncate font-medium text-gray-800">{type === "audio" ? "🎵 " : "📄 "}{attachment.name}</span>
          ) : (
            <span>{type === "audio" ? t("posts.composer.chooseAudio") : t("posts.composer.chooseDocument")}</span>
          )}
          <input type="file" accept={type === "audio" ? "audio/*" : DOC_ACCEPT}
            onChange={(e) => { setAttachment(e.target.files?.[0] || null); setError(""); }} className="hidden" />
        </label>
      )}

      <div>
        <textarea value={caption} onChange={(e) => setCaption(e.target.value)}
          placeholder={type === "text" ? t("posts.composer.textPlaceholder") : type === "poll" ? t("posts.composer.pollQuestionPlaceholder") : t("posts.composer.captionPlaceholder")} rows={type === "poll" ? 2 : 3}
          className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand" />
        {aiEnabled && type !== "poll" && (
          <button type="button" onClick={useAiHelper} disabled={aiBusy}
            className="mt-1 text-xs font-semibold text-brand disabled:opacity-50">
            {aiBusy ? t("posts.composer.aiBusy") : caption.trim() ? t("posts.composer.aiImprove") : t("posts.composer.aiSuggest")}
          </button>
        )}
      </div>

      {type === "poll" && (
        <div className="space-y-2">
          {pollOptions.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input value={opt} maxLength={120}
                onChange={(e) => setPollOptions((arr) => arr.map((v, j) => (j === i ? e.target.value : v)))}
                placeholder={t("posts.composer.pollOptionPlaceholder", { number: i + 1 })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand" />
              {pollOptions.length > 2 && (
                <button type="button" onClick={() => setPollOptions((arr) => arr.filter((_, j) => j !== i))}
                  className="text-gray-400 hover:text-red-600" title={t("posts.composer.removeOption")} aria-label={t("posts.composer.removeOption")}>✕</button>
              )}
            </div>
          ))}
          {pollOptions.length < 6 && (
            <button type="button" onClick={() => setPollOptions((arr) => [...arr, ""])}
              className="text-sm font-semibold text-brand">{t("posts.composer.addOption")}</button>
          )}
        </div>
      )}

      {/* Optional co-author */}
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">{t("posts.composer.coAuthorLabel")} <span className="text-gray-400">{t("posts.composer.coAuthorHint")}</span></label>
        <div className="flex items-center gap-1">
          <span className="text-gray-400">@</span>
          <input value={collaborator} onChange={(e) => setCollaborator(e.target.value)} placeholder={t("posts.composer.coAuthorPlaceholder")}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand" />
        </div>
      </div>

      {/* School content type — teachers/admins only */}
      {isStaff && (
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">{t("posts.composer.schoolContentType")}</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand">
            <option value="NONE">{t("posts.composer.regularPost")}</option>
            {CATEGORIES.filter((c) => c !== "NONE").map((c) => (
              <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
            ))}
          </select>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={busy} className="ig-btn py-2.5">{busy ? t("posts.composer.posting") : t("posts.composer.share")}</button>
    </form>
  );
}
