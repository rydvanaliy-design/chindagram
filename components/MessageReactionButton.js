"use client";
import { useEffect, useRef, useState } from "react";
import { REACTIONS, REACTION_EMOJI, DEFAULT_REACTION } from "@/lib/reactions";
import { useT } from "@/lib/i18n/LocaleProvider";

const HOLD_MS = 350;

// Same tap-vs-hold pattern as ReactionBar (posts): quick tap toggles the
// default reaction (or clears yours), press-and-hold opens the full picker.
export default function MessageReactionButton({ myReaction, onReact }) {
  const { t } = useT();
  const [picking, setPicking] = useState(false);
  const timerRef = useRef(null);
  const heldRef = useRef(false);

  function quickToggle() { onReact(myReaction || DEFAULT_REACTION); }
  function onPointerDown() {
    heldRef.current = false;
    timerRef.current = setTimeout(() => { heldRef.current = true; setPicking(true); }, HOLD_MS);
  }
  function onPointerUp() {
    clearTimeout(timerRef.current);
    if (!heldRef.current) quickToggle();
  }
  function onPointerLeave() { clearTimeout(timerRef.current); }
  // Press-and-hold is a touch/mouse-only affordance — keyboard users get the
  // quick toggle via Enter/Space instead (same as a plain button click).
  function onKeyDown(e) {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); quickToggle(); }
  }
  function pick(type) { setPicking(false); onReact(type); }

  useEffect(() => {
    if (!picking) return;
    function onEsc(e) { if (e.key === "Escape") setPicking(false); }
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [picking]);

  return (
    <div className="relative">
      <button
        onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerLeave={onPointerLeave} onKeyDown={onKeyDown}
        aria-label={t("messages.thread.react")} className="text-[13px] leading-none opacity-0 transition focus:opacity-100 group-hover:opacity-100 active:scale-90"
      >
        {myReaction ? REACTION_EMOJI[myReaction] : "🤍"}
      </button>

      {picking && (
        <>
          <button className="fixed inset-0 z-10 cursor-default" onClick={() => setPicking(false)} aria-hidden="true" />
          <div className="absolute bottom-full z-20 mb-1 flex gap-1 rounded-full border border-gray-200 bg-white p-1 shadow-lg">
            {REACTIONS.map((t) => (
              <button key={t} onClick={() => pick(t)} title={t}
                className={`grid h-7 w-7 place-items-center rounded-full text-base transition hover:scale-125 ${myReaction === t ? "bg-gray-100" : ""}`}>
                {REACTION_EMOJI[t]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
