import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { SessionUser } from "@/types";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "poc-secret-key-not-for-production"
);

const COOKIE_NAME = "poc_session";

export async function createSession(user: SessionUser): Promise<string> {
  const token = await new SignJWT({ user })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("24h")
    .sign(SECRET);
  return token;
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, SECRET);
    return (payload as { user: SessionUser }).user;
  } catch {
    return null;
  }
}

export function setSessionCookie(token: string): void {
  // This is called from API routes using Response headers
}

export const COOKIE_NAME_EXPORT = COOKIE_NAME;