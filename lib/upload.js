import { writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

// ---------------------------------------------------------------------------
// All upload logic lives here, so going from local disk to a cloud host
// (Cloudinary / S3 / Vercel Blob) is a change to these functions — see DEPLOY.md.
//
// HOSTING NOTE: saving to /public/uploads only works on a server with a
// persistent writable disk. Most platforms (Vercel, etc.) reset the disk, so
// switch these to a cloud store before going live permanently. Videos in
// particular should use a real video host.
// ---------------------------------------------------------------------------

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

const IMG_MAX = 8 * 1024 * 1024;   // 8 MB
const VID_MAX = 60 * 1024 * 1024;  // 60 MB

const EXT = {
  "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif",
  "video/mp4": ".mp4", "video/webm": ".webm", "video/quicktime": ".mov",
};

async function writeToDisk(file, max) {
  if (typeof file.size === "number" && file.size > max) {
    throw new Error("File is too large.");
  }
  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.length > max) throw new Error("File is too large.");
  const filename = `${Date.now()}-${randomUUID()}${EXT[file.type] || ""}`;
  await writeFile(path.join(UPLOAD_DIR, filename), bytes);
  return `/uploads/${filename}`;
}

// Saves an image OR a video and reports which it was.
export async function saveMedia(file) {
  if (!file || typeof file.arrayBuffer !== "function") throw new Error("No file provided");
  if (IMAGE_TYPES.includes(file.type)) {
    return { url: await writeToDisk(file, IMG_MAX), type: "IMAGE" };
  }
  if (VIDEO_TYPES.includes(file.type)) {
    return { url: await writeToDisk(file, VID_MAX), type: "VIDEO" };
  }
  throw new Error("Unsupported file type. Use JPG/PNG/WEBP/GIF or MP4/WEBM/MOV.");
}

// Image-only helper (stories, avatars).
export async function saveImage(file) {
  if (!file || typeof file.arrayBuffer !== "function") throw new Error("No file provided");
  if (!IMAGE_TYPES.includes(file.type)) throw new Error("Unsupported image type.");
  return writeToDisk(file, IMG_MAX);
}
