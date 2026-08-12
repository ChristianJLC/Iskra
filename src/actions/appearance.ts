"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { HEX_COLOR_PATTERN } from "@/lib/accent-color";

export async function saveAccentColors(accentColor: string, accentColor2: string) {
  const { userId } = await verifySession();

  if (!HEX_COLOR_PATTERN.test(accentColor) || !HEX_COLOR_PATTERN.test(accentColor2)) {
    return;
  }

  await prisma.user.update({ where: { id: userId }, data: { accentColor, accentColor2 } });
  revalidatePath("/", "layout");
}

export async function resetAccentColors() {
  const { userId } = await verifySession();

  await prisma.user.update({ where: { id: userId }, data: { accentColor: null, accentColor2: null } });
  revalidatePath("/", "layout");
}
