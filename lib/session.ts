import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "lifeos_session";
const SESSION_TTL_SEC = 60 * 60 * 24 * 7; // 7 days

// A stable SESSION_SECRET keeps sessions valid across restarts; without one,
// a random secret is generated at boot and every restart logs everyone out.
// Stored on globalThis because Next.js instantiates this module once per
// server bundle — each instance must still share the same secret.
const g = globalThis as typeof globalThis & { __lifeosSecret?: string };
const secret =
  process.env.SESSION_SECRET ||
  (g.__lifeosSecret ??= randomBytes(32).toString("hex"));

interface SessionPayload {
  user: string;
  exp: number; // unix seconds
}

const sign = (data: string) =>
  createHmac("sha256", secret).update(data).digest("base64url");

export function createSessionToken(user: string): string {
  const payload = Buffer.from(
    JSON.stringify({
      user,
      exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SEC,
    } satisfies SessionPayload)
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString()
    ) as SessionPayload;
    if (typeof data.exp !== "number" || data.exp < Date.now() / 1000) return null;
    return data;
  } catch {
    return null;
  }
}

/** Current session from the request cookies, or null when not authenticated. */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production" && process.env.ALLOW_HTTP !== "1",
  path: "/",
  maxAge: SESSION_TTL_SEC,
};
