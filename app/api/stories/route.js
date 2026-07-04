import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveImage } from "@/lib/upload";
import { requireUserId } from "@/lib/guards";
import { visibleToViewer } from "@/lib/posts";
import { postVisibleToViewer } from "@/lib/privacy";
import { isClubMember } from "@/lib/clubs";

const STICKER_TYPES = ["POLL", "QUIZ", "QUESTION"];

// Shared sticker-field parsing/validation for both branches below. Returns
// null (no sticker) or a validated { stickerType, stickerQuestion,
// stickerOptions, stickerCorrectIndex } ready to spread into prisma.create.
function parseSticker({ stickerType, stickerQuestion, stickerOptions, stickerCorrectIndex }) {
  if (!stickerType) return {};
  if (!STICKER_TYPES.includes(stickerType)) throw new Error("Unknown sticker type.");
  const question = String(stickerQuestion || "").trim().slice(0, 200);
  if (!question) throw new Error("A sticker needs a question.");
  if (stickerType === "QUESTION") {
    return { stickerType, stickerQuestion: question, stickerOptions: null, stickerCorrectIndex: null };
  }
  const options = (Array.isArray(stickerOptions) ? stickerOptions : []).map((o) => String(o).trim()).filter(Boolean).slice(0, 6);
  if (options.length < 2) throw new Error("A poll or quiz sticker needs at least two options.");
  let correctIndex = null;
  if (stickerType === "QUIZ") {
    correctIndex = Number(stickerCorrectIndex);
    if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= options.length) {
      throw new Error("Pick which option is correct.");
    }
  }
  return { stickerType, stickerQuestion: question, stickerOptions: JSON.stringify(options), stickerCorrectIndex: correctIndex };
}

async function resolveClubId(clubId, userId) {
  if (!clubId) return null;
  if (!(await isClubMember(clubId, userId))) throw new Error("You're not a member of that club.");
  return clubId;
}

export async function POST(req) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  try {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Reposting a post to a story sends JSON; uploading a photo sends form-data.
    if ((req.headers.get("content-type") || "").includes("application/json")) {
      const { repostOfId, closeFriendsOnly, clubId } = await req.json();
      if (!repostOfId) return NextResponse.json({ error: "Missing post to share." }, { status: 400 });
      const original = await prisma.post.findFirst({
        where: { AND: [{ id: repostOfId }, visibleToViewer(userId), postVisibleToViewer(userId)] },
        select: { id: true, repostOfId: true },
      });
      if (!original) return NextResponse.json({ error: "That post is no longer available." }, { status: 400 });
      const resolvedClubId = await resolveClubId(clubId, userId);
      await prisma.story.create({
        data: {
          authorId: userId, expiresAt, repostOfId: original.repostOfId || original.id,
          closeFriendsOnly: Boolean(closeFriendsOnly), clubId: resolvedClubId,
        },
      });
      return NextResponse.json({ ok: true }, { status: 201 });
    }

    const form = await req.formData();
    const file = form.get("photo");
    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "Please choose a photo." }, { status: 400 });
    }
    const imageUrl = await saveImage(file);
    const closeFriendsOnly = form.get("closeFriendsOnly") === "true";
    const clubId = await resolveClubId(form.get("clubId") || null, userId);
    const stickerOptionsRaw = form.get("stickerOptions");
    const sticker = parseSticker({
      stickerType: form.get("stickerType") || null,
      stickerQuestion: form.get("stickerQuestion"),
      stickerOptions: stickerOptionsRaw ? JSON.parse(stickerOptionsRaw) : [],
      stickerCorrectIndex: form.get("stickerCorrectIndex"),
    });

    await prisma.story.create({ data: { imageUrl, authorId: userId, expiresAt, closeFriendsOnly, clubId, ...sticker } });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("create story error", err);
    return NextResponse.json({ error: err.message || "Could not add story." }, { status: 500 });
  }
}
