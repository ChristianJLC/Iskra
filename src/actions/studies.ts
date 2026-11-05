"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifySession, getUserTimezone } from "@/lib/dal";
import { startOfToday, endOfToday } from "@/lib/date";
import { effectiveSeconds, stoppedTimerData } from "@/lib/study";

const EXTEND_MINUTES = 15;

const subjectSchema = z.object({
  name: z.string().trim().min(1, "Escribe el nombre de la materia.").max(60, "Usa un nombre de hasta 60 caracteres."),
  targetMinutes: z.coerce
    .number()
    .int("Usa minutos enteros.")
    .min(5, "La sesión debe durar al menos 5 minutos.")
    .max(480, "La sesión no puede pasar de 8 horas."),
  weekdays: z.array(z.coerce.number().int().min(0).max(6)),
});

const logSchema = z.coerce
  .number()
  .int("Usa minutos enteros.")
  .min(1, "Escribe cuántos minutos estudiaste.")
  .max(600, "Registra hasta 10 horas a la vez.");

function revalidateStudy() {
  revalidatePath("/estudio");
  revalidatePath("/estudio/historial");
  revalidatePath("/");
}

function todayRange(timezone: string) {
  return { gte: startOfToday(timezone), lt: endOfToday(timezone) };
}

/** Solo un temporizador corre a la vez: empezar uno detiene los demás. */
async function stopRunningTimers(userId: string, exceptId?: string) {
  const running = await prisma.studyEntry.findMany({
    where: { userId, runningSince: { not: null }, id: exceptId ? { not: exceptId } : undefined },
  });

  await Promise.all(
    running.map((entry) => prisma.studyEntry.update({ where: { id: entry.id }, data: stoppedTimerData(entry) }))
  );
}

async function getOrCreateTodayEntry(userId: string, subjectId: string) {
  const timezone = await getUserTimezone();
  const subject = await prisma.studySubject.findFirst({ where: { id: subjectId, userId } });
  if (!subject) return null;

  const existing = await prisma.studyEntry.findFirst({
    where: { userId, subjectId: subject.id, date: todayRange(timezone) },
  });
  if (existing) return existing;

  return prisma.studyEntry.create({
    data: {
      userId,
      subjectId: subject.id,
      subjectName: subject.name,
      targetMinutes: subject.targetMinutes,
    },
  });
}

export async function saveSubject(id: string | null, formData: FormData): Promise<{ error: string } | undefined> {
  const { userId } = await verifySession();
  const timezone = await getUserTimezone();

  const parsed = subjectSchema.safeParse({
    name: formData.get("name"),
    targetMinutes: formData.get("targetMinutes"),
    weekdays: formData.getAll("weekdays"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { name, targetMinutes } = parsed.data;
  const weekdays = [...new Set(parsed.data.weekdays)].sort();

  const duplicate = await prisma.studySubject.findFirst({
    where: { userId, name: { equals: name, mode: "insensitive" }, id: id ? { not: id } : undefined },
  });
  if (duplicate) return { error: "Ya tienes una materia con ese nombre." };

  if (!id) {
    await prisma.studySubject.create({ data: { userId, name, targetMinutes, weekdays } });
    revalidateStudy();
    return;
  }

  const current = await prisma.studySubject.findFirst({ where: { id, userId } });
  if (!current) return { error: "Esta materia ya no existe." };

  const planChanged = current.weekdays.join() !== weekdays.join();
  await prisma.studySubject.update({
    where: { id },
    data: { name, targetMinutes, weekdays, ...(planChanged && { scheduledFrom: new Date() }) },
  });

  // La sesión de hoy refleja la edición; las de días anteriores conservan su historia.
  const todayEntry = await prisma.studyEntry.findFirst({
    where: { userId, subjectId: id, date: todayRange(timezone) },
  });
  if (todayEntry) {
    await prisma.studyEntry.update({
      where: { id: todayEntry.id },
      data: {
        subjectName: name,
        targetMinutes,
        completed: effectiveSeconds({ ...todayEntry, targetMinutes }) >= targetMinutes * 60,
      },
    });
  }

  revalidateStudy();
}

export async function deleteSubject(id: string) {
  const { userId } = await verifySession();

  await prisma.studySubject.deleteMany({ where: { id, userId } });

  revalidateStudy();
}

export async function startSubjectSession(subjectId: string) {
  const { userId } = await verifySession();

  const entry = await getOrCreateTodayEntry(userId, subjectId);
  if (!entry || entry.completed || entry.runningSince) return;

  await stopRunningTimers(userId, entry.id);
  await prisma.studyEntry.update({ where: { id: entry.id }, data: { runningSince: new Date() } });

  revalidateStudy();
}

export async function startTimer(entryId: string) {
  const { userId } = await verifySession();

  const entry = await prisma.studyEntry.findFirst({ where: { id: entryId, userId } });
  if (!entry || entry.completed || entry.runningSince) return;

  await stopRunningTimers(userId, entry.id);
  await prisma.studyEntry.update({ where: { id: entry.id }, data: { runningSince: new Date() } });

  revalidateStudy();
}

export async function pauseTimer(entryId: string) {
  const { userId } = await verifySession();

  const entry = await prisma.studyEntry.findFirst({ where: { id: entryId, userId } });
  if (!entry || !entry.runningSince) return;

  await prisma.studyEntry.update({ where: { id: entry.id }, data: stoppedTimerData(entry) });

  revalidateStudy();
}

/** Amplía la meta de hoy para seguir estudiando después de cumplirla. */
export async function extendStudy(entryId: string) {
  const { userId } = await verifySession();

  const entry = await prisma.studyEntry.findFirst({ where: { id: entryId, userId } });
  if (!entry) return;

  const studiedMinutes = Math.ceil(effectiveSeconds(entry) / 60);

  await stopRunningTimers(userId, entry.id);
  await prisma.studyEntry.update({
    where: { id: entry.id },
    data: {
      accumulatedSeconds: effectiveSeconds(entry),
      targetMinutes: Math.max(entry.targetMinutes, studiedMinutes) + EXTEND_MINUTES,
      completed: false,
      runningSince: new Date(),
    },
  });

  revalidateStudy();
}

/** Suma tiempo estudiado sin el temporizador a la sesión de hoy. */
export async function logStudyMinutes(
  target: { entryId: string | null; subjectId: string | null },
  formData: FormData
): Promise<{ error: string } | undefined> {
  const { userId } = await verifySession();

  const minutes = logSchema.safeParse(formData.get("minutes"));
  if (!minutes.success) return { error: minutes.error.issues[0].message };

  const entry = target.entryId
    ? await prisma.studyEntry.findFirst({ where: { id: target.entryId, userId } })
    : target.subjectId
      ? await getOrCreateTodayEntry(userId, target.subjectId)
      : null;
  if (!entry) return { error: "Esta materia ya no existe." };

  const seconds = effectiveSeconds(entry) + minutes.data * 60;
  const reachedTarget = seconds >= entry.targetMinutes * 60;
  const keepRunning = Boolean(entry.runningSince) && !reachedTarget;

  await prisma.studyEntry.update({
    where: { id: entry.id },
    data: {
      accumulatedSeconds: seconds,
      runningSince: keepRunning ? new Date() : null,
      completed: reachedTarget,
    },
  });

  revalidateStudy();
}

export async function deleteStudy(id: string) {
  const { userId } = await verifySession();

  await prisma.studyEntry.deleteMany({ where: { id, userId } });

  revalidateStudy();
}
