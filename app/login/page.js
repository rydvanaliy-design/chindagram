import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/guards";
import LoginForm from "@/components/LoginForm";

export default async function LoginPage() {
  // Use the DB-checked user (not just the cookie) so a stale cookie pointing at a
  // deleted/disabled account doesn't bounce between /login and / forever.
  const user = await getSessionUser();
  if (user) redirect("/");
  return <LoginForm />;
}
