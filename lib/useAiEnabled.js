"use client";
import { useEffect, useState } from "react";

// Module-level cache: one /api/ai/status fetch per page load no matter how
// many components (Composer, every PostCard, every CommentItem…) ask.
let cachedPromise = null;
function fetchStatus() {
  if (!cachedPromise) {
    cachedPromise = fetch("/api/ai/status").then((r) => (r.ok ? r.json() : { enabled: false })).catch(() => ({ enabled: false }));
  }
  return cachedPromise;
}

export function useAiEnabled() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    let cancelled = false;
    fetchStatus().then((d) => { if (!cancelled) setEnabled(!!d.enabled); });
    return () => { cancelled = true; };
  }, []);
  return enabled;
}
