"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { isValidAvatarId } from "@/lib/avatars";

export async function updateName(name: string) {
  const { userId } = await verifySession();

  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 100) return;

  await prisma.user.update({ where: { id: userId }, data: { name: trimmed } });
  revalidatePath("/", "layout");
}

export async function setAvatar(avatarId: string | null) {
  const { userId } = await verifySession();

  if (avatarId !== null && !isValidAvatarId(avatarId)) return;

  await prisma.user.update({ where: { id: userId }, data: { avatarId } });
  revalidatePath("/", "layout");
}
