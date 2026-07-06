"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/Avatar";
import SafeImage from "@/components/SafeImage";
import { X } from "@/components/icons";
import { useT } from "@/lib/i18n/LocaleProvider";

// Read-only replay of a saved highlight (no reply/sticker interaction — this
// is a showcase of past stories, not a live one). Owner can rename/delete
// the highlight, or remove individual stories from it.
export default function HighlightViewer({ highlightId, name, owner, stories, isOwner, backHref }) {
  const { t } = useT();
  const router = useRouter();
  const [i, setI] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    function onKeyDown(e) { if (e.key === "Escape") router.push(backHref); }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [router, backHref]);

  const story = stories[i];
  if (!story) { router.push(backHref); return null; }

  function next() {
    if (i + 1 < stories.length) setI(i + 1);
    else router.push(backHref);
  }

  async function removeFromHighlight() {
    if (!window.confirm(t("profile.highlight.removeConfirm"))) return;
    setBusy(true);
    const res = await fetch(`/api/stories/${story.id}/highlight`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ highlightId: null }),
    });
    setBusy(false);
    if (res.ok) router.refresh();
  }

  async function deleteHighlight() {
    if (!window.confirm(t("profile.highlight.deleteConfirm"))) return;
    setBusy(true);
    const res = await fetch(`/api/highlights/${highlightId}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) router.push(backHref);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black" onClick={next}>
      <div className="absolute left-0 right-0 top-0 flex items-center gap-3 p-4 text-white">
        <Avatar name={owner.name} image={owner.image} size={32} />
        <span className="text-sm font-semibold">{owner.name} · {name}</span>
        {isOwner && (
          <button onClick={(e) => { e.stopPropagation(); removeFromHighlight(); }} disabled={busy} className="ml-auto text-xs font-semibold">
            {t("profile.highlight.removeStory")}
          </button>
        )}
        {isOwner && (
          <button onClick={(e) => { e.stopPropagation(); deleteHighlight(); }} disabled={busy} className="text-xs font-semibold text-red-300">
            {t("profile.highlight.deleteHighlight")}
          </button>
        )}
        <button onClick={(e) => { e.stopPropagation(); router.push(backHref); }} aria-label={t("discovery.stories.close")}><X /></button>
      </div>
      <SafeImage src={story.imageUrl} alt="" className="max-h-[85vh] max-w-full object-contain" />
    </div>
  );
}
