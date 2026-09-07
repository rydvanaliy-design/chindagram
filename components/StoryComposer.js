"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/LocaleProvider";
import { compressImage } from "@/lib/compressImage";
import { uploadOne } from "@/lib/uploadClient";

const STICKER_TYPES = ["POLL", "QUIZ", "QUESTION"];

export default function StoryComposer({ club = null }) {
  const router = useRouter();
  const { t } = useT();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [closeFriendsOnly, setCloseFriendsOnly] = useState(false);
  const [stickerType, setStickerType] = useState("");
  const [stickerQuestion, setStickerQuestion] = useState("");
  const [stickerOptions, setStickerOptions] = useState(["", ""]);
  const [stickerCorrectIndex, setStickerCorrectIndex] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onPick(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setError("");
    const small = await compressImage(f, "story");
    setFile(small);
    setPreview(URL.createObjectURL(small));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    if (!file) { setError(t("discovery.stories.chooseFirst")); return; }
    const cleanOptions = stickerOptions.map((o) => o.trim()).filter(Boolean);
    if (stickerType) {
      if (!stickerQuestion.trim()) { setError(t("discovery.stories.stickerNeedsQuestion")); return; }
      if (stickerType !== "QUESTION" && cleanOptions.length < 2) { setError(t("discovery.stories.stickerNeedsOptions")); return; }
    }
    setBusy(true);

    let uploaded;
    try {
      uploaded = await uploadOne(file, "stories", t);
    } catch (err) {
      setError(err.message || t("discovery.stories.couldNotAdd"));
      setBusy(false);
      return;
    }

    const form = new FormData();
    form.append("photoPath", uploaded.path);
    form.append("closeFriendsOnly", String(closeFriendsOnly));
    if (club) form.append("clubId", club.id);
    if (stickerType) {
      form.append("stickerType", stickerType);
      form.append("stickerQuestion", stickerQuestion.trim());
      if (stickerType !== "QUESTION") {
        form.append("stickerOptions", JSON.stringify(cleanOptions));
        if (stickerType === "QUIZ") form.append("stickerCorrectIndex", String(stickerCorrectIndex));
      }
    }

    const res = await fetch("/api/stories", { method: "POST", body: form });
    setBusy(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || t("discovery.stories.couldNotAdd"));
      return;
    }
    router.push(club ? `/clubs/${club.id}` : "/");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <label className="flex aspect-[9/16] max-h-[28rem] w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 text-center text-sm text-gray-400">
        {preview ? <img src={preview} alt="Preview" className="h-full w-full object-cover" /> : <span className="px-6">{t("discovery.stories.choosePhoto")}</span>}
        <input type="file" accept="image/*" onChange={onPick} className="hidden" />
      </label>

      {!club && (
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={closeFriendsOnly} onChange={(e) => setCloseFriendsOnly(e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
          {t("discovery.stories.closeFriendsOnly")}
        </label>
      )}

      <div>
        <label className="mb-1 block text-xs font-medium text-gray-500">{t("discovery.stories.sticker.label")}</label>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setStickerType("")}
            className={!stickerType ? "rounded-full bg-brand px-3 py-1 text-sm font-semibold text-white" : "rounded-full border border-gray-300 px-3 py-1 text-sm text-gray-600"}>
            {t("discovery.stories.sticker.none")}
          </button>
          {STICKER_TYPES.map((s) => (
            <button type="button" key={s} onClick={() => setStickerType(s)}
              className={stickerType === s ? "rounded-full bg-brand px-3 py-1 text-sm font-semibold text-white" : "rounded-full border border-gray-300 px-3 py-1 text-sm text-gray-600"}>
              {t(`discovery.stories.sticker.${s.toLowerCase()}`)}
            </button>
          ))}
        </div>
      </div>

      {stickerType && (
        <div className="space-y-2 rounded-2xl border border-gray-200 p-3">
          <input value={stickerQuestion} onChange={(e) => setStickerQuestion(e.target.value)} maxLength={200}
            placeholder={t("discovery.stories.sticker.questionPlaceholder")}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand" />
          {stickerType !== "QUESTION" && stickerOptions.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              {stickerType === "QUIZ" && (
                <input type="radio" name="correct" checked={stickerCorrectIndex === i} onChange={() => setStickerCorrectIndex(i)}
                  aria-label={t("discovery.stories.sticker.markCorrect")} className="h-4 w-4 shrink-0" />
              )}
              <input value={opt} maxLength={80}
                onChange={(e) => setStickerOptions((arr) => arr.map((v, j) => (j === i ? e.target.value : v)))}
                placeholder={t("posts.composer.pollOptionPlaceholder", { number: i + 1 })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand" />
              {stickerOptions.length > 2 && (
                <button type="button" onClick={() => setStickerOptions((arr) => arr.filter((_, j) => j !== i))}
                  className="text-gray-400 hover:text-red-600" aria-label={t("posts.composer.removeOption")}>✕</button>
              )}
            </div>
          ))}
          {stickerType !== "QUESTION" && stickerOptions.length < 6 && (
            <button type="button" onClick={() => setStickerOptions((arr) => [...arr, ""])} className="text-sm font-semibold text-brand">
              {t("posts.composer.addOption")}
            </button>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={busy} className="ig-btn py-2.5">{busy ? t("posts.composer.posting") : t("posts.composer.share")}</button>
    </form>
  );
}
