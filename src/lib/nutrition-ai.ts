import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { MEAL_INGREDIENT_PORTIONS, sumIngredientMacros, type MealIngredient } from "@/lib/meal-ingredients";

const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
const ANTHROPIC_PHOTO_MODEL = process.env.ANTHROPIC_PHOTO_MODEL || "claude-haiku-4-5-20251001";

export type NutritionEstimate = {
  title: string;
  description: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  ingredients: MealIngredient[];
};

export type NutritionEstimateResult =
  | { ok: true; data: NutritionEstimate }
  | { ok: false; error: string };

const INGREDIENT_SCHEMA = {
  type: "object" as const,
  properties: {
    name: { type: "string" as const, description: "Nombre del ingrediente, ej. 'Plátano', 'Pechuga de pollo'." },
    calories: { type: "integer" as const, description: "Calorías estimadas para la porción de este ingrediente." },
    protein_g: { type: "number" as const, description: "Proteína en gramos de este ingrediente." },
    carbs_g: { type: "number" as const, description: "Carbohidratos en gramos de este ingrediente." },
    fat_g: { type: "number" as const, description: "Grasa en gramos de este ingrediente." },
    portion_size: {
      type: ["string", "null"] as const,
      enum: [...MEAL_INGREDIENT_PORTIONS, null],
      description:
        "Tamaño de porción SOLO si el ingrediente es una carne, pollo o pescado (proteína animal principal). " +
        "null para cualquier otro ingrediente (vegetales, carbohidratos, lácteos, condimentos, suplementos, etc.).",
    },
  },
  required: ["name", "calories", "protein_g", "carbs_g", "fat_g", "portion_size"],
};

const NUTRITION_TOOL = {
  name: "record_nutrition_estimate",
  description: "Registra la estimación nutricional de la comida mostrada en la foto, desglosada por ingrediente.",
  input_schema: {
    type: "object" as const,
    properties: {
      is_food: {
        type: "boolean" as const,
        description:
          "true si la imagen muestra comida identificable; false si no se puede identificar comida (foto borrosa, plato vacío, objeto no comestible, etc.)",
      },
      title: {
        type: "string" as const,
        description:
          "Nombre corto sugerido para la comida (2-4 palabras), ej. 'Batido Proteico', 'Pollo con arroz'. Cadena vacía si is_food es false.",
      },
      description: {
        type: "string" as const,
        description:
          "Descripción breve en español de la comida y la porción estimada, ej. 'Plato de pasta con pollo, aprox. 350g'. Si is_food es false, explica brevemente por qué no se pudo identificar.",
      },
      ingredients: {
        type: "array" as const,
        description:
          "Lista de ingredientes identificados en la foto, cada uno con su propio aporte nutricional estimado. Arreglo vacío si is_food es false.",
        items: INGREDIENT_SCHEMA,
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
    required: ["is_food", "title", "description", "ingredients", "calories", "protein_g", "carbs_g", "fat_g"],
  },
};

type IngredientToolInput = {
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  portion_size: (typeof MEAL_INGREDIENT_PORTIONS)[number] | null;
};

type NutritionToolInput = {
  is_food: boolean;
  title: string;
  description: string;
  ingredients: IngredientToolInput[];
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
};

function mapIngredients(input: IngredientToolInput[]): MealIngredient[] {
  return input.map((i) => ({
    name: i.name,
    calories: Math.round(i.calories),
    proteinG: i.protein_g,
    carbsG: i.carbs_g,
    fatG: i.fat_g,
    portion: i.portion_size,
  }));
}

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
        "Eres un asistente que estima información nutricional a partir de fotos de comida, desglosada por " +
        "ingrediente. Sé conservador y da tu mejor estimación aunque no sea exacta. Para cada ingrediente que " +
        "sea carne, pollo o pescado, clasifica su porción como PEQUENO, MEDIANO o GRANDE; para el resto de " +
        "ingredientes usa null. Responde siempre usando la herramienta record_nutrition_estimate.",
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

    const ingredients = mapIngredients(input.ingredients);
    const totals =
      ingredients.length > 0
        ? sumIngredientMacros(ingredients)
        : { calories: input.calories, proteinG: input.protein_g, carbsG: input.carbs_g, fatG: input.fat_g };

    return {
      ok: true,
      data: {
        title: input.title || input.description.slice(0, 40),
        description: input.description,
        calories: Math.round(totals.calories),
        proteinG: totals.proteinG,
        carbsG: totals.carbsG,
        fatG: totals.fatG,
        ingredients,
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

export type IngredientRecalculationResult =
  | { ok: true; data: { ingredients: MealIngredient[] } }
  | { ok: false; error: string };

const RECALCULATE_INGREDIENTS_TOOL = {
  name: "record_ingredient_estimates",
  description:
    "Registra la estimación nutricional de cada ingrediente de una lista, asumiendo una porción individual típica.",
  input_schema: {
    type: "object" as const,
    properties: {
      ingredients: {
        type: "array" as const,
        description: "Un elemento por cada nombre de ingrediente recibido, en el mismo orden.",
        items: INGREDIENT_SCHEMA,
      },
    },
    required: ["ingredients"],
  },
};

export async function recalculateNutritionFromIngredients(
  ingredientNames: string[]
): Promise<IngredientRecalculationResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { ok: false, error: "El cálculo de ingredientes no está configurado." };
  }
  if (ingredientNames.length === 0) {
    return { ok: true, data: { ingredients: [] } };
  }

  const client = new Anthropic();

  try {
    const response = await client.messages.create({
      model: ANTHROPIC_PHOTO_MODEL,
      max_tokens: 1024,
      system:
        "Eres un asistente que estima información nutricional de una lista de ingredientes de comida, " +
        "asumiendo una porción individual razonable para cada uno. Para cada ingrediente que sea carne, pollo " +
        "o pescado, clasifica su porción como PEQUENO, MEDIANO o GRANDE; para el resto usa null. Responde " +
        "siempre usando la herramienta record_ingredient_estimates, con un elemento de salida por cada " +
        "ingrediente de entrada, en el mismo orden.",
      tools: [RECALCULATE_INGREDIENTS_TOOL],
      tool_choice: { type: "tool", name: "record_ingredient_estimates" },
      messages: [{ role: "user", content: `Ingredientes: ${ingredientNames.join(", ")}` }],
    });

    if (response.stop_reason === "refusal") {
      return { ok: false, error: "No se pudo calcular la lista de ingredientes." };
    }

    const toolUse = response.content.find(
      (block): block is Anthropic.ToolUseBlock =>
        block.type === "tool_use" && block.name === "record_ingredient_estimates"
    );

    if (!toolUse) {
      return { ok: false, error: "No se pudo calcular la lista de ingredientes." };
    }

    const input = toolUse.input as { ingredients: IngredientToolInput[] };

    return { ok: true, data: { ingredients: mapIngredients(input.ingredients) } };
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return { ok: false, error: "Demasiadas solicitudes, intenta de nuevo en un momento." };
    }
    if (error instanceof Anthropic.APIConnectionError) {
      return { ok: false, error: "No se pudo conectar con el servicio de análisis. Revisa tu conexión." };
    }
    return { ok: false, error: "Ocurrió un error al calcular los ingredientes." };
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
