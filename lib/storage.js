import { randomUUID } from "crypto";
import { supabaseAdmin, STORAGE_BUCKET } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Where uploaded files live now.
//
// This replaces writing to /public/uploads, which only worked because the app
// ran on one server with a persistent disk. Vercel resets the disk between
// requests, so files go to Supabase Storage instead.
//
// Files do NOT pass through the app. The browser asks this module for a signed
// URL and then uploads straight to Supabase. Two reasons:
//   1. Vercel caps request bodies at 4.5 MB — a 15 MB video could never get
//      through an API route at all.
//   2. Routing bytes through the server would mean paying for the same data
//      twice (in and out) and would make every upload feel slower.
// ---------------------------------------------------------------------------

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
export const AUDIO_TYPES = [
  "audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/ogg",
  "audio/webm", "audio/mp4", "audio/aac", "audio/x-m4a",
];
export const DOC_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
];

// Server-side ceilings. Images arrive already compressed by the browser
// (lib/compressImage.js), so 2 MB is generous headroom rather than a target;
// anything larger means compression was skipped or bypassed.
const LIMITS = {
  IMAGE: 2 * 1024 * 1024,
  VIDEO: 15 * 1024 * 1024,
  AUDIO: 20 * 1024 * 1024,
  DOCUMENT: 15 * 1024 * 1024,
};

const EXT = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif",
  "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov",
  "audio/mpeg": "mp3", "audio/mp3": "mp3", "audio/wav": "wav", "audio/x-wav": "wav",
  "audio/ogg": "ogg", "audio/webm": "weba", "audio/mp4": "m4a", "audio/aac": "aac",
  "audio/x-m4a": "m4a",
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "text/plain": "txt",
};

/** Which family a MIME type belongs to, or null if we don't accept it. */
export function kindOf(contentType) {
  if (IMAGE_TYPES.includes(contentType)) return "IMAGE";
  if (VIDEO_TYPES.includes(contentType)) return "VIDEO";
  if (AUDIO_TYPES.includes(contentType)) return "AUDIO";
  if (DOC_TYPES.includes(contentType)) return "DOCUMENT";
  return null;
}

/**
 * Validate a proposed upload and hand back a one-shot signed URL for it.
 * The client PUTs the bytes to `signedUrl`, then sends `path` to the API that
 * creates the post / story / message.
 *
 * `allow` narrows what this particular caller may upload (e.g. stories are
 * images only), so a signing endpoint can't be used to smuggle in a video.
 */
export async function signUpload({ contentType, size, allow = null, folder = "posts" }) {
  const kind = kindOf(contentType);
  if (!kind) return { error: "Unsupported file type." };
  if (allow && !allow.includes(kind)) return { error: "That kind of file isn't allowed here." };
  if (typeof size !== "number" || size <= 0) return { error: "Missing file size." };
  if (size > LIMITS[kind]) {
    return { error: `That file is too large (limit ${Math.round(LIMITS[kind] / 1024 / 1024)} MB).` };
  }

  // Unguessable name: the bucket is public-read (same as the old /uploads
  // folder), so the path is the only thing standing between a file and a
  // stranger. randomUUID gives 122 bits of entropy.
  const path = `${folder}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${EXT[contentType]}`;

  const { data, error } = await supabaseAdmin()
    .storage.from(STORAGE_BUCKET)
    .createSignedUploadUrl(path);

  if (error) return { error: "Could not start the upload. Please try again." };
  return { path, kind, signedUrl: data.signedUrl, token: data.token };
}

/** Public URL for a stored path. Stored in the database as-is. */
export function publicUrl(path) {
  if (!path) return null;
  if (path.startsWith("http")) return path; // already absolute
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${base}/storage/v1/object/public/${STORAGE_BUCKET}/${path}`;
}

/** Confirm a client-claimed path really exists before saving it to the DB. */
export async function verifyUploaded(path) {
  if (!path || path.startsWith("http") || path.includes("..")) return false;
  const folder = path.split("/").slice(0, -1).join("/");
  const name = path.split("/").pop();
  const { data, error } = await supabaseAdmin()
    .storage.from(STORAGE_BUCKET)
    .list(folder, { search: name, limit: 1 });
  return !error && Array.isArray(data) && data.some((f) => f.name === name);
}

/** Remove a file (used when a post fails to save after its upload succeeded). */
export async function removeUpload(path) {
  if (!path || path.startsWith("http")) return;
  await supabaseAdmin().storage.from(STORAGE_BUCKET).remove([path]).catch(() => {});
}
