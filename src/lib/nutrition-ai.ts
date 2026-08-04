import "server-only";
import Anthropic from "@anthropic-ai/sdk";

const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
const ANTHROPIC_PHOTO_MODEL = process.env.ANTHROPIC_PHOTO_MODEL || "claude-haiku-4-5-20251001";

export type NutritionEstimate = {
  description: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

export type NutritionEstimateResult =
  | { ok: true; data: NutritionEstimate }
  | { ok: false; error: string };

const NUTRITION_TOOL = {
  name: "record_nutrition_estimate",
  description: "Registra la estimación nutricional de la comida mostrada en la foto.",
  input_schema: {
    type: "object" as const,
    properties: {
      is_food: {
        type: "boolean" as const,
        description:
          "true si la imagen muestra comida identificable; false si no se puede identificar comida (foto borrosa, plato vacío, objeto no comestible, etc.)",
      },
      description: {
        type: "string" as const,
        description:
          "Descripción breve en español de la comida y la porción estimada, ej. 'Plato de pasta con pollo, aprox. 350g'. Si is_food es false, explica brevemente por qué no se pudo identificar.",
      },
      calories: {
        type: "integer" as const,
        description: "Calorías totales estimadas (kcal) para la porción mostrada. 0 si is_food es false.",
      },
      protein_g: {
        type: "number" as const,
        description: "Proteína estimada en gramos. 0 si is_food es false.",
      },
      carbs_g: {
        type: "number" as const,
        description: "Carbohidratos estimados en gramos. 0 si is_food es false.",
      },
      fat_g: {
        type: "number" as const,
        description: "Grasa estimada en gramos. 0 si is_food es false.",
      },
    },
    required: ["is_food", "description", "calories", "protein_g", "carbs_g", "fat_g"],
  },
};

type NutritionToolInput = {
  is_food: boolean;
  description: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
};

export async function estimateNutritionFromPhoto(
  base64Image: string,
  mediaType: "image/jpeg" | "image/png" | "image/webp"
): Promise<NutritionEstimateResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { ok: false, error: "El análisis de fotos no está configurado." };
  }

  const client = new Anthropic();

  try {
    const response = await client.messages.create({
      model: ANTHROPIC_PHOTO_MODEL,
      max_tokens: 1024,
      system:
        "Eres un asistente que estima información nutricional a partir de fotos de comida. " +
        "Sé conservador y da tu mejor estimación aunque no sea exacta. Responde siempre usando la " +
        "herramienta record_nutrition_estimate.",
      tools: [NUTRITION_TOOL],
      tool_choice: { type: "tool", name: "record_nutrition_estimate" },
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: base64Image } },
            { type: "text", text: "Analiza esta foto de comida y estima su información nutricional." },
          ],
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      return { ok: false, error: "No se pudo analizar la foto. Intenta con otra imagen." };
    }

    const toolUse = response.content.find(
      (block): block is Anthropic.ToolUseBlock =>
        block.type === "tool_use" && block.name === "record_nutrition_estimate"
    );

    if (!toolUse) {
      return { ok: false, error: "No se pudo analizar la foto. Intenta con otra imagen." };
    }

    const input = toolUse.input as NutritionToolInput;

    if (!input.is_food) {
      return {
        ok: false,
        error: "No pudimos identificar comida en la foto. Intenta con otra imagen o ingresa los datos manualmente.",
      };
    }

    return {
      ok: true,
      data: {
        description: input.description,
        calories: Math.round(input.calories),
        proteinG: input.protein_g,
        carbsG: input.carbs_g,
        fatG: input.fat_g,
      },
    };
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return { ok: false, error: "Demasiadas solicitudes, intenta de nuevo en un momento." };
    }
    if (error instanceof Anthropic.APIConnectionError) {
      return { ok: false, error: "No se pudo conectar con el servicio de análisis. Revisa tu conexión." };
    }
    return { ok: false, error: "Ocurrió un error al analizar la foto." };
  }
}

export type NutritionPlanInput = {
  goal: "PERDER_GRASA" | "GANAR_MUSCULO" | "MANTENER_PESO";
  sex: "HOMBRE" | "MUJER";
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel:
    | "SEDENTARIO"
    | "LIGERAMENTE_ACTIVO"
    | "MODERADAMENTE_ACTIVO"
    | "MUY_ACTIVO"
    | "ATLETA_PROFESIONAL";
  strengthTraining: boolean;
  dietType: "RECOMENDADA" | "ALTA_PROTEINA" | "BAJA_CARBOHIDRATOS" | "KETO" | "BAJA_GRASAS";
  targetWeightKg: number;
  speed: "RECOMENDADO" | "RAPIDO" | "LENTO";
};

export type NutritionPlan = {
  calories: number;
  calorieRangeMin: number;
  calorieRangeMax: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

export type NutritionPlanResult = { ok: true; data: NutritionPlan } | { ok: false; error: string };

const GOAL_LABELS: Record<NutritionPlanInput["goal"], string> = {
  PERDER_GRASA: "Perder grasa (perder peso conservando la masa muscular)",
  GANAR_MUSCULO: "Ganar músculo (subir de peso y hacerse más fuerte)",
  MANTENER_PESO: "Mantener peso (recomposición corporal)",
};

const ACTIVITY_LABELS: Record<NutritionPlanInput["activityLevel"], string> = {
  SEDENTARIO: "sedentario (poco o nada de ejercicio)",
  LIGERAMENTE_ACTIVO: "ligeramente activo (ejercicio 2 a 3 días por semana)",
  MODERADAMENTE_ACTIVO: "moderadamente activo (ejercicio 4 a 5 días por semana)",
  MUY_ACTIVO: "muy activo (ejercicio 6 a 7 días por semana)",
  ATLETA_PROFESIONAL: "atleta profesional (ejercicio intenso 6 a 7 días por semana)",
};

const DIET_LABELS: Record<NutritionPlanInput["dietType"], string> = {
  RECOMENDADA: "recomendada (mezcla óptima de proteínas, carbohidratos y grasas)",
  ALTA_PROTEINA: "alta en proteína (más proteínas, menos carbohidratos y grasas)",
  BAJA_CARBOHIDRATOS: "baja en carbohidratos (menos carbohidratos, más grasas y proteínas moderadas)",
  KETO: "keto (muy baja en carbohidratos, alta en grasas y proteínas moderadas)",
  BAJA_GRASAS: "baja en grasas (menos grasas, más carbohidratos y proteínas moderadas)",
};

const SPEED_LABELS: Record<NutritionPlanInput["speed"], string> = {
  RECOMENDADO:
    "recomendada (gran pérdida/ganancia de peso sin afectar la masa muscular, resultados visibles en el corto plazo, alimentación sostenible)",
  RAPIDO:
    "rápida (resultados visibles en menor tiempo, posible ligera pérdida de masa magra por un mayor déficit/superávit calórico, alimentación más restrictiva)",
  LENTO:
    "lenta (alimentación menos restrictiva y más flexible, posible desarrollo de masa muscular si hay entrenamiento de fuerza, resultados algo más lentos en verse)",
};

function buildProfileSummary(input: NutritionPlanInput): string {
  const sexLabel = input.sex === "HOMBRE" ? "hombre" : "mujer";
  return (
    `Quiero ${GOAL_LABELS[input.goal]}. Soy ${sexLabel}, tengo ${input.age} años, ` +
    `mido ${input.heightCm}cm de altura y peso ${input.weightKg}kg actualmente. ` +
    `Mi nivel de actividad física es ${ACTIVITY_LABELS[input.activityLevel]}. ` +
    `${input.strengthTraining ? "Sí realizo" : "No realizo"} entrenamientos de fuerza. ` +
    `Prefiero una dieta ${DIET_LABELS[input.dietType]}. ` +
    `Mi objetivo es llegar a ${input.targetWeightKg}kg, con una velocidad ${SPEED_LABELS[input.speed]}.`
  );
}

const NUTRITION_PLAN_TOOL = {
  name: "record_nutrition_plan",
  description: "Registra el plan de calorías y macronutrientes calculado para el usuario.",
  input_schema: {
    type: "object" as const,
    properties: {
      calories: {
        type: "integer" as const,
        description: "Calorías diarias objetivo recomendadas (punto medio del rango).",
      },
      calorie_range_min: {
        type: "integer" as const,
        description: "Límite inferior del rango de calorías diarias razonable.",
      },
      calorie_range_max: {
        type: "integer" as const,
        description: "Límite superior del rango de calorías diarias razonable.",
      },
      protein_g: {
        type: "integer" as const,
        description: "Gramos de proteína diarios recomendados.",
      },
      carbs_g: {
        type: "integer" as const,
        description: "Gramos de carbohidratos diarios recomendados.",
      },
      fat_g: {
        type: "integer" as const,
        description: "Gramos de grasa diarios recomendados.",
      },
    },
    required: ["calories", "calorie_range_min", "calorie_range_max", "protein_g", "carbs_g", "fat_g"],
  },
};

type NutritionPlanToolInput = {
  calories: number;
  calorie_range_min: number;
  calorie_range_max: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
};

export async function estimateNutritionPlan(input: NutritionPlanInput): Promise<NutritionPlanResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { ok: false, error: "El cálculo de tu plan no está configurado." };
  }

  const client = new Anthropic();

  try {
    const response = await client.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 1024,
      system:
        "Eres un nutricionista experto. A partir del perfil del usuario, calcula su tasa metabólica basal " +
        "(fórmula Mifflin-St Jeor), aplica el factor de actividad correspondiente, y ajusta el resultado según " +
        "su objetivo y la velocidad elegida para definir sus calorías diarias objetivo (con un rango razonable) " +
        "y la distribución de macronutrientes (proteína, carbohidratos y grasa en gramos) según el tipo de dieta " +
        "preferido. Responde siempre usando la herramienta record_nutrition_plan.",
      tools: [NUTRITION_PLAN_TOOL],
      tool_choice: { type: "tool", name: "record_nutrition_plan" },
      messages: [{ role: "user", content: buildProfileSummary(input) }],
    });

    if (response.stop_reason === "refusal") {
      return { ok: false, error: "No se pudo calcular tu plan. Intenta de nuevo." };
    }

    const toolUse = response.content.find(
      (block): block is Anthropic.ToolUseBlock =>
        block.type === "tool_use" && block.name === "record_nutrition_plan"
    );

    if (!toolUse) {
      return { ok: false, error: "No se pudo calcular tu plan. Intenta de nuevo." };
    }

    const output = toolUse.input as NutritionPlanToolInput;

    return {
      ok: true,
      data: {
        calories: Math.round(output.calories),
        calorieRangeMin: Math.round(output.calorie_range_min),
        calorieRangeMax: Math.round(output.calorie_range_max),
        proteinG: Math.round(output.protein_g),
        carbsG: Math.round(output.carbs_g),
        fatG: Math.round(output.fat_g),
      },
    };
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return { ok: false, error: "Demasiadas solicitudes, intenta de nuevo en un momento." };
    }
    if (error instanceof Anthropic.APIConnectionError) {
      return { ok: false, error: "No se pudo conectar con el servicio de análisis. Revisa tu conexión." };
    }
    return { ok: false, error: "Ocurrió un error al calcular tu plan." };
  }
}
