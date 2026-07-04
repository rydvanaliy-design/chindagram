"use client";
import { useEffect, useRef, useState } from "react";
import { REACTIONS, REACTION_EMOJI, DEFAULT_REACTION } from "@/lib/reactions";
import { useT } from "@/lib/i18n/LocaleProvider";

const HOLD_MS = 350;

// Quick tap toggles your reaction (default ❤️, or removes whatever you had).
// Press-and-hold (or mouse-hold) reveals the full picker to choose a specific
// reaction instead. Works the same for touch and mouse via pointer events.
export default function ReactionBar({ postId, initialMyReaction, initialBreakdown, initialTotal, dark = false }) {
  const { t } = useT();
  const [myReaction, setMyReaction] = useState(initialMyReaction);
  const [breakdown, setBreakdown] = useState(initialBreakdown);
  const [total, setTotal] = useState(initialTotal);
  const [picking, setPicking] = useState(false);
  const timerRef = useRef(null);
  const heldRef = useRef(false);

  async function send(type) {
    const res = await fetch(`/api/posts/${postId}/like`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type }),
    });
    if (res.ok) {
      const d = await res.json();
      setMyReaction(d.myReaction);
      setBreakdown(d.breakdown);
      setTotal(d.totalCount);
    }
  }

  function quickToggle() {
    send(myReaction || DEFAULT_REACTION);
  }

  function onPointerDown() {
    heldRef.current = false;
    timerRef.current = setTimeout(() => { heldRef.current = true; setPicking(true); }, HOLD_MS);
  }
  function onPointerUp() {
    clearTimeout(timerRef.current);
    if (!heldRef.current) quickToggle();
  }
  function onPointerLeave() {
    clearTimeout(timerRef.current);
  }
  // Press-and-hold is a touch/mouse-only affordance — keyboard users get the
  // quick toggle via Enter/Space instead (same as a plain button click).
  function onKeyDown(e) {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); quickToggle(); }
  }

  function pick(type) {
    setPicking(false);
    send(type);
  }

  useEffect(() => {
    if (!picking) return;
    function onEsc(e) { if (e.key === "Escape") setPicking(false); }
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [picking]);

  const topTypes = REACTIONS.filter((t) => breakdown[t] > 0).sort((a, b) => breakdown[b] - breakdown[a]).slice(0, 3);

  return (
    <div className="relative">
      <button
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerLeave}
        onKeyDown={onKeyDown}
        aria-label={t("posts.reactions.react")}
        className="text-2xl leading-none transition active:scale-90"
      >
        {myReaction ? REACTION_EMOJI[myReaction] : "🤍"}
      </button>

      {picking && (
        <>
          <button className="fixed inset-0 z-10 cursor-default" onClick={() => setPicking(false)} aria-hidden="true" />
          <div className="absolute bottom-full left-0 z-20 mb-2 flex gap-1 rounded-full border border-gray-200 bg-white p-1.5 shadow-lg">
            {REACTIONS.map((t) => (
              <button
                key={t}
                onClick={() => pick(t)}
                title={t}
                className={`grid h-9 w-9 place-items-center rounded-full text-xl transition hover:scale-125 ${myReaction === t ? "bg-gray-100" : ""}`}
              >
                {REACTION_EMOJI[t]}
              </button>
            ))}
          </div>
        </>
      )}

      {total > 0 && (
        <p className={`mt-1 text-xs ${dark ? "text-gray-200" : "text-gray-500"}`}>
          {topTypes.map((t) => REACTION_EMOJI[t]).join(" ")} <span className={`font-semibold ${dark ? "text-white" : "text-gray-700"}`}>{total}</span>
        </p>
      )}
    </div>
  );
}
