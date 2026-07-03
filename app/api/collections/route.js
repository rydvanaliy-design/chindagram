import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/guards";

export async function GET() {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const collections = await prisma.saveCollection.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { saves: true } } },
  });
  return NextResponse.json({ collections: collections.map((c) => ({ id: c.id, name: c.name, count: c._count.saves })) });
}

export async function POST(req) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { name } = await req.json();
  const trimmed = String(name || "").trim().slice(0, 60);
  if (!trimmed) return NextResponse.json({ error: "Give the folder a name." }, { status: 400 });

  try {
    const collection = await prisma.saveCollection.create({ data: { ownerId: userId, name: trimmed } });
    return NextResponse.json({ collection: { id: collection.id, name: collection.name, count: 0 } }, { status: 201 });
  } catch (err) {
    if (err.code === "P2002") return NextResponse.json({ error: "You already have a folder with that name." }, { status: 400 });
    throw err;
  }
}
