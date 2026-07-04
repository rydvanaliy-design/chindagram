import { NextResponse } from "next/server";
import { isAiEnabled } from "@/lib/ai";

// Lets client components decide whether to show AI-helper buttons at all,
// without ever exposing the API key itself.
export async function GET() {
  return NextResponse.json({ enabled: isAiEnabled() });
}
