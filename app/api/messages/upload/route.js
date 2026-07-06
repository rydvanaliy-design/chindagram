import { NextResponse } from "next/server";
import { rateLimit, tooManyResponse } from "@/lib/ratelimit";
import { requireUserId } from "@/lib/guards";
import { saveMedia, saveAudio } from "@/lib/upload";

// Uploads a photo/video or a recorded voice note to attach to a message.
// Returns the URL; the message itself is created afterward via the normal
// JSON messages endpoint, same two-step pattern as comment image uploads.
export async function POST(req) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const posted = rateLimit(`upload:${userId}`, 20, 10 * 60 * 1000);
  if (!posted.ok) return tooManyResponse(posted.retryAfterSec);

  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") return NextResponse.json({ error: "No file provided." }, { status: 400 });

    if (form.get("kind") === "voice") {
      const saved = await saveAudio(file);
      return NextResponse.json({ url: saved.url, type: "VOICE" });
    }
    const saved = await saveMedia(file);
    return NextResponse.json({ url: saved.url, type: saved.type });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Could not upload file." }, { status: 500 });
  }
}
