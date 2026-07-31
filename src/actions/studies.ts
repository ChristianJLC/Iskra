"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";

export async function addStudy(formData: FormData) {
  const { userId } = await verifySession();

  const subject = (formData.get("subject") as string)?.trim();
  const targetMinutes = Number(formData.get("targetMinutes"));

  if (!subject || !targetMinutes || targetMinutes <= 0) return;

  await prisma.studyEntry.create({
    data: { userId, subject, targetMinutes },
  });

  revalidatePath("/estudio");
  revalidatePath("/");
}

export async function updateStudyProgress(id: string, formData: FormData) {
  const { userId } = await verifySession();

  const actualMinutes = Number(formData.get("actualMinutes"));
  if (Number.isNaN(actualMinutes) || actualMinutes < 0) return;

  const entry = await prisma.studyEntry.findFirst({ where: { id, userId } });
  if (!entry) return;

  await prisma.studyEntry.update({
    where: { id },
    data: {
      actualMinutes,
      completed: actualMinutes >= entry.targetMinutes,
    },
  });

  revalidatePath("/estudio");
  revalidatePath("/");
}

export async function deleteStudy(id: string) {
  const { userId } = await verifySession();

  await prisma.studyEntry.deleteMany({ where: { id, userId } });

  revalidatePath("/estudio");
  revalidatePath("/");
}
