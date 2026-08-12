"use client";

import { useRef, useState, useTransition } from "react";
import { addMeal } from "@/actions/meals";
import { analyzeMealPhoto } from "@/actions/analyze-meal-photo";
import { recalculateIngredients } from "@/actions/recalculate-ingredients";
import { sumIngredientMacros, type MealIngredient } from "@/lib/meal-ingredients";
import { DAILY_PHOTO_LIMIT } from "@/lib/meal-photo";
import { Label, Textarea, FieldError } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { AnalyzingSpinner } from "@/components/ui/analyzing-spinner";
import { SubmitButton } from "@/components/submit-button";
import { CameraCapture } from "@/components/camera-capture";
import { MealAnalysisResult } from "@/components/meal-analysis-result";
import { SavedMealPicker, type SavedMealSummary } from "@/components/saved-meal-picker";

const TEXT_PLACEHOLDER = "Título\n• 2 huevos\n• Carne porción pequeña...";

async function compressImage(file: File, maxDimension = 1024, quality = 0.7): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/jpeg", quality)
  );
  if (!blob) return file;
  return new File([blob], "meal.jpg", { type: "image/jpeg" });
}

function supportsLiveCamera() {
  return typeof navigator !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia);
}

type InputMode = "FOTO" | "TEXTO";

const INPUT_MODE_OPTIONS: { value: InputMode; label: string }[] = [
  { value: "FOTO", label: "Foto" },
  { value: "TEXTO", label: "Texto" },
];

export function AddMealForm({
  type,
  remainingPhotos,
  savedMeals = [],
  onDone,
}: {
  type: "DESAYUNO" | "ALMUERZO" | "CENA" | "SNACK";
  remainingPhotos: number;
  savedMeals?: SavedMealSummary[];
  onDone?: () => void;
}) {
  const [inputMode, setInputMode] = useState<InputMode>("FOTO");
  const [isAnalyzing, startAnalysis] = useTransition();
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(remainingPhotos);
  const [showCamera, setShowCamera] = useState(false);
  const fallbackFileInputRef = useRef<HTMLInputElement>(null);
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState<MealIngredient[]>([]);
  const [textDraft, setTextDraft] = useState("");

  function resetForm() {
    setDescription("");
    setIngredients([]);
    setTextDraft("");
    setAnalysisError(null);
  }

  async function handleSubmit(formData: FormData) {
    formData.set("description", description || ingredients.map((i) => i.name).join(", "));

    if (ingredients.length > 0) {
      const totals = sumIngredientMacros(ingredients);
      formData.set("ingredients", JSON.stringify(ingredients));
      formData.set("calories", String(Math.round(totals.calories)));
      formData.set("proteinG", String(totals.proteinG));
      formData.set("carbsG", String(totals.carbsG));
      formData.set("fatG", String(totals.fatG));
    }

    await addMeal(formData);
    resetForm();
    onDone?.();
  }

  function handleCapturedPhoto(file: File) {
    setShowCamera(false);
    setAnalysisError(null);

    startAnalysis(async () => {
      const compressed = await compressImage(file);
      const photoFormData = new FormData();
      photoFormData.set("photo", compressed);

      const result = await analyzeMealPhoto(photoFormData);
      setRemaining(result.remaining);

      if (!result.ok) {
        setAnalysisError(result.error);
        return;
      }

      setDescription(result.data.title);
      setIngredients(result.data.ingredients);
    });
  }

  function handleAnalyzeText() {
    const lines = textDraft
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length === 0) return;

    const [titleLine, ...ingredientLines] = lines;

    setAnalysisError(null);
    startAnalysis(async () => {
      if (ingredientLines.length === 0) {
        setAnalysisError("Escribe al menos un ingrediente además del título.");
        return;
      }

      const result = await recalculateIngredients(ingredientLines);
      if (!result.ok) {
        setAnalysisError(result.error);
        return;
      }

      setDescription(titleLine);
      setIngredients(result.data.ingredients);
      setTextDraft("");
    });
  }

  function handleSelectSavedMeal(meal: SavedMealSummary) {
    setDescription(meal.title);
    setIngredients(meal.ingredients);
  }

  const hasResult = ingredients.length > 0;

  return (
    <form action={handleSubmit} className="space-y-4">
      {isAnalyzing ? (
        <Card className="flex flex-col items-center gap-3 py-8">
          <AnalyzingSpinner className="size-12" />
          <p className="text-sm text-muted">Analizando tu comida…</p>
        </Card>
      ) : hasResult ? (
        <MealAnalysisResult
          description={description}
          onDescriptionChange={setDescription}
          ingredients={ingredients}
          onIngredientsChange={setIngredients}
        />
      ) : (
        <>
          <SegmentedControl
            layoutId={`add-meal-input-mode-${type}`}
            options={INPUT_MODE_OPTIONS}
            value={inputMode}
            onChange={setInputMode}
          />

          {inputMode === "FOTO" ? (
            <div>
              <Label>Foto de la comida</Label>
              <Button
                type="button"
                variant="secondary"
                disabled={remaining <= 0}
                onClick={() => {
                  if (supportsLiveCamera()) {
                    setShowCamera(true);
                  } else {
                    fallbackFileInputRef.current?.click();
                  }
                }}
              >
                Analizar
              </Button>
              <input
                ref={fallbackFileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (file) handleCapturedPhoto(file);
                }}
              />
              <p className="mt-1 text-xs text-muted">
                {remaining > 0
                  ? `Te quedan ${remaining} de ${DAILY_PHOTO_LIMIT} fotos por analizar hoy.`
                  : `Llegaste al límite de ${DAILY_PHOTO_LIMIT} fotos analizadas hoy. Cambia a "Texto".`}
              </p>
              <FieldError messages={analysisError ? [analysisError] : undefined} />
            </div>
          ) : (
            <div>
              <Label>Describe tu comida</Label>
              <Textarea
                rows={4}
                placeholder={TEXT_PLACEHOLDER}
                value={textDraft}
                onChange={(e) => setTextDraft(e.target.value)}
              />
              <Button
                type="button"
                variant="secondary"
                className="mt-2 w-full"
                disabled={!textDraft.trim()}
                onClick={handleAnalyzeText}
              >
                Analizar
              </Button>
              <FieldError messages={analysisError ? [analysisError] : undefined} />
            </div>
          )}

          {savedMeals.length > 0 && (
            <SavedMealPicker savedMeals={savedMeals} onSelect={handleSelectSavedMeal} />
          )}
        </>
      )}

      {showCamera && (
        <CameraCapture onCapture={handleCapturedPhoto} onClose={() => setShowCamera(false)} />
      )}

      <input type="hidden" name="type" value={type} />

      <SubmitButton disabled={!hasResult}>Agregar comida</SubmitButton>
    </form>
  );
}
