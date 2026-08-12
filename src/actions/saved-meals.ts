"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";

export async function deleteSavedMeal(id: string) {
  const { userId } = await verifySession();

  await prisma.savedMeal.deleteMany({ where: { id, userId } });

  revalidatePath("/comidas/alimentos");
}
