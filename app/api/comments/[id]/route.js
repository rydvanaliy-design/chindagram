import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/guards";

export async function DELETE(req, { params }) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const comment = await prisma.comment.findUnique({ where: { id: params.id }, select: { authorId: true } });
  if (!comment) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (comment.authorId !== me.id && me.role !== "ADMIN") return NextResponse.json({ error: "Not allowed." }, { status: 403 });

  await prisma.comment.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
