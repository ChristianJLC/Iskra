"use server";

import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { startOfToday, endOfToday } from "@/lib/date";
import { estimateNutritionFromPhoto, type NutritionEstimateResult } from "@/lib/nutrition-ai";
import { DAILY_PHOTO_LIMIT } from "@/lib/meal-photo";
import { cacheIngredients } from "@/lib/ingredient-cache";

const MAX_PHOTO_BYTES = 6 * 1024 * 1024;
const ALLOWED_MEDIA_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export type AnalyzeMealPhotoResult = NutritionEstimateResult & { remaining: number };

async function countUsedToday(userId: string) {
  return prisma.mealPhotoAnalysis.count({
    where: { userId, createdAt: { gte: startOfToday(), lt: endOfToday() } },
  });
}

export async function analyzeMealPhoto(formData: FormData): Promise<AnalyzeMealPhotoResult> {
  const { userId } = await verifySession();

  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    const remaining = Math.max(0, DAILY_PHOTO_LIMIT - (await countUsedToday(userId)));
    return { ok: false, error: "No se recibió ninguna foto.", remaining };
  }
  if (!ALLOWED_MEDIA_TYPES.has(file.type)) {
    const remaining = Math.max(0, DAILY_PHOTO_LIMIT - (await countUsedToday(userId)));
    return { ok: false, error: "El archivo debe ser una imagen (JPEG, PNG o WEBP).", remaining };
  }
  if (file.size > MAX_PHOTO_BYTES) {
    const remaining = Math.max(0, DAILY_PHOTO_LIMIT - (await countUsedToday(userId)));
    return { ok: false, error: "La imagen es demasiado grande.", remaining };
  }

  const usedToday = await countUsedToday(userId);
  if (usedToday >= DAILY_PHOTO_LIMIT) {
    return {
      ok: false,
      error: `Llegaste al límite de ${DAILY_PHOTO_LIMIT} fotos analizadas por día. Ingresa los datos manualmente o intenta de nuevo mañana.`,
      remaining: 0,
    };
  }

  await prisma.mealPhotoAnalysis.create({ data: { userId } });
  const remaining = DAILY_PHOTO_LIMIT - usedToday - 1;

  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
  const result = await estimateNutritionFromPhoto(
    base64,
    file.type as "image/jpeg" | "image/png" | "image/webp"
  );

  if (result.ok && result.data.ingredients.length > 0) {
    await cacheIngredients(userId, result.data.ingredients);
  }

  return { ...result, remaining };
}
