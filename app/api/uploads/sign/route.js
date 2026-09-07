import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/guards";
import { rateLimit, tooManyResponse } from "@/lib/ratelimit";
import { signUpload, publicUrl } from "@/lib/storage";

// Hands out one-shot signed URLs so the browser can upload straight to
// Supabase Storage. See lib/storage.js for why files don't go through here.
//
// Everything a client could lie about is re-checked server-side: who they are,
// how often they may ask, which folder they may write to, and what type and
// size the file is. The signed URL is only issued after all of that passes.

// Fixed set — a client-supplied folder would otherwise be a path-traversal hole.
const FOLDERS = {
  posts:    { allow: ["IMAGE", "VIDEO", "AUDIO", "DOCUMENT"] },
  stories:  { allow: ["IMAGE"] },
  messages: { allow: ["IMAGE", "VIDEO", "AUDIO"] },
  comments: { allow: ["IMAGE"] },
  avatars:  { allow: ["IMAGE"] },
};

export async function POST(req) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  // Same budget as posting: enough for a 10-photo carousel plus retries,
  // not enough to fill the bucket.
  const ok = await rateLimit(`sign:${me.id}`, 60, 10 * 60 * 1000);
  if (!ok.ok) return tooManyResponse(ok.retryAfterSec);

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  const folder = String(body?.folder || "posts");
  const rules = FOLDERS[folder];
  if (!rules) return NextResponse.json({ error: "Bad request." }, { status: 400 });

  const result = await signUpload({
    contentType: String(body?.contentType || ""),
    size: Number(body?.size),
    allow: rules.allow,
    folder,
  });
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });

  return NextResponse.json({
    path: result.path,
    kind: result.kind,
    signedUrl: result.signedUrl,
    // Where the file will be readable once the PUT finishes. Handed back now
    // so the caller doesn't need a second request to find out.
    publicUrl: publicUrl(result.path),
  });
}
