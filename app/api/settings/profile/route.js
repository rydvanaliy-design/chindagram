import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/guards";
import { saveImage } from "@/lib/upload";

export async function POST(req) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  try {
    const form = await req.formData();
    const name = String(form.get("name") || "").trim();
    const bio = String(form.get("bio") || "").trim();
    const avatar = form.get("avatar");

    const data = {};
    if (name) data.name = name.slice(0, 60);
    data.bio = bio ? bio.slice(0, 300) : null;
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
