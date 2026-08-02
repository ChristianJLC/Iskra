"use server";

import { verifySession } from "@/lib/dal";
import { estimateNutritionFromPhoto, type NutritionEstimateResult } from "@/lib/nutrition-ai";

const MAX_PHOTO_BYTES = 6 * 1024 * 1024;
const ALLOWED_MEDIA_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function analyzeMealPhoto(formData: FormData): Promise<NutritionEstimateResult> {
  await verifySession();

  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "No se recibió ninguna foto." };
  }
  if (!ALLOWED_MEDIA_TYPES.has(file.type)) {
    return { ok: false, error: "El archivo debe ser una imagen (JPEG, PNG o WEBP)." };
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return { ok: false, error: "La imagen es demasiado grande." };
  }

  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");

  return estimateNutritionFromPhoto(base64, file.type as "image/jpeg" | "image/png" | "image/webp");
}
