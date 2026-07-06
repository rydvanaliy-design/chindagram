"use client";
import { useEffect, useRef, useState } from "react";

// An <img> that quietly hides itself if the file is missing (e.g. an upload
// that was deleted from disk while its DB row survived) instead of showing
// the browser's broken-image icon. The parent keeps its own background, so a
// dead image degrades to a clean neutral tile.
//
// onError alone isn't enough: for server-rendered images the error event can
// fire before React hydrates and attaches handlers, so we also re-check
// `naturalWidth` after mount (a loaded-but-broken image reports 0).
export default function SafeImage({ src, ...props }) {
  const ref = useRef(null);
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    setBroken(false);
    const el = ref.current;
    if (el && el.complete && el.naturalWidth === 0) setBroken(true);
  }, [src]);

  if (broken) return null;
  return <img ref={ref} src={src} {...props} onError={() => setBroken(true)} />;
}
