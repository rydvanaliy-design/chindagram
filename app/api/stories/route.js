import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveImage } from "@/lib/upload";
import { requireUserId } from "@/lib/guards";

export async function POST(req) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  try {
    const form = await req.formData();
    const file = form.get("photo");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "Please choose a photo." }, { status: 400 });
    }
    const imageUrl = await saveImage(file);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.story.create({ data: { imageUrl, authorId: userId, expiresAt } });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("create story error", err);
    return NextResponse.json({ error: err.message || "Could not add story." }, { status: 500 });
  }
}
