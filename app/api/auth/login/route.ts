import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signToken, AUTH_COOKIE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username?.trim() || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { username: username.trim() } });

    if (!user || !(await compare(password, user.password))) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    const token = await signToken({
      id: user.id,
      username: user.username,
      role: user.role as "admin" | "user",
    });

    const res = NextResponse.json({ success: true, role: user.role });
    res.cookies.set(AUTH_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return res;
  } catch (err) {
    console.error("[login]", err);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
