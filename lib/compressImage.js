// ---------------------------------------------------------------------------
// Client-side image compression, run in the browser BEFORE anything uploads.
//
// Why this exists: a photo straight off a phone is 3-8 MB. Hosting runs on
// Supabase's free storage tier, which must last the whole school, so every
// image is resized and re-encoded (WebP where supported) before it leaves the
// device. A typical post photo lands around 150-350 KB — roughly 20x smaller.
// That is also what stops the feed buffering on a school 4G connection.
//
// Videos are NOT transcoded (browser transcoding needs a ~30 MB library and is
// unreliable on the iPhones most students carry). They are size-capped instead,
// and rejected here with a clear message rather than after a long upload.
// ---------------------------------------------------------------------------

// Per-surface budgets. Tighter than typical because storage is the hard limit.
export const IMAGE_PRESETS = {
  post:    { maxDimension: 1600, targetBytes: 400 * 1024, quality: 0.72 },
  story:   { maxDimension: 1280, targetBytes: 300 * 1024, quality: 0.70 },
  chat:    { maxDimension: 1280, targetBytes: 300 * 1024, quality: 0.70 },
  comment: { maxDimension: 1200, targetBytes: 250 * 1024, quality: 0.70 },
  avatar:  { maxDimension: 400,  targetBytes: 80 * 1024,  quality: 0.80 },
};

export const VIDEO_MAX_BYTES = 15 * 1024 * 1024; // keep in step with LIMITS.VIDEO in lib/storage.js

// Animated GIFs are left alone: drawing one to a canvas keeps only frame 1.
const SKIP_TYPES = ["image/gif"];

// Marks a File as "already been through here", so it is never compressed twice.
// Non-enumerable so it can't leak into FormData or JSON by accident.
const COMPRESSED = "__chindagramCompressed";
function mark(file) {
  try {
    Object.defineProperty(file, COMPRESSED, { value: true, enumerable: false });
  } catch {
    // Frozen File in some browser — worst case it gets compressed twice.
  }
  return file;
}

let webpSupport = null;
function supportsWebp() {
  if (webpSupport !== null) return webpSupport;
  try {
    const c = document.createElement("canvas");
    c.width = c.height = 1;
    webpSupport = c.toDataURL("image/webp").startsWith("data:image/webp");
  } catch {
    webpSupport = false;
  }
  return webpSupport;
}

// Decode to something drawable. createImageBitmap is faster and keeps EXIF
// rotation; the <img> path is the fallback for browsers without the options bag.
async function decode(file) {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // fall through to the <img> path
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error("Could not read that image."));
      img.src = url;
    });
    return img;
  } finally {
    // Revoked on the next tick so the decoded bitmap stays valid while drawing.
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

function drawScaled(source, maxDimension) {
  const w = source.width || source.naturalWidth;
  const h = source.height || source.naturalHeight;
  const scale = Math.min(1, maxDimension / Math.max(w, h)); // never upscale
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(w * scale));
  canvas.height = Math.max(1, Math.round(h * scale));
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  // White backdrop: transparent PNGs would otherwise go black once flattened.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function toBlob(canvas, mime, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, mime, quality));
}

function renameTo(name, mime) {
  const base = (name || "photo").replace(/\.[^.]+$/, "");
  return `${base}.${mime === "image/webp" ? "webp" : "jpg"}`;
}

/**
 * Compress one image file. Always resolves to a File — on any failure it
 * returns the original untouched, so a picky browser can never block posting.
 */
export async function compressImage(file, presetName = "post") {
  const preset = IMAGE_PRESETS[presetName] || IMAGE_PRESETS.post;
  if (!file || !file.type?.startsWith("image/") || SKIP_TYPES.includes(file.type)) return file;
  // Some composers compress when the file is picked (so the preview shows what
  // will actually be posted) and the uploader compresses again on the way out.
  // Re-encoding an already-encoded image only loses quality, so the marker
  // below makes a second pass a no-op no matter what order things run in.
  if (file[COMPRESSED]) return file;

  try {
    const source = await decode(file);
    const mime = supportsWebp() ? "image/webp" : "image/jpeg";

    // Step the quality (then the size) down until it fits the budget. Four
    // passes is plenty; each one is a few milliseconds on a modern phone.
    let best = null;
    let dimension = preset.maxDimension;
    let quality = preset.quality;
    for (let attempt = 0; attempt < 4; attempt++) {
      const canvas = drawScaled(source, dimension);
      const blob = await toBlob(canvas, mime, quality);
      if (!blob) break;
      best = blob;
      if (blob.size <= preset.targetBytes) break;
      quality = Math.max(0.4, quality - 0.12);
      if (attempt >= 1) dimension = Math.round(dimension * 0.8);
    }
    if (source.close) source.close(); // release the ImageBitmap

    // If our version isn't actually smaller, keep the original.
    if (!best || best.size >= file.size) return mark(file);
    return mark(new File([best], renameTo(file.name, mime), { type: mime, lastModified: Date.now() }));
  } catch {
    return file;
  }
}

/**
 * Compress a picked list, leaving videos and other non-images untouched.
 * Returns { files, savedBytes } so the UI can show what it saved.
 */
export async function compressPicked(files, presetName = "post") {
  const before = files.reduce((sum, f) => sum + (f.size || 0), 0);
  const out = await Promise.all(files.map((f) => compressImage(f, presetName)));
  const after = out.reduce((sum, f) => sum + (f.size || 0), 0);
  return { files: out, savedBytes: Math.max(0, before - after) };
}

/**
 * Reject oversized videos on the device, before a slow upload starts.
 * Returns null when fine, or { size, max } for the caller to put through t().
 */
export function checkVideo(file) {
  if (!file?.type?.startsWith("video/")) return null;
  if (file.size > VIDEO_MAX_BYTES) {
    return { size: formatBytes(file.size), max: formatBytes(VIDEO_MAX_BYTES) };
  }
  return null;
}

export function formatBytes(n) {
  if (!n) return "0 KB";
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
