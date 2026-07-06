import { NextResponse } from "next/server";

// Simple in-memory sliding-window rate limiter.
//
// In-memory is a deliberate choice, not a shortcut: this app already assumes
// one persistent Node server (lib/messageStream.js pub/sub, local-disk
// uploads), so a shared store like Redis would add cost and moving parts for
// no benefit. If the app ever scales past one instance, this moves to Redis
// together with messageStream.
//
// Sizing note: at school scale (~200 users) the map stays tiny; the sweep
// below is just a belt-and-braces guard against unbounded growth.

const buckets = new Map(); // key -> array of hit timestamps (ms)
const MAX_KEYS = 50_000;

function sweep(now) {
  if (buckets.size < MAX_KEYS) return;
  for (const [key, hits] of buckets) {
    if (hits.length === 0 || hits[hits.length - 1] < now - 60 * 60 * 1000) buckets.delete(key);
  }
}

// Returns { ok: true } or { ok: false, retryAfterSec }.
export function rateLimit(key, max, windowMs) {
  const now = Date.now();
  sweep(now);
  let hits = buckets.get(key);
  if (!hits) { hits = []; buckets.set(key, hits); }
  // drop hits that fell out of the window
  while (hits.length > 0 && hits[0] <= now - windowMs) hits.shift();
  if (hits.length >= max) {
    return { ok: false, retryAfterSec: Math.ceil((hits[0] + windowMs - now) / 1000) };
  }
  hits.push(now);
  return { ok: true };
}

// Best-effort client IP. In production the app sits behind Caddy on the same
// machine, which sets X-Forwarded-For with the real client address.
export function clientIp(req) {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

// Standard 429 response for a failed check.
export function tooManyResponse(retryAfterSec) {
  return NextResponse.json(
    { error: "Too many requests — please wait a moment and try again." },
    { status: 429, headers: { "Retry-After": String(retryAfterSec || 60) } }
  );
}
