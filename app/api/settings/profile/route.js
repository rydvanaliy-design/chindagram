import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/guards";
import { saveImage } from "@/lib/upload";
import { sanitizeUsername, isValidUsername } from "@/lib/username";
import { THEME_KEYS } from "@/lib/themes";

export async function POST(req) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  try {
    const form = await req.formData();
    const name = String(form.get("name") || "").trim();
    const username = String(form.get("username") || "").trim();
    const bio = String(form.get("bio") || "").trim();
    const pronouns = String(form.get("pronouns") || "").trim();
    const interests = String(form.get("interests") || "").trim();
    const links = String(form.get("links") || "").trim();
    const theme = String(form.get("theme") || "").trim();
    const avatar = form.get("avatar");

    const data = {};
    if (name) data.name = name.slice(0, 60);
    data.bio = bio ? bio.slice(0, 300) : null;
    data.pronouns = pronouns ? pronouns.slice(0, 40) : null;
    data.interests = interests ? interests.slice(0, 200) : null;
    data.links = links ? links.slice(0, 500) : null;
    if (theme && THEME_KEYS.includes(theme)) data.theme = theme;

    // Username: validate format + uniqueness if it changed.
    if (username) {
      const clean = sanitizeUsername(username);
      if (!isValidUsername(clean)) {
        return NextResponse.json({ error: "Username must be 3–20 letters, numbers or underscores." }, { status: 400 });
      }
      const taken = await prisma.user.findUnique({ where: { username: clean }, select: { id: true } });
      if (taken && taken.id !== userId) {
        return NextResponse.json({ error: "That username is taken." }, { status: 409 });
      }
      data.username = clean;
    }

    if (avatar && typeof avatar !== "string" && avatar.size > 0) {
      data.image = await saveImage(avatar);
    }

    await prisma.user.update({ where: { id: userId }, data });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("profile update error", err);
    return NextResponse.json({ error: err.message || "Could not save." }, { status: 500 });
  }
}
