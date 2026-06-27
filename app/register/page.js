import { redirect } from "next/navigation";

// Open email signup is replaced by the gated /join flow (school access code).
export default function RegisterPage() {
  redirect("/join");
}
