import { NextResponse } from "next/server";
import { isBootstrap, verifyCode } from "@/lib/access";

// Step 1 of joining: check the school code before showing the sign-up form.
// (No account is created here — it's just the entry gate.)
export async function POST(req) {
  const { code } = await req.json().catch(() => ({}));

  if (await isBootstrap()) {
    return NextResponse.json({ ok: true, bootstrap: true });
  }

  const ok = await verifyCode(code);
  if (!ok) {
    return NextResponse.json(
      { error: "That school code is not valid. Ask your school for the current code." },
      { status: 403 }
    );
  }
  return NextResponse.json({ ok: true });
}
