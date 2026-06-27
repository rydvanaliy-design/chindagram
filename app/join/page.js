import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/guards";
import { isBootstrap, normalizeCode } from "@/lib/access";
import JoinForm from "@/components/JoinForm";

export const dynamic = "force-dynamic";

// Entry gate: scan/enter the school code, then create a Student account.
// A QR poster links here as /join?code=CHINDA-XXXXXX (prefills the code).
export default async function JoinPage({ searchParams }) {
  const user = await getSessionUser();
  if (user) redirect("/");

  const bootstrap = await isBootstrap();
  const initialCode = normalizeCode(searchParams?.code);

  return <JoinForm bootstrap={bootstrap} initialCode={initialCode} />;
}
