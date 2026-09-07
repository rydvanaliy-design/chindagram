import { supabaseAdmin, STORAGE_BUCKET } from "@/lib/supabase";

// How much of the free storage tier has been used.
//
// Supabase's free plan includes 1 GB of file storage. For a school posting
// photos every day that is the ceiling that actually bites, long before any
// other limit, and running into it means uploads start failing for students
// with no warning. So the admin page shows it, with a warning band well before
// it is reached.

export const FREE_TIER_BYTES = 1024 * 1024 * 1024; // 1 GB
export const WARN_AT = 0.7;

// Uploads are stored as <folder>/<YYYY-MM-DD>/<uuid>.<ext>, so a full sweep is
// two levels deep. list() returns up to 1000 entries per call, which is plenty
// per day at school scale; the loop pages anyway so it stays correct if not.
async function listAll(prefix) {
  const out = [];
  let offset = 0;
  for (;;) {
    const { data, error } = await supabaseAdmin()
      .storage.from(STORAGE_BUCKET)
      .list(prefix, { limit: 1000, offset });
    if (error || !data?.length) break;
    out.push(...data);
    if (data.length < 1000) break;
    offset += data.length;
  }
  return out;
}

/**
 * Returns { bytes, files, byFolder, percent, warn, ok } — or { ok: false } if
 * storage can't be reached, so the admin page degrades instead of erroring.
 */
export async function getStorageUsage() {
  try {
    const folders = await listAll("");
    let bytes = 0;
    let files = 0;
    const byFolder = [];

    for (const folder of folders) {
      // Entries with no id are folders; entries with an id are files.
      if (folder.id) {
        bytes += folder.metadata?.size || 0;
        files += 1;
        continue;
      }
      let folderBytes = 0;
      let folderFiles = 0;
      for (const day of await listAll(folder.name)) {
        if (day.id) {
          folderBytes += day.metadata?.size || 0;
          folderFiles += 1;
          continue;
        }
        for (const file of await listAll(`${folder.name}/${day.name}`)) {
          folderBytes += file.metadata?.size || 0;
          folderFiles += 1;
        }
      }
      bytes += folderBytes;
      files += folderFiles;
      byFolder.push({ name: folder.name, bytes: folderBytes, files: folderFiles });
    }

    byFolder.sort((a, b) => b.bytes - a.bytes);
    const percent = Math.min(100, (bytes / FREE_TIER_BYTES) * 100);
    return { ok: true, bytes, files, byFolder, percent, warn: percent >= WARN_AT * 100 };
  } catch {
    return { ok: false };
  }
}

export function humanBytes(n) {
  if (!n) return "0 MB";
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
