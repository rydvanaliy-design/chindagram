"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useT } from "@/lib/i18n/LocaleProvider";
import LanguageSwitch from "@/components/LanguageSwitch";

export default function LoginForm() {
  const router = useRouter();
  const { t } = useT();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setBusy(false);
    if (res?.error) {
      setError(t("auth.login.errorGeneric"));
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <AuthShell>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <input className="ig-input" type="email" placeholder={t("auth.login.emailPlaceholder")} value={email}
          onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        <input className="ig-input" type="password" placeholder={t("auth.login.passwordPlaceholder")} value={password}
          onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={busy} className="ig-btn">{busy ? t("auth.login.loggingIn") : t("auth.login.submit")}</button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-500">
        {t("auth.login.newHere")}{" "}
        <Link href="/join" className="font-semibold text-brand">{t("auth.login.createAccount")}</Link>
      </p>
    </AuthShell>
  );
}

export function AuthShell({ children }) {
  const { t } = useT();
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-4 flex justify-center">
          <LanguageSwitch />
        </div>
        <div className="mb-6 text-center">
          <img src="/logo.png" alt={t("auth.shell.logoAlt")} className="mx-auto mb-3 h-14 w-14" />
          <h1 className="text-xl font-semibold text-brand">Chindagram</h1>
          <p className="text-sm text-gray-500">{t("auth.shell.tagline")}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
