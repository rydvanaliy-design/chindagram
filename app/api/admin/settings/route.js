import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/guards";
import { setSetting, REQUIRE_APPROVAL } from "@/lib/settings";

// Admin-only: toggle the school-wide "hold every post & comment for review" switch.
export async function POST(req) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Admins only." }, { status: 403 });

  const { requireApproval } = await req.json().catch(() => ({}));
  if (typeof requireApproval !== "boolean") {
    return NextResponse.json({ error: "Missing requireApproval." }, { status: 400 });
  }

  await setSetting(REQUIRE_APPROVAL, requireApproval ? "true" : "false");
  return NextResponse.json({ ok: true });
}
