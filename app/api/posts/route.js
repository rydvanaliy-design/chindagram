import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveMedia } from "@/lib/upload";
import { requireUserId } from "@/lib/guards";

export async function POST(req) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  try {
    const form = await req.formData();
    const caption = String(form.get("caption") || "").trim();
    const files = form.getAll("media").filter((f) => f && typeof f !== "string");

    if (files.length === 0) {
      return NextResponse.json({ error: "Please choose at least one photo or a video." }, { status: 400 });
    }

    const isVideo = String(files[0].type || "").startsWith("video/");
    const kind = isVideo ? "REEL" : "PHOTO";
    const toSave = isVideo ? files.slice(0, 1) : files.slice(0, 10);

    const media = [];
    for (let i = 0; i < toSave.length; i++) {
      const saved = await saveMedia(toSave[i]);
      media.push({ url: saved.url, type: saved.type, order: i });
    }

    await prisma.post.create({
      data: { kind, caption: caption || null, authorId: userId, media: { create: media } },
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("create post error", err);
    return NextResponse.json({ error: err.message || "Could not create post." }, { status: 500 });
  }
}
