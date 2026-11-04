import { getTimezoneForUser } from "@/lib/dal";
import { getApiSession, unauthorized } from "@/lib/api-auth";
import { markWorkoutDone, unmarkWorkoutDone } from "@/lib/exercise";
import type { CalendarDate } from "@/lib/date";

function parseCalendarDate(body: unknown): CalendarDate | null {
  if (!body || typeof body !== "object") return null;
  const { year, month, day } = body as Record<string, unknown>;
  if (typeof year !== "number" || typeof month !== "number" || typeof day !== "number") return null;
  return { year, month, day };
}

export async function POST(request: Request) {
  const session = await getApiSession();
  if (!session) return unauthorized();

  const cal = parseCalendarDate(await request.json().catch(() => null));
  if (!cal) return Response.json({ error: "Cuerpo inválido" }, { status: 400 });

  const timezone = await getTimezoneForUser(session.userId);
  const changed = await markWorkoutDone(session.userId, timezone, cal);

  return Response.json({ ok: true, changed });
}

export async function DELETE(request: Request) {
  const session = await getApiSession();
  if (!session) return unauthorized();

  const cal = parseCalendarDate(await request.json().catch(() => null));
  if (!cal) return Response.json({ error: "Cuerpo inválido" }, { status: 400 });

  const timezone = await getTimezoneForUser(session.userId);
  await unmarkWorkoutDone(session.userId, timezone, cal);

  return Response.json({ ok: true });
}
