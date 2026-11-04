import "server-only";
import { headers } from "next/headers";
import { decrypt } from "@/lib/session";

export async function getApiSession(): Promise<{ userId: string } | null> {
  const authHeader = (await headers()).get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice("Bearer ".length);
  const session = await decrypt(token);
  if (!session?.userId) return null;

  return { userId: session.userId };
}

export function unauthorized() {
  return Response.json({ error: "No autorizado" }, { status: 401 });
}
