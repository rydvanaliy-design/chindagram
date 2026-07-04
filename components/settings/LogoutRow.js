"use client";
import { signOut } from "next-auth/react";
import { SettingsButtonRow } from "@/components/settings/SettingsRow";
import { X } from "@/components/icons";
import { useT } from "@/lib/i18n/LocaleProvider";

export default function LogoutRow() {
  const { t } = useT();
  return (
    <SettingsButtonRow
      danger
      icon={<X />}
      label={t("settings.logout")}
      onClick={() => signOut({ callbackUrl: "/login" })}
    />
  );
}
