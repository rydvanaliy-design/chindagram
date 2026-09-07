import { createClient } from "@supabase/supabase-js";

// Supabase clients. Two of them, deliberately kept apart:
//
//  - supabaseAdmin() uses the SERVICE ROLE key, which bypasses every access
//    rule. It is server-only. Importing this from a "use client" component
//    would ship the key to every student's browser, so it reads an env var
//    with no NEXT_PUBLIC_ prefix — Next.js refuses to expose those to the
//    client, which makes that mistake fail loudly instead of silently.
//
//  - The browser uses the ANON key, which is public by design and safe to ship.

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;

function required(value, name) {
  if (!value) {
    throw new Error(
      `${name} is not set. Copy .env.example to .env and fill it in (see DEPLOY.md).`
    );
  }
  return value;
}

let admin = null;

/** Server-only Supabase client with full privileges. */
export function supabaseAdmin() {
  if (admin) return admin;
  admin = createClient(
    required(URL_, "NEXT_PUBLIC_SUPABASE_URL"),
    required(process.env.SUPABASE_SERVICE_ROLE_KEY, "SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
  return admin;
}

export const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "uploads";
