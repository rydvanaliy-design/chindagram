import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/guards";
import { notify } from "@/lib/notify";

// One response per viewer per story, upserted so re-answering a poll changes
// your vote instead of creating a duplicate row.
export async function POST(req, { params }) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const story = await prisma.story.findUnique({
    where: { id: params.id },
    select: { authorId: true, stickerType: true, stickerOptions: true },
  });
  if (!story || !story.stickerType) return NextResponse.json({ error: "This story has no sticker." }, { status: 404 });

  const { optionIndex, text } = await req.json().catch(() => ({}));

  let data;
  if (story.stickerType === "QUESTION") {
    const clean = String(text || "").trim().slice(0, 500);
    if (!clean) return NextResponse.json({ error: "Write an answer first." }, { status: 400 });
    data = { text: clean, optionIndex: null };
  } else {
    const options = JSON.parse(story.stickerOptions || "[]");
    const idx = Number(optionIndex);
    if (!Number.isInteger(idx) || idx < 0 || idx >= options.length) {
      return NextResponse.json({ error: "Pick an option." }, { status: 400 });
    }
    data = { optionIndex: idx, text: null };
  }

  await prisma.storyResponse.upsert({
    where: { storyId_userId: { storyId: params.id, userId } },
    update: data,
    create: { storyId: params.id, userId, ...data },
  });

  if (story.stickerType === "QUESTION") {
    await notify({ recipientId: story.authorId, actorId: userId, type: "STORY_RESPONSE", storyId: params.id });
  }

  // POLL/QUIZ: return the aggregate breakdown so the viewer sees results
  // immediately, same UX as voting on a post poll.
  let breakdown = null;
  if (story.stickerType !== "QUESTION") {
    const all = await prisma.storyResponse.findMany({ where: { storyId: params.id }, select: { optionIndex: true } });
    breakdown = all.reduce((acc, r) => { acc[r.optionIndex] = (acc[r.optionIndex] || 0) + 1; return acc; }, {});
  }

  return NextResponse.json({ ok: true, breakdown });
}
