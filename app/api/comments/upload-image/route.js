import { NextResponse } from "next/server";
import { rateLimit, tooManyResponse } from "@/lib/ratelimit";
import { requireUserId } from "@/lib/guards";
import { saveImage } from "@/lib/upload";

// Uploads an image to attach to a comment. Returns the URL; the comment
// itself is created afterward via the normal JSON comments endpoint.
export async function POST(req) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const posted = rateLimit(`upload:${userId}`, 20, 10 * 60 * 1000);
  if (!posted.ok) return tooManyResponse(posted.retryAfterSec);

  try {
    const form = await req.formData();
    const file = form.get("image");
    if (!file || typeof file === "string") return NextResponse.json({ error: "No image provided." }, { status: 400 });
    const url = await saveImage(file);
    return NextResponse.json({ url });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Could not upload image." }, { status: 500 });
  }
}
