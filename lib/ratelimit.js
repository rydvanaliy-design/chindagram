import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Sliding-window rate limiter backed by Postgres.
//
// This was an in-memory Map, which was correct while the app ran as a single
// persistent Node server. On Vercel each request may be served by a different
// function instance with its own empty memory, so an in-memory counter both
// resets constantly and lets a determined user past the limit by landing on a
// fresh instance. The database is the only state all instances share.
//
// Cost note: this adds two quick indexed queries to rate-limited routes only
// (posting, registering, uploads, AI calls) — not to reads, which are the
// overwhelming majority of traffic.

const SWEEP_AFTER_MS = 24 * 60 * 60 * 1000; // rows older than a day are useless
let lastSweep = 0;

// Delete long-expired rows now and then, so the table stays small without a
// cron job. Fire-and-forget: a failed sweep must never fail a user's request.
function maybeSweep() {
  const now = Date.now();
  if (now - lastSweep < 60 * 60 * 1000) return;
  lastSweep = now;
  prisma.rateHit
    .deleteMany({ where: { createdAt: { lt: new Date(now - SWEEP_AFTER_MS) } } })
    .catch(() => {});
}

/**
 * Returns { ok: true } or { ok: false, retryAfterSec }.
 * Now async — every caller must await it.
 *
 * Fails OPEN: if the database is unreachable the request is allowed through.
 * The alternative (failing closed) would turn a database blip into a total
 * outage where nobody can log in or post, which is worse for a school than
 * briefly relaxed rate limits.
 */
export async function rateLimit(key, max, windowMs) {
  const now = Date.now();
  const since = new Date(now - windowMs);
  try {
    maybeSweep();
    const hits = await prisma.rateHit.findMany({
      where: { bucket: key, createdAt: { gte: since } },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
      take: max,
    });
    if (hits.length >= max) {
      const oldest = hits[0].createdAt.getTime();
      return { ok: false, retryAfterSec: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)) };
    }
    await prisma.rateHit.create({ data: { bucket: key } });
    return { ok: true };
  } catch {
    return { ok: true };
  }
}

// Best-effort client IP. On Vercel the platform sets x-forwarded-for with the
// real client address; x-real-ip is the fallback for other hosts.
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
