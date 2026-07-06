import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isBootstrap } from "@/lib/access";
import { uniqueUsername } from "@/lib/username";
import { rateLimit, clientIp, tooManyResponse } from "@/lib/ratelimit";

export async function POST(req) {
  try {
    // Sign-up is deliberately open (owner's decision), so this endpoint is
    // the most exposed one on the site — limit it hard per address. Counted
    // before validation so invalid attempts burn the budget too.
    const ip = clientIp(req);
    const shortWindow = rateLimit(`register:${ip}`, 5, 60 * 60 * 1000);       // 5 / hour
    const dayWindow = rateLimit(`register-day:${ip}`, 20, 24 * 60 * 60 * 1000); // 20 / day
    if (!shortWindow.ok) return tooManyResponse(shortWindow.retryAfterSec);
    if (!dayWindow.ok) return tooManyResponse(dayWindow.retryAfterSec);

    const { name, email, password } = await req.json();

    const cleanName = String(name || "").trim();
    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanPassword = String(password || "");

    if (!cleanName || !cleanEmail || !cleanPassword) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cleanEmail)) {
      return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
    }
    if (cleanPassword.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    // Sign-up is open: anyone with the site link can create an account.
    // The first account on a fresh install becomes the admin (bootstrap).
    const isFirst = await isBootstrap();

    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(cleanPassword, 10);
    const username = await uniqueUsername(cleanEmail.split("@")[0] || cleanName);

    // Everyone joins as a Student by default; admins assign other roles later.
    await prisma.user.create({
      data: {
        name: cleanName,
        email: cleanEmail,
        username,
        passwordHash,
        role: isFirst ? "ADMIN" : "STUDENT",
      },
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("register error", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
