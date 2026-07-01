import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveImage } from "@/lib/upload";
import { requireUserId } from "@/lib/guards";
import { visibleToViewer } from "@/lib/posts";
import { postVisibleToViewer } from "@/lib/privacy";

export async function POST(req) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  try {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Reposting a post to a story sends JSON; uploading a photo sends form-data.
    if ((req.headers.get("content-type") || "").includes("application/json")) {
      const { repostOfId } = await req.json();
      if (!repostOfId) return NextResponse.json({ error: "Missing post to share." }, { status: 400 });
      const original = await prisma.post.findFirst({
        where: { AND: [{ id: repostOfId }, visibleToViewer(userId), postVisibleToViewer(userId)] },
        select: { id: true, repostOfId: true },
      });
      if (!original) return NextResponse.json({ error: "That post is no longer available." }, { status: 400 });
      await prisma.story.create({ data: { authorId: userId, expiresAt, repostOfId: original.repostOfId || original.id } });
      return NextResponse.json({ ok: true }, { status: 201 });
    }

    const form = await req.formData();
    const file = form.get("photo");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "Please choose a photo." }, { status: 400 });
    }
    const imageUrl = await saveImage(file);

    await prisma.story.create({ data: { imageUrl, authorId: userId, expiresAt } });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("create story error", err);
    return NextResponse.json({ error: err.message || "Could not add story." }, { status: 500 });
  }
}
