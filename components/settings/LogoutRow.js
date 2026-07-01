"use client";
import { signOut } from "next-auth/react";
import { SettingsButtonRow } from "@/components/settings/SettingsRow";
import { X } from "@/components/icons";

export default function LogoutRow() {
  return (
    <SettingsButtonRow
      danger
      icon={<X />}
      label="Log out"
      onClick={() => signOut({ callbackUrl: "/login" })}
    />
  );
}
