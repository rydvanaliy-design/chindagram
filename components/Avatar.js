"use client";
import { useEffect, useRef, useState } from "react";

// Rounded avatar. Falls back to the first initial when there's no image —
// or when the image file turns out to be missing, so a dead upload never
// shows the browser's broken-image icon. The mount-time naturalWidth check
// covers errors that fire before React hydration attaches onError.
export default function Avatar({ name, image, size = 32, ring = false }) {
  const ref = useRef(null);
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    setBroken(false);
    const el = ref.current;
    if (el && el.complete && el.naturalWidth === 0) setBroken(true);
  }, [image]);

  const initial = (name || "?").trim().charAt(0).toUpperCase();
  const inner = image && !broken ? (
    <img ref={ref} src={image} alt={name} onError={() => setBroken(true)} className="rounded-full object-cover" style={{ width: size, height: size }} />
  ) : (
    <span className="flex items-center justify-center rounded-full bg-brand font-semibold text-white"
      style={{ width: size, height: size, fontSize: size * 0.45 }}>{initial}</span>
  );

  if (!ring) return inner;
  return (
    <span className="story-ring inline-block rounded-full p-[2px]">
      <span className="block rounded-full bg-white p-[2px]">{inner}</span>
    </span>
  );
}
