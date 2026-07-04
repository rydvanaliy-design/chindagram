"use client";
import { useEffect, useRef, useState } from "react";
import { Bookmark, BookmarkFilled } from "@/components/icons";
import { useT } from "@/lib/i18n/LocaleProvider";

const HOLD_MS = 350;

// Quick tap toggles save/unsave (uncategorized). Press-and-hold (or
// mouse-hold) opens a "Save to…" folder picker — same interaction pattern
// as ReactionBar's tap-vs-hold.
export default function SaveButton({ postId, initialSaved, initialCollectionId = null }) {
  const { t } = useT();
  const [saved, setSaved] = useState(initialSaved);
  const [collectionId, setCollectionId] = useState(initialCollectionId);
  const [picking, setPicking] = useState(false);
  const [collections, setCollections] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const timerRef = useRef(null);
  const heldRef = useRef(false);

  async function toggle() {
    setSaved((v) => !v);
    const res = await fetch(`/api/posts/${postId}/save`, { method: "POST" });
    if (res.ok) {
      const d = await res.json();
      setSaved(d.saved);
      if (!d.saved) setCollectionId(null);
    }
  }

  async function loadCollections() {
    if (collections) return;
    const res = await fetch("/api/collections");
    setCollections(res.ok ? (await res.json()).collections : []);
  }

  function onPointerDown() {
    heldRef.current = false;
    timerRef.current = setTimeout(() => { heldRef.current = true; setPicking(true); loadCollections(); }, HOLD_MS);
  }
  function onPointerUp() {
    clearTimeout(timerRef.current);
    if (!heldRef.current) toggle();
  }
  function onPointerLeave() { clearTimeout(timerRef.current); }
  // Press-and-hold is a touch/mouse-only affordance — keyboard users get the
  // quick toggle via Enter/Space instead (same as a plain button click).
  function onKeyDown(e) {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
  }

  useEffect(() => {
    if (!picking) return;
    function onEsc(e) { if (e.key === "Escape") { setPicking(false); setCreating(false); } }
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [picking]);

  async function assign(id) {
    setBusy(true);
    const res = await fetch(`/api/posts/${postId}/save`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ collectionId: id }),
    });
    setBusy(false);
    if (res.ok) { setSaved(true); setCollectionId(id); setPicking(false); setCreating(false); }
  }

  async function createAndAssign() {
    const name = newName.trim();
    if (!name) return;
    setBusy(true);
    const res = await fetch("/api/collections", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    setBusy(false);
    if (res.ok) {
      const d = await res.json();
      setCollections((cs) => [...(cs || []), d.collection]);
      setNewName("");
      await assign(d.collection.id);
    } else {
      const d = await res.json().catch(() => ({}));
      window.alert(d.error || t("posts.save.createError"));
    }
  }

  return (
    <div className="relative">
      <button
        onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerLeave={onPointerLeave} onKeyDown={onKeyDown}
        aria-label={t("posts.save.save")} className="pt-0.5 transition active:scale-90"
      >
        {saved ? <span className="text-brand"><BookmarkFilled /></span> : <Bookmark />}
      </button>

      {picking && (
        <>
          <button className="fixed inset-0 z-10 cursor-default" onClick={() => { setPicking(false); setCreating(false); }} aria-hidden="true" />
          <div className="absolute bottom-full right-0 z-20 mb-2 w-52 rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
            <p className="px-4 pb-1 pt-2 text-xs font-semibold text-gray-400">{t("posts.save.saveTo")}</p>
            <button disabled={busy} onClick={() => assign(null)} className={`block w-full px-4 py-2 text-left text-sm hover:bg-gray-50 disabled:opacity-50 ${collectionId === null && saved ? "font-semibold text-brand" : ""}`}>
              {t("posts.save.noFolder")}
            </button>
            {collections === null ? (
              <p className="px-4 py-2 text-xs text-gray-400">{t("posts.save.loading")}</p>
            ) : collections.map((c) => (
              <button key={c.id} disabled={busy} onClick={() => assign(c.id)} className={`block w-full truncate px-4 py-2 text-left text-sm hover:bg-gray-50 disabled:opacity-50 ${collectionId === c.id ? "font-semibold text-brand" : ""}`}>
                {c.name}
              </button>
            ))}
            {creating ? (
              <div className="flex items-center gap-1 px-3 py-2">
                <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={t("posts.save.folderName")} autoFocus
                  className="min-w-0 flex-1 rounded-md border border-gray-300 px-2 py-1 text-xs outline-none focus:border-gray-400" />
                <button disabled={busy} onClick={createAndAssign} className="shrink-0 rounded-md bg-brand px-2 py-1 text-xs font-semibold text-white disabled:opacity-50">{t("posts.save.add")}</button>
              </div>
            ) : (
              <button onClick={() => setCreating(true)} className="block w-full px-4 py-2 text-left text-sm text-brand hover:bg-gray-50">{t("posts.save.newFolder")}</button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
