"use client";
import { createClient } from "@supabase/supabase-js";

// Browser Supabase client, used only to listen for chat events.
//
// This uses the ANON key, which is public by design — it is shipped to every
// visitor and grants nothing on its own. Access control for chat comes from the
// channel name being an unguessable HMAC that only conversation members are
// given; see lib/realtime.js.

let client = null;

export function supabaseBrowser() {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null; // realtime simply stays off; polling covers it
  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { params: { eventsPerSecond: 10 } },
  });
  return client;
}
