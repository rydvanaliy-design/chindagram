import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/guards";

// Cast (or change) your vote on a poll. One vote per user per poll.
export async function POST(req, { params }) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { optionId } = await req.json().catch(() => ({}));
  if (!optionId) return NextResponse.json({ error: "Pick an option." }, { status: 400 });

  const postId = params.id;
  // The option must belong to this poll.
  const option = await prisma.pollOption.findUnique({ where: { id: optionId }, select: { postId: true } });
  if (!option || option.postId !== postId) {
    return NextResponse.json({ error: "Invalid option." }, { status: 400 });
  }

  await prisma.pollVote.upsert({
    where: { postId_userId: { postId, userId } },
    update: { optionId },
    create: { postId, userId, optionId },
  });

  // Return fresh tallies.
  const options = await prisma.pollOption.findMany({
    where: { postId },
    orderBy: { order: "asc" },
    include: { _count: { select: { votes: true } } },
  });
  return NextResponse.json({
    options: options.map((o) => ({ id: o.id, text: o.text, votes: o._count.votes })),
    myOptionId: optionId,
    totalVotes: options.reduce((s, o) => s + o._count.votes, 0),
  });
}
