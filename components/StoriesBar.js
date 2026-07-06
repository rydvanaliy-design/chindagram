"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Avatar from "@/components/Avatar";
import PostEmbed from "@/components/PostEmbed";
import SafeImage from "@/components/SafeImage";
import { X, Bookmark } from "@/components/icons";
import { REACTIONS, REACTION_EMOJI } from "@/lib/reactions";
import { useT } from "@/lib/i18n/LocaleProvider";

export default function StoriesBar({ groups, me, newStoryHref = "/stories/new", showAdd = true }) {
  const { t } = useT();
  const [viewer, setViewer] = useState(null); // { gi, si }
  const [breakdown, setBreakdown] = useState(null); // sticker results for the active story, once answered
  const [myAnswer, setMyAnswer] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [busy, setBusy] = useState(false);
  const [highlights, setHighlights] = useState(null);
  const [pickingHighlight, setPickingHighlight] = useState(false);

  useEffect(() => {
    if (!viewer) return;
    function onKeyDown(e) { if (e.key === "Escape") setViewer(null); }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [viewer]);

  function openGroup(gi) { setViewer({ gi, si: 0 }); resetPerStoryState(); }
  function next() {
    if (!viewer) return;
    const group = groups[viewer.gi];
    resetPerStoryState();
    if (viewer.si + 1 < group.stories.length) setViewer({ ...viewer, si: viewer.si + 1 });
    else if (viewer.gi + 1 < groups.length) setViewer({ gi: viewer.gi + 1, si: 0 });
    else setViewer(null);
  }
  function resetPerStoryState() {
    setBreakdown(null); setMyAnswer(null); setReplyText(""); setQuestionText(""); setPickingHighlight(false);
  }

  const active = viewer ? groups[viewer.gi].stories[viewer.si] : null;
  const activeAuthor = viewer ? groups[viewer.gi].author : null;
  const isOwn = activeAuthor && activeAuthor.id === me.id;
  const stickerOptions = active?.stickerOptions ? JSON.parse(active.stickerOptions) : [];

  async function respond(optionIndex, text) {
    if (busy) return;
    setBusy(true);
    const res = await fetch(`/api/stories/${active.id}/respond`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ optionIndex, text }),
    });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      setMyAnswer(text != null ? text : optionIndex);
      if (d.breakdown) setBreakdown(d.breakdown);
    }
  }

  async function sendReply(body) {
    if (!body.trim() || busy) return;
    setBusy(true);
    const res = await fetch(`/api/stories/${active.id}/reply`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body }),
    });
    setBusy(false);
    if (res.ok) setReplyText("");
  }

  async function loadHighlights() {
    if (highlights) return;
    const res = await fetch(`/api/stories/${active.id}/highlight`);
    setHighlights(res.ok ? (await res.json()).highlights : []);
  }

  async function assignHighlight(highlightId) {
    setBusy(true);
    const res = await fetch(`/api/stories/${active.id}/highlight`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ highlightId }),
    });
    setBusy(false);
    if (res.ok) setPickingHighlight(false);
  }

  async function createHighlight() {
    const name = window.prompt(t("discovery.stories.highlightNamePrompt"));
    if (!name || !name.trim()) return;
    setBusy(true);
    const res = await fetch("/api/highlights", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name.trim() }) });
    setBusy(false);
    if (res.ok) {
      const d = await res.json();
      setHighlights((hs) => [d.highlight, ...(hs || [])]);
      await assignHighlight(d.highlight.id);
    }
  }

  const totalResponses = breakdown ? Object.values(breakdown).reduce((a, b) => a + b, 0) : 0;

  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="no-scrollbar mx-auto flex max-w-xl gap-4 overflow-x-auto px-4 py-3">
        {showAdd && (
          <Link href={newStoryHref} aria-label={t("discovery.stories.addStory")} className="flex w-16 shrink-0 flex-col items-center gap-1">
            <span className="relative">
              <Avatar name={me.name} image={me.image} size={56} />
              <span className="absolute -bottom-0.5 -right-0.5 grid h-5 w-5 place-items-center rounded-full border-2 border-white bg-brand text-xs font-bold text-white">+</span>
            </span>
            <span className="w-16 truncate text-center text-xs text-gray-600">{t("discovery.stories.yourStory")}</span>
          </Link>
        )}

        {groups.map((g, gi) => (
          <button key={g.author.id} onClick={() => openGroup(gi)} aria-label={t("discovery.stories.viewStory", { name: g.author.name })} className="flex w-16 shrink-0 flex-col items-center gap-1">
            <Avatar name={g.author.name} image={g.author.image} size={56} ring />
            <span className="w-16 truncate text-center text-xs text-gray-700">{g.author.name}</span>
          </button>
        ))}
      </div>

      {/* Full-screen viewer */}
      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black" onClick={next}>
          <div className="absolute left-0 right-0 top-0 flex items-center gap-3 p-4 text-white">
            <Avatar name={activeAuthor.name} image={activeAuthor.image} size={32} />
            <span className="text-sm font-semibold">{activeAuthor.name}</span>
            {isOwn && (
              <button onClick={(e) => { e.stopPropagation(); setPickingHighlight((v) => !v); loadHighlights(); }} className="ml-auto" aria-label={t("discovery.stories.saveToHighlight")}>
                <Bookmark />
              </button>
            )}
            <button onClick={(e) => { e.stopPropagation(); setViewer(null); }} className={isOwn ? "" : "ml-auto"} aria-label={t("discovery.stories.close")}><X /></button>
          </div>

          {active.repostOf ? (
            <div className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
              <PostEmbed post={active.repostOf} />
            </div>
          ) : (
            <SafeImage src={active.imageUrl} alt="" className="max-h-[85vh] max-w-full object-contain" />
          )}

          {isOwn && pickingHighlight && (
            <div className="absolute right-4 top-16 z-10 w-56 rounded-xl border border-gray-200 bg-white py-1 shadow-lg" onClick={(e) => e.stopPropagation()}>
              <p className="px-4 pb-1 pt-2 text-xs font-semibold text-gray-400">{t("discovery.stories.saveToHighlight")}</p>
              {highlights === null ? (
                <p className="px-4 py-2 text-xs text-gray-400">{t("common.actions.loading")}</p>
              ) : highlights.length === 0 ? (
                <p className="px-4 py-2 text-xs text-gray-400">{t("discovery.stories.noHighlightsYet")}</p>
              ) : highlights.map((h) => (
                <button key={h.id} disabled={busy} onClick={() => assignHighlight(h.id)} className="block w-full truncate px-4 py-2 text-left text-sm hover:bg-gray-50 disabled:opacity-50">
                  {h.name}
                </button>
              ))}
              <button disabled={busy} onClick={createHighlight} className="block w-full px-4 py-2 text-left text-sm text-brand hover:bg-gray-50">{t("discovery.stories.newHighlight")}</button>
            </div>
          )}

          {active.stickerType && (
            <div className="absolute bottom-24 left-4 right-4 z-10 rounded-2xl bg-white/95 p-4" onClick={(e) => e.stopPropagation()}>
              <p className="mb-2 text-sm font-semibold text-gray-900">{active.stickerQuestion}</p>
              {active.stickerType === "QUESTION" ? (
                myAnswer !== null ? (
                  <p className="text-sm text-gray-500">{t("discovery.stories.sticker.thanksForAnswer")}</p>
                ) : (
                  <div className="flex items-center gap-2">
                    <input value={questionText} onChange={(e) => setQuestionText(e.target.value)} maxLength={500}
                      placeholder={t("discovery.stories.sticker.answerPlaceholder")}
                      className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-brand" />
                    <button disabled={busy || !questionText.trim()} onClick={() => respond(null, questionText)} className="shrink-0 rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50">
                      {t("common.actions.send")}
                    </button>
                  </div>
                )
              ) : (
                <div className="space-y-1.5">
                  {stickerOptions.map((opt, i) => {
                    const count = breakdown?.[i] || 0;
                    const pct = totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0;
                    const isCorrect = active.stickerType === "QUIZ" && myAnswer !== null && active.stickerCorrectIndex === i;
                    return (
                      <button key={i} disabled={busy || myAnswer !== null} onClick={() => respond(i, null)}
                        className={`relative w-full overflow-hidden rounded-lg border px-3 py-1.5 text-left text-sm disabled:opacity-100 ${myAnswer === i ? "border-brand font-semibold" : "border-gray-300"} ${isCorrect ? "border-green-500 text-green-700" : ""}`}>
                        {myAnswer !== null && (
                          <span className="absolute inset-y-0 left-0 bg-gray-100" style={{ width: `${pct}%` }} />
                        )}
                        <span className="relative flex justify-between">
                          <span>{opt}{isCorrect ? " ✓" : ""}</span>
                          {myAnswer !== null && <span>{pct}%</span>}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {!isOwn && (
            <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <input value={replyText} onChange={(e) => setReplyText(e.target.value)} maxLength={2000}
                placeholder={t("discovery.stories.replyPlaceholder")}
                className="w-full rounded-full border border-white/40 bg-black/40 px-4 py-2 text-sm text-white placeholder:text-white/60 outline-none focus:border-white" />
              {REACTIONS.slice(0, 3).map((r) => (
                <button key={r} disabled={busy} onClick={() => sendReply(REACTION_EMOJI[r])} className="shrink-0 text-2xl">{REACTION_EMOJI[r]}</button>
              ))}
              <button disabled={busy || !replyText.trim()} onClick={() => sendReply(replyText)} className="shrink-0 rounded-full bg-brand px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">
                {t("common.actions.send")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
