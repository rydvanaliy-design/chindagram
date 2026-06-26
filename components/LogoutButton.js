"use client";
import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="text-xs font-medium text-gray-400 hover:text-brand"
    >
      Log out
    </button>
  );
}
