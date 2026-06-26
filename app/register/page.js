import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/guards";
import RegisterForm from "@/components/RegisterForm";

export default async function RegisterPage() {
  const user = await getSessionUser();
  if (user) redirect("/");
  return <RegisterForm />;
}
