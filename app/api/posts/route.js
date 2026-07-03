import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveMedia, saveAudio, saveDocument } from "@/lib/upload";
import { getSessionUser } from "@/lib/guards";
import { decideTextStatus } from "@/lib/moderation";
import { isSchoolCategory } from "@/lib/postkinds";
import { canModerateContent } from "@/lib/roles";
import { notifyMentions } from "@/lib/mentions";
import { notify } from "@/lib/notify";
import { visibleToViewer } from "@/lib/posts";
import { postVisibleToViewer } from "@/lib/privacy";
import { isClubMember } from "@/lib/clubs";

export async function POST(req) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  try {
    const form = await req.formData();
    const caption = String(form.get("caption") || "").trim();
    const linkUrl = String(form.get("linkUrl") || "").trim();
    const collaborator = String(form.get("collaborator") || "").trim().toLowerCase().replace(/^@/, "");
    let kind = String(form.get("kind") || "").trim().toUpperCase();
    const files = form.getAll("media").filter((f) => f && typeof f !== "string");

    // School categories (announcements, etc.) are Teacher/Admin only.
    let category = String(form.get("category") || "NONE").trim().toUpperCase();
    if (isSchoolCategory(category) && !canModerateContent(me.role)) {
      return NextResponse.json({ error: "Only teachers and admins can post school content." }, { status: 403 });
    }
    if (!isSchoolCategory(category)) category = "NONE";

    // Posting to a club's own feed — must be an accepted member.
    const clubId = String(form.get("clubId") || "").trim();
    if (clubId && !(await isClubMember(clubId, me.id))) {
      return NextResponse.json({ error: "You need to be a member of this club to post here." }, { status: 403 });
    }

    const data = { authorId: me.id, caption: caption || null, category, clubId: clubId || null };

    if (kind === "TEXT") {
      if (!caption) return NextResponse.json({ error: "Write something for your post." }, { status: 400 });
      data.kind = "TEXT";
    } else if (kind === "LINK") {
      if (!linkUrl) return NextResponse.json({ error: "Add a link." }, { status: 400 });
      data.kind = "LINK";
      data.linkUrl = linkUrl.slice(0, 500);
    } else if (kind === "POLL") {
      if (!caption) return NextResponse.json({ error: "Add a poll question." }, { status: 400 });
      const options = form.getAll("option")
        .map((o) => String(o || "").trim())
        .filter(Boolean)
        .slice(0, 6);
      if (options.length < 2) return NextResponse.json({ error: "A poll needs at least two options." }, { status: 400 });
      data.kind = "POLL";
      data.pollOptions = { create: options.map((text, i) => ({ text: text.slice(0, 120), order: i })) };
    } else if (kind === "AUDIO" || kind === "DOCUMENT") {
      const file = files[0];
      if (!file) return NextResponse.json({ error: "Choose a file to upload." }, { status: 400 });
      const saved = kind === "AUDIO" ? await saveAudio(file) : await saveDocument(file);
      data.kind = kind;
      data.media = { create: [{ url: saved.url, type: saved.type, name: saved.name, order: 0 }] };
    } else if (kind === "REPOST") {
      const originalPostId = String(form.get("originalPostId") || "").trim();
      if (!originalPostId) return NextResponse.json({ error: "Missing original post." }, { status: 400 });
      // Same visibility rules as the feed — can't repost something you can't see.
      const original = await prisma.post.findFirst({
        where: { AND: [{ id: originalPostId }, visibleToViewer(me.id), postVisibleToViewer(me.id)] },
        select: { id: true, repostOfId: true },
      });
      if (!original) return NextResponse.json({ error: "That post is no longer available." }, { status: 400 });
      data.kind = "REPOST";
      // Flatten repost-of-a-repost so every repost points at the true original.
      data.repostOfId = original.repostOfId || original.id;
    } else {
      // Photo / video post.
      if (files.length === 0) {
        return NextResponse.json({ error: "Please choose at least one photo or a video." }, { status: 400 });
      }
      const isVideo = String(files[0].type || "").startsWith("video/");
      data.kind = isVideo ? "REEL" : "PHOTO";
      const toSave = isVideo ? files.slice(0, 1) : files.slice(0, 10);
      const media = [];
      for (let i = 0; i < toSave.length; i++) {
        const saved = await saveMedia(toSave[i]);
        media.push({ url: saved.url, type: saved.type, order: i });
      }
      data.media = { create: media };
    }

    // Run the text through the automated filter; held posts wait for review.
    const { status, flagReason } = await decideTextStatus(`${caption} ${linkUrl}`);
    data.status = status;
    data.flagReason = flagReason;

    const post = await prisma.post.create({ data, select: { id: true } });

    // Invite a co-author (if a valid, different user was named).
    if (collaborator) {
      const other = await prisma.user.findUnique({ where: { username: collaborator }, select: { id: true } });
      if (other && other.id !== me.id) {
        await prisma.postCollaborator.create({ data: { postId: post.id, userId: other.id } });
        await notify({ recipientId: other.id, actorId: me.id, type: "COLLAB", postId: post.id });
      }
    }

    // Notify mentioned people — but only once the post is actually public.
    if (status === "VISIBLE") {
      await notifyMentions({ text: caption, postId: post.id, actorId: me.id });
    }

    return NextResponse.json({ ok: true, status }, { status: 201 });
  } catch (err) {
    console.error("create post error", err);
    return NextResponse.json({ error: err.message || "Could not create post." }, { status: 500 });
  }
}
