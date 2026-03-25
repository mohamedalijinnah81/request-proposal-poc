import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { createSession } from "@/lib/auth";
import type { User } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    const users = await query<User & { password_hash: string; domain: string }>(
      "SELECT * FROM users WHERE email = ? AND password_hash = ? LIMIT 1",
      [email, password]
    );

    if (!users.length) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const user = users[0];
    const sessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      domain: user.domain,
    };

    const token = await createSession(sessionUser);

    const response = NextResponse.json({
      success: true,
      data: { user: sessionUser },
    });

    response.cookies.set("poc_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}