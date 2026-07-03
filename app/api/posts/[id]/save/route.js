import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/guards";

export async function POST(req, { params }) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const postId = params.id;
  const body = await req.json().catch(() => ({}));

  // A body with `collectionId` (including null, for "no folder") files this
  // save into a folder — creating the save if it doesn't exist yet — instead
  // of the plain bookmark toggle below.
  if (Object.prototype.hasOwnProperty.call(body, "collectionId")) {
    const collectionId = body.collectionId || null;
    if (collectionId) {
      const owns = await prisma.saveCollection.findFirst({ where: { id: collectionId, ownerId: userId } });
      if (!owns) return NextResponse.json({ error: "Folder not found." }, { status: 404 });
    }
    const save = await prisma.save.upsert({
      where: { userId_postId: { userId, postId } },
      update: { collectionId },
      create: { userId, postId, collectionId },
    });
    return NextResponse.json({ saved: true, collectionId: save.collectionId });
  }

  const existing = await prisma.save.findUnique({ where: { userId_postId: { userId, postId } } });
  if (existing) await prisma.save.delete({ where: { id: existing.id } });
  else await prisma.save.create({ data: { userId, postId } });

  return NextResponse.json({ saved: !existing });
}
