import { prisma } from "@/lib/prisma";
import { getApiSession, unauthorized } from "@/lib/api-auth";
import { EDITABLE_DAYS, saveWorkoutSchedule, type EditableDay } from "@/lib/exercise";
import type { MuscleGroup } from "@/generated/prisma/client";

export async function GET() {
  const session = await getApiSession();
  if (!session) return unauthorized();

  const schedule = await prisma.workoutSchedule.findUnique({ where: { userId: session.userId } });

  return Response.json({
    monday: schedule?.monday ?? [],
    tuesday: schedule?.tuesday ?? [],
    wednesday: schedule?.wednesday ?? [],
    thursday: schedule?.thursday ?? [],
    friday: schedule?.friday ?? [],
    saturday: schedule?.saturday ?? [],
    sunday: schedule?.sunday ?? [],
  });
}

export async function POST(request: Request) {
  const session = await getApiSession();
  if (!session) return unauthorized();

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const record = body as Record<string, unknown>;
  const days = Object.fromEntries(
    EDITABLE_DAYS.map((day) => [day, Array.isArray(record[day]) ? (record[day] as MuscleGroup[]) : []])
  ) as Record<EditableDay, MuscleGroup[]>;

  await saveWorkoutSchedule(session.userId, days);

  return Response.json({ ok: true });
}
