"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { AuthShell } from "@/components/LoginForm";

// Open sign-up: anyone with the site link can create an account.
// `bootstrap` just shows a note that the first account becomes the admin.
export default function JoinForm({ bootstrap = false }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function createAccount(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Could not create account.");
      setBusy(false);
      return;
    }
    // Auto-login after a successful sign-up.
    await signIn("credentials", { email, password, redirect: false });
    router.push("/");
    router.refresh();
  }

  return (
    <AuthShell>
      {bootstrap && (
        <p className="mb-3 rounded-lg bg-accent/20 px-3 py-2 text-center text-xs font-semibold text-brand">
          First account — this becomes the school Admin.
        </p>
      )}
      <form onSubmit={createAccount} className="flex flex-col gap-3">
        <input className="ig-input" type="text" placeholder="Name" value={name}
          onChange={(e) => setName(e.target.value)} autoComplete="name" required />
        <input className="ig-input" type="email" placeholder="Email" value={email}
          onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        <input className="ig-input" type="password" placeholder="Password (min 8 characters)" value={password}
          onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" minLength={8} required />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={busy} className="ig-btn">{busy ? "Creating…" : "Create account"}</button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-500">
        You’ll join as a <span className="font-semibold">Student</span>. A school admin can change your role later.
      </p>
      <p className="mt-2 text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand">Log in</Link>
      </p>
    </AuthShell>
  );
}
