import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/guards";
import { isBootstrap } from "@/lib/access";
import JoinForm from "@/components/JoinForm";

export const dynamic = "force-dynamic";

// Open sign-up page. The site is distributed by QR/link; anyone with it can join.
export default async function JoinPage() {
  const user = await getSessionUser();
  if (user) redirect("/");

  const bootstrap = await isBootstrap();
  return <JoinForm bootstrap={bootstrap} />;
}
