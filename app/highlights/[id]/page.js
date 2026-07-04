import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/guards";
import { canViewProfile } from "@/lib/privacy";
import HighlightViewer from "@/components/HighlightViewer";

export const dynamic = "force-dynamic";

export default async function HighlightPage({ params }) {
  const viewer = await getSessionUser();
  if (!viewer) redirect("/login");

  const highlight = await prisma.highlight.findUnique({
    where: { id: params.id },
    include: {
      owner: { select: { id: true, name: true, image: true } },
      stories: { orderBy: { createdAt: "asc" }, select: { id: true, imageUrl: true } },
    },
  });
  if (!highlight) notFound();
  if (!(await canViewProfile(viewer.id, viewer.role, highlight.ownerId))) notFound();

  return (
    <HighlightViewer
      highlightId={highlight.id}
      name={highlight.name}
      owner={highlight.owner}
      stories={highlight.stories}
      isOwner={highlight.owner.id === viewer.id}
      backHref={`/u/${highlight.owner.id}`}
    />
  );
}
