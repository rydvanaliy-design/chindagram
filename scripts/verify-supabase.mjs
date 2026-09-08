#!/usr/bin/env node
/**
 * Checks that every part of the Supabase setup actually works, and creates the
 * storage bucket if it isn't there yet.
 *
 *   node scripts/verify-supabase.mjs
 *
 * Prints PASS/FAIL per check and never prints a key or password — safe to
 * screenshot or paste back into a chat.
 */
import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

// Read .env directly; this script runs outside Next.js, which normally loads it.
const env = {};
for (const line of readFileSync(new URL("../.env", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2];
}

const results = [];
const pass = (name, detail = "") => results.push({ ok: true, name, detail });
const fail = (name, detail = "") => results.push({ ok: false, name, detail });

// Never let a key reach the output, even inside an error message.
const SECRETS = [env.SUPABASE_SERVICE_ROLE_KEY, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, env.DATABASE_URL, env.DIRECT_URL]
  .filter((v) => v && v.length > 8);
const scrub = (s) => {
  let out = String(s ?? "");
  for (const secret of SECRETS) out = out.split(secret).join("[redacted]");
  return out.replace(/postgresql:\/\/[^\s"]+/g, "postgresql://[redacted]").slice(0, 300);
};

const URL_ = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const BUCKET = env.SUPABASE_STORAGE_BUCKET || "uploads";

// --- 1. Config present and not still placeholder ---------------------------
const placeholders = Object.entries(env).filter(([, v]) => v.includes("PASTE_"));
if (placeholders.length) {
  fail("Config filled in", `still placeholder: ${placeholders.map(([k]) => k).join(", ")}`);
  report();
} else {
  pass("Config filled in");
}

if (ANON && SERVICE && ANON === SERVICE) {
  fail("anon and service_role differ", "they are identical — one was pasted twice");
}

const admin = createClient(URL_, SERVICE, { auth: { persistSession: false } });

// --- 2. Database reachable, and is it actually in the right region? --------
try {
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  await prisma.$queryRaw`SELECT 1`;
  const tables = await prisma.$queryRaw`
    SELECT COUNT(*)::int AS n FROM information_schema.tables WHERE table_schema = 'public'`;
  const n = tables[0]?.n ?? 0;
  if (n === 0) fail("Tables created", "database is empty — run: npx prisma migrate deploy");
  else pass("Tables created", `${n} tables`);

  // Round-trip time is the honest measure of whether the region is right.
  const t0 = Date.now();
  for (let i = 0; i < 5; i++) await prisma.$queryRaw`SELECT 1`;
  const ms = Math.round((Date.now() - t0) / 5);
  if (ms > 250) fail("Database latency", `${ms}ms per query — is the project really in Singapore?`);
  else pass("Database latency", `${ms}ms per query`);

  await prisma.$disconnect();
} catch (e) {
  fail("Database reachable", scrub(e.message));
}

// --- 3. Storage bucket exists (create it if not) ---------------------------
try {
  const { data: buckets, error } = await admin.storage.listBuckets();
  if (error) throw error;
  const found = buckets.find((b) => b.name === BUCKET);
  if (!found) {
    const { error: mkErr } = await admin.storage.createBucket(BUCKET, { public: true });
    if (mkErr) fail("Storage bucket", `missing, and could not create it: ${scrub(mkErr.message)}`);
    else pass("Storage bucket", `created "${BUCKET}" (public)`);
  } else if (!found.public) {
    fail("Storage bucket", `"${BUCKET}" exists but is PRIVATE — photos won't load. Make it public.`);
  } else {
    pass("Storage bucket", `"${BUCKET}" exists and is public`);
  }
} catch (e) {
  fail("Storage bucket", scrub(e.message));
}

// --- 4. The real upload path: sign -> PUT -> read back -> verify -> delete --
const testPath = `posts/_verify/${Date.now()}.txt`;
try {
  const { data: signed, error: signErr } = await admin.storage.from(BUCKET).createSignedUploadUrl(testPath);
  if (signErr) throw new Error(`could not sign: ${signErr.message}`);
  pass("Signed upload URL");

  const put = await fetch(signed.signedUrl, {
    method: "PUT",
    headers: { "Content-Type": "text/plain", "x-upsert": "false" },
    body: "chindagram upload check",
  });
  if (!put.ok) throw new Error(`upload PUT returned ${put.status}`);
  pass("Direct browser-style upload");

  const publicUrl = `${URL_}/storage/v1/object/public/${BUCKET}/${testPath}`;
  const get = await fetch(publicUrl);
  if (!get.ok) fail("Uploaded file is publicly readable", `GET returned ${get.status} — bucket may be private`);
  else pass("Uploaded file is publicly readable");

  // This mirrors verifyUploaded() in lib/storage.js, which the API routes rely
  // on to confirm a client-claimed path really exists.
  const folder = testPath.split("/").slice(0, -1).join("/");
  const name = testPath.split("/").pop();
  const { data: listed, error: listErr } = await admin.storage.from(BUCKET).list(folder, { search: name, limit: 1 });
  if (listErr || !listed?.some((f) => f.name === name)) {
    fail("verifyUploaded() lookup", "signed upload worked but the file wasn't found by list()");
  } else {
    pass("verifyUploaded() lookup");
  }

  await admin.storage.from(BUCKET).remove([testPath]);
  pass("Cleanup");
} catch (e) {
  fail("Upload round-trip", scrub(e.message));
}

// --- 5. Realtime broadcast, exactly as lib/realtime.js sends it ------------
try {
  const topic = `verify-${Date.now()}`;
  const listener = createClient(URL_, ANON, { auth: { persistSession: false } });

  const got = new Promise((resolve) => {
    const ch = listener.channel(topic).on("broadcast", { event: "chat" }, () => resolve(true)).subscribe((status) => {
      if (status === "SUBSCRIBED") {
        // Send only once the listener is actually attached.
        fetch(`${URL_}/realtime/v1/api/broadcast`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: SERVICE, Authorization: `Bearer ${SERVICE}` },
          body: JSON.stringify({ messages: [{ topic, event: "chat", payload: { kind: "ping" } }] }),
        }).catch(() => {});
      }
    });
    setTimeout(() => { listener.removeChannel(ch); resolve(false); }, 8000);
  });

  if (await got) pass("Realtime chat delivery");
  else fail("Realtime chat delivery", "no message arrived within 8s — chat will fall back to 15s polling");
  await listener.removeAllChannels();
} catch (e) {
  fail("Realtime chat delivery", scrub(e.message));
}

report();

function report() {
  console.log("");
  for (const r of results) {
    console.log(`  ${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.detail ? " — " + r.detail : ""}`);
  }
  const bad = results.filter((r) => !r.ok);
  console.log("");
  console.log(bad.length ? `${bad.length} check(s) failed.` : "All checks passed. Ready to deploy.");
  process.exit(bad.length ? 1 : 0);
}
