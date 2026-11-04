import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secretKey = process.env.SESSION_SECRET;
if (!secretKey) {
  throw new Error("Falta la variable de entorno SESSION_SECRET");
}
const encodedKey = new TextEncoder().encode(secretKey);

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

type SessionPayload = {
  userId: string;
  expiresAt: string;
};

export async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey);
}

export async function decrypt(session: string | undefined = "") {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function createToken(userId: string) {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  const token = await encrypt({ userId, expiresAt: expiresAt.toISOString() });
  return { token, expiresAt };
}

export async function createSession(userId: string) {
  const { token, expiresAt } = await createToken(userId);
  const cookieStore = await cookies();

  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}
