import "server-only";
import Anthropic from "@anthropic-ai/sdk";

const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

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
      model: ANTHROPIC_MODEL,
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
