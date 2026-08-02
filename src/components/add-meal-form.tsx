"use client";

import { useRef, useState, useTransition, type ChangeEvent } from "react";
import { addMeal } from "@/actions/meals";
import { analyzeMealPhoto } from "@/actions/analyze-meal-photo";
import { Input, Label, FieldError } from "@/components/ui/input";
import { SubmitButton } from "@/components/submit-button";

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

const EMPTY_FORM = {
  description: "",
  calories: "",
  proteinG: "",
  carbsG: "",
  fatG: "",
};

export function AddMealForm() {
  const [isAnalyzing, startAnalysis] = useTransition();
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [description, setDescription] = useState(EMPTY_FORM.description);
  const [calories, setCalories] = useState(EMPTY_FORM.calories);
  const [proteinG, setProteinG] = useState(EMPTY_FORM.proteinG);
  const [carbsG, setCarbsG] = useState(EMPTY_FORM.carbsG);
  const [fatG, setFatG] = useState(EMPTY_FORM.fatG);
  const photoInputRef = useRef<HTMLInputElement>(null);

  function resetForm() {
    setDescription(EMPTY_FORM.description);
    setCalories(EMPTY_FORM.calories);
    setProteinG(EMPTY_FORM.proteinG);
    setCarbsG(EMPTY_FORM.carbsG);
    setFatG(EMPTY_FORM.fatG);
    setAnalysisError(null);
    if (photoInputRef.current) photoInputRef.current.value = "";
  }

  async function handleSubmit(formData: FormData) {
    await addMeal(formData);
    resetForm();
  }

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setAnalysisError(null);

    startAnalysis(async () => {
      const compressed = await compressImage(file);
      const photoFormData = new FormData();
      photoFormData.set("photo", compressed);

      const result = await analyzeMealPhoto(photoFormData);

      if (!result.ok) {
        setAnalysisError(result.error);
        return;
      }

      setDescription(result.data.description);
      setCalories(String(result.data.calories));
      setProteinG(String(result.data.proteinG));
      setCarbsG(String(result.data.carbsG));
      setFatG(String(result.data.fatG));
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="photo">Foto de la comida (opcional)</Label>
        <input
          id="photo"
          ref={photoInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          disabled={isAnalyzing}
          onChange={handlePhotoChange}
          className="w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-accent file:px-3 file:py-2 file:text-sm file:text-accent-foreground"
        />
        {isAnalyzing && <p className="mt-1 text-xs text-muted">Analizando foto…</p>}
        <FieldError messages={analysisError ? [analysisError] : undefined} />
      </div>

      <div>
        <Label htmlFor="type">Tipo</Label>
        <select
          id="type"
          name="type"
          required
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
        >
          <option value="DESAYUNO">Desayuno</option>
          <option value="ALMUERZO">Almuerzo</option>
          <option value="CENA">Cena</option>
        </select>
      </div>

      <div>
        <Label htmlFor="description">¿Qué vas a comer?</Label>
        <Input
          id="description"
          name="description"
          placeholder="Ej. Avena con fruta"
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <Label htmlFor="calories">Calorías</Label>
          <Input
            id="calories"
            name="calories"
            type="number"
            min={0}
            inputMode="numeric"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="proteinG">Proteína (g)</Label>
          <Input
            id="proteinG"
            name="proteinG"
            type="number"
            min={0}
            step="0.1"
            inputMode="decimal"
            value={proteinG}
            onChange={(e) => setProteinG(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="carbsG">Carbs (g)</Label>
          <Input
            id="carbsG"
            name="carbsG"
            type="number"
            min={0}
            step="0.1"
            inputMode="decimal"
            value={carbsG}
            onChange={(e) => setCarbsG(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="fatG">Grasa (g)</Label>
          <Input
            id="fatG"
            name="fatG"
            type="number"
            min={0}
            step="0.1"
            inputMode="decimal"
            value={fatG}
            onChange={(e) => setFatG(e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notas (opcional)</Label>
        <Input id="notes" name="notes" placeholder="Ingredientes, contexto, etc." />
      </div>

      <SubmitButton>Agregar comida</SubmitButton>
    </form>
  );
}
