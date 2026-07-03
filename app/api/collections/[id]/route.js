import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/guards";

async function ownedCollection(id, userId) {
  return prisma.saveCollection.findFirst({ where: { id, ownerId: userId } });
}

export async function PATCH(req, { params }) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const existing = await ownedCollection(params.id, userId);
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const { name } = await req.json();
  const trimmed = String(name || "").trim().slice(0, 60);
  if (!trimmed) return NextResponse.json({ error: "Give the folder a name." }, { status: 400 });

  try {
    await prisma.saveCollection.update({ where: { id: params.id }, data: { name: trimmed } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err.code === "P2002") return NextResponse.json({ error: "You already have a folder with that name." }, { status: 400 });
    throw err;
  }
}

export async function DELETE(req, { params }) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const existing = await ownedCollection(params.id, userId);
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  // Deleting a folder un-files its saves (Save.collectionId SetNull) — it doesn't delete them.
  await prisma.saveCollection.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
