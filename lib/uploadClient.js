"use client";
import { compressImage, checkVideo } from "@/lib/compressImage";

// Browser side of uploading: compress, ask our server for a signed URL, then
// send the bytes straight to Supabase Storage. The app server never sees the
// file — see lib/storage.js for the reasoning.
//
// Returns { path, kind, name, publicUrl }. Prefer `path` — endpoints that take
// a path verify the file really exists before trusting it. `publicUrl` is for
// the two places (comments, chat) whose APIs have always taken a URL.
// Throws an Error with a human-readable message on failure.

const PRESET_FOR_FOLDER = {
  posts: "post",
  stories: "story",
  messages: "chat",
  comments: "comment",
  avatars: "avatar",
};

export async function uploadOne(file, folder = "posts", t = null) {
  const say = (key, fallback, params) => (t ? t(key, params) : fallback);

  // Videos are never transcoded, only capped — reject before the slow part.
  const tooBig = checkVideo(file);
  if (tooBig) {
    throw new Error(say("posts.composer.errors.videoTooLarge",
      `That video is ${tooBig.size}. The limit is ${tooBig.max}.`, tooBig));
  }

  const ready = await compressImage(file, PRESET_FOR_FOLDER[folder] || "post");

  const signRes = await fetch("/api/uploads/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contentType: ready.type, size: ready.size, folder }),
  });
  const signed = await signRes.json().catch(() => ({}));
  if (!signRes.ok) throw new Error(signed.error || say("uploads.failed", "Upload failed. Please try again."));

  const put = await fetch(signed.signedUrl, {
    method: "PUT",
    headers: { "Content-Type": ready.type, "x-upsert": "false" },
    body: ready,
  });
  if (!put.ok) throw new Error(say("uploads.failed", "Upload failed. Please try again."));

  return { path: signed.path, kind: signed.kind, publicUrl: signed.publicUrl, name: file.name || "file" };
}

/** Upload several files, in order. Used by the multi-photo composer. */
export async function uploadMany(files, folder = "posts", t = null) {
  const out = [];
  for (const f of files) out.push(await uploadOne(f, folder, t));
  return out;
}
