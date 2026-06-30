import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isBootstrap, verifyCode } from "@/lib/access";
import { uniqueUsername } from "@/lib/username";

export async function POST(req) {
  try {
    const { name, email, password, code } = await req.json();

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

    // First account on a fresh install becomes the admin (bootstrap) and
    // needs no code. Everyone else must pass the school-wide access code.
    const isFirst = await isBootstrap();
    if (!isFirst) {
      const ok = await verifyCode(code);
      if (!ok) {
        return NextResponse.json(
          { error: "That school code is not valid. Ask your school for the current code." },
          { status: 403 }
        );
      }
    }

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
