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
const AUDIO_TYPES = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/ogg", "audio/webm", "audio/mp4", "audio/aac", "audio/x-m4a"];
const DOC_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
];

const IMG_MAX = 8 * 1024 * 1024;    // 8 MB
const VID_MAX = 60 * 1024 * 1024;   // 60 MB
const AUDIO_MAX = 20 * 1024 * 1024; // 20 MB
const DOC_MAX = 15 * 1024 * 1024;   // 15 MB

const EXT = {
  "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif",
  "video/mp4": ".mp4", "video/webm": ".webm", "video/quicktime": ".mov",
  "audio/mpeg": ".mp3", "audio/mp3": ".mp3", "audio/wav": ".wav", "audio/x-wav": ".wav",
  "audio/ogg": ".ogg", "audio/webm": ".weba", "audio/mp4": ".m4a", "audio/aac": ".aac", "audio/x-m4a": ".m4a",
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "application/vnd.ms-powerpoint": ".ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
  "application/vnd.ms-excel": ".xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  "text/plain": ".txt",
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

// Saves an audio file. Returns the URL + original filename.
export async function saveAudio(file) {
  if (!file || typeof file.arrayBuffer !== "function") throw new Error("No file provided");
  if (!AUDIO_TYPES.includes(file.type)) throw new Error("Unsupported audio type. Use MP3, WAV, OGG, M4A or AAC.");
  return { url: await writeToDisk(file, AUDIO_MAX), type: "AUDIO", name: file.name || "audio" };
}

// Saves a document/file. Returns the URL + original filename.
export async function saveDocument(file) {
  if (!file || typeof file.arrayBuffer !== "function") throw new Error("No file provided");
  if (!DOC_TYPES.includes(file.type)) throw new Error("Unsupported file type. Use PDF, Word, PowerPoint, Excel or text.");
  return { url: await writeToDisk(file, DOC_MAX), type: "DOCUMENT", name: file.name || "file" };
}

// Image-only helper (stories, avatars).
export async function saveImage(file) {
  if (!file || typeof file.arrayBuffer !== "function") throw new Error("No file provided");
  if (!IMAGE_TYPES.includes(file.type)) throw new Error("Unsupported image type.");
  return writeToDisk(file, IMG_MAX);
}
