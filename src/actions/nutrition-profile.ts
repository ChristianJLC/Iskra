"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { estimateNutritionPlan, type NutritionPlan, type NutritionPlanInput } from "@/lib/nutrition-ai";

export type PlanActionState =
  | { status: "idle" }
  | { status: "error"; error: string }
  | { status: "success"; plan: NutritionPlan };

async function computeAndSavePlan(userId: string, input: NutritionPlanInput): Promise<PlanActionState> {
  const result = await estimateNutritionPlan(input);

  if (!result.ok) {
    return { status: "error", error: result.error };
  }

  await prisma.nutritionProfile.update({
    where: { userId },
    data: {
      targetCalories: result.data.calories,
      targetCalorieMin: result.data.calorieRangeMin,
      targetCalorieMax: result.data.calorieRangeMax,
      targetProteinG: result.data.proteinG,
      targetCarbsG: result.data.carbsG,
      targetFatG: result.data.fatG,
    },
  });

  return { status: "success", plan: result.data };
}

export async function generateNutritionPlan(
  _prevState: PlanActionState,
  formData: FormData
): Promise<PlanActionState> {
  const { userId } = await verifySession();

  const goal = formData.get("goal") as string;
  const sex = formData.get("sex") as string;
  const age = Number(formData.get("age"));
  const heightCm = Number(formData.get("height"));
  const weightKg = Number(formData.get("weight"));
  const activityLevel = formData.get("activityLevel") as string;
  const strengthTraining = formData.get("strengthTraining") as string;
  const dietType = formData.get("dietType") as string;
  const targetWeightKg = Number(formData.get("targetWeight"));
  const speed = formData.get("speed") as string;

  if (
    !goal ||
    !sex ||
    !Number.isFinite(age) ||
    !Number.isFinite(heightCm) ||
    !Number.isFinite(weightKg) ||
    !activityLevel ||
    !strengthTraining ||
    !dietType ||
    !Number.isFinite(targetWeightKg) ||
    !speed
  ) {
    return { status: "error", error: "Faltan datos del perfil." };
  }

  const data: NutritionPlanInput = {
    goal: goal as "PERDER_GRASA" | "GANAR_MUSCULO" | "MANTENER_PESO",
    sex: sex as "HOMBRE" | "MUJER",
    age: Math.round(age),
    heightCm,
    weightKg,
    activityLevel: activityLevel as
      | "SEDENTARIO"
      | "LIGERAMENTE_ACTIVO"
      | "MODERADAMENTE_ACTIVO"
      | "MUY_ACTIVO"
      | "ATLETA_PROFESIONAL",
    strengthTraining: strengthTraining === "true",
    dietType: dietType as
      | "RECOMENDADA"
      | "ALTA_PROTEINA"
      | "BAJA_CARBOHIDRATOS"
      | "KETO"
      | "BAJA_GRASAS",
    targetWeightKg,
    speed: speed as "RECOMENDADO" | "RAPIDO" | "LENTO",
  };

  await prisma.nutritionProfile.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data },
  });

  return computeAndSavePlan(userId, data);
}

export async function recalculateNutritionPlan() {
  const { userId } = await verifySession();

  const profile = await prisma.nutritionProfile.findUnique({ where: { userId } });
  if (
    !profile?.goal ||
    !profile.sex ||
    profile.age == null ||
    profile.heightCm == null ||
    profile.weightKg == null ||
    !profile.activityLevel ||
    profile.strengthTraining == null ||
    !profile.dietType ||
    profile.targetWeightKg == null ||
    !profile.speed
  ) {
    return;
  }

  await computeAndSavePlan(userId, {
    goal: profile.goal,
    sex: profile.sex,
    age: profile.age,
    heightCm: profile.heightCm,
    weightKg: profile.weightKg,
    activityLevel: profile.activityLevel,
    strengthTraining: profile.strengthTraining,
    dietType: profile.dietType,
    targetWeightKg: profile.targetWeightKg,
    speed: profile.speed,
  });

  revalidatePath("/comidas");
}

export async function finishOnboarding() {
  const { userId } = await verifySession();

  await prisma.nutritionProfile.update({
    where: { userId },
    data: { completedAt: new Date() },
  });

  revalidatePath("/comidas");
}
