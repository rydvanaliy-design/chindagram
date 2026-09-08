import { createHmac } from "crypto";

// ---------------------------------------------------------------------------
// Realtime chat delivery, via Supabase Realtime broadcast.
//
// This replaces an in-process EventEmitter + Server-Sent Events, which worked
// because the app ran as one persistent Node server. On Vercel the request that
// SENDS a message and the request holding a listener's stream open are usually
// different function instances with separate memory, so an in-process emitter
// delivers to nobody. Supabase Realtime is a bus that every instance shares.
//
// SECURITY — why channels are not just the conversation id:
// The browser subscribes using the Supabase ANON key, which is public by
// design. Supabase's per-user channel authorisation depends on Supabase Auth,
// and this app authenticates with Auth.js instead, so we cannot lean on it.
// If the channel were named after the conversation id (which appears in URLs
// and is therefore not secret), anyone could subscribe and read every message
// in it.
//
// So the channel name is an HMAC of the conversation id under AUTH_SECRET.
// Only the server can compute it, and it is handed to a client only after
// app/messages/[id]/page.js has confirmed that person is a member. Guessing it
// means guessing 128 bits.
// ---------------------------------------------------------------------------

/** Secret, membership-gated channel name for a conversation. */
export function channelFor(conversationId) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set — realtime channels need it.");
  return "conv-" + createHmac("sha256", secret).update(String(conversationId)).digest("hex").slice(0, 32);
}

/**
 * Push an event to everyone watching a conversation.
 *
 * Fire-and-forget on purpose: realtime is a nicety, and the client also polls
 * as a safety net. A Supabase hiccup must never stop a message being SAVED, so
 * failures are swallowed rather than surfaced to the sender.
 */
export function publish(conversationId, payload) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;

  fetch(`${url}/realtime/v1/api/broadcast`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: key, Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      messages: [{ topic: channelFor(conversationId), event: "chat", payload }],
    }),
  }).catch(() => {});
}
