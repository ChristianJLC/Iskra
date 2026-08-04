"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { startOfToday, endOfToday } from "@/lib/date";
import { effectiveSeconds } from "@/lib/study";

function revalidateStudy() {
  revalidatePath("/estudio");
  revalidatePath("/estudio/historial");
  revalidatePath("/");
}

export async function createSubjectAndAddToday(formData: FormData) {
  const { userId } = await verifySession();

  const name = (formData.get("name") as string)?.trim();
  const targetMinutes = Number(formData.get("targetMinutes"));

  if (!name || !targetMinutes || targetMinutes <= 0) return;

  const subject = await prisma.studySubject.upsert({
    where: { userId_name: { userId, name } },
    update: { targetMinutes },
    create: { userId, name, targetMinutes },
  });

  const existing = await prisma.studyEntry.findFirst({
    where: { userId, subjectId: subject.id, date: { gte: startOfToday(), lt: endOfToday() } },
  });
  if (!existing) {
    await prisma.studyEntry.create({
      data: {
        userId,
        subjectId: subject.id,
        subjectName: subject.name,
        targetMinutes: subject.targetMinutes,
      },
    });
  }

  revalidateStudy();
}

export async function addTodayEntryFromSubject(subjectId: string) {
  const { userId } = await verifySession();

  const subject = await prisma.studySubject.findFirst({ where: { id: subjectId, userId } });
  if (!subject) return;

  const existing = await prisma.studyEntry.findFirst({
    where: { userId, subjectId: subject.id, date: { gte: startOfToday(), lt: endOfToday() } },
  });
  if (existing) return;

  await prisma.studyEntry.create({
    data: {
      userId,
      subjectId: subject.id,
      subjectName: subject.name,
      targetMinutes: subject.targetMinutes,
    },
  });

  revalidateStudy();
}

export async function startTimer(entryId: string) {
  const { userId } = await verifySession();

  const entry = await prisma.studyEntry.findFirst({ where: { id: entryId, userId } });
  if (!entry || entry.runningSince) return;

  await prisma.studyEntry.update({
    where: { id: entryId },
    data: { runningSince: new Date() },
  });

  revalidateStudy();
}

export async function pauseTimer(entryId: string) {
  const { userId } = await verifySession();

  const entry = await prisma.studyEntry.findFirst({ where: { id: entryId, userId } });
  if (!entry || !entry.runningSince) return;

  const accumulatedSeconds = effectiveSeconds(entry);

  await prisma.studyEntry.update({
    where: { id: entryId },
    data: {
      accumulatedSeconds,
      runningSince: null,
      completed: Math.floor(accumulatedSeconds / 60) >= entry.targetMinutes,
    },
  });

  revalidateStudy();
}

export async function deleteStudy(id: string) {
  const { userId } = await verifySession();

  await prisma.studyEntry.deleteMany({ where: { id, userId } });

  revalidateStudy();
}

export async function deleteSubject(id: string) {
  const { userId } = await verifySession();

  await prisma.studySubject.deleteMany({ where: { id, userId } });

  revalidateStudy();
}
