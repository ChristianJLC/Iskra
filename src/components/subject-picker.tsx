"use client";

import { useState } from "react";
import { Plus, Check } from "lucide-react";
import { createSubjectAndAddToday, addTodayEntryFromSubject } from "@/actions/studies";
import { Input, Label } from "@/components/ui/input";
import { SubmitButton } from "@/components/submit-button";
import { cn } from "@/lib/cn";

type Subject = { id: string; name: string; targetMinutes: number; addedToday: boolean };

export function SubjectPicker({ subjects }: { subjects: Subject[] }) {
  const [isAdding, setIsAdding] = useState(subjects.length === 0);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {subjects.map((subject) => (
          <form key={subject.id} action={addTodayEntryFromSubject.bind(null, subject.id)}>
            <button
              type="submit"
              disabled={subject.addedToday}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed",
                subject.addedToday
                  ? "border-accent bg-accent/15 text-accent"
                  : "border-border bg-surface text-foreground hover:border-accent"
              )}
            >
              {subject.addedToday && <Check className="size-3.5" />}
              {subject.name}
              <span className="text-muted">· {subject.targetMinutes} min</span>
            </button>
          </form>
        ))}

        <button
          type="button"
          onClick={() => setIsAdding((v) => !v)}
          className="flex items-center gap-1 rounded-full border border-dashed border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-accent hover:text-foreground"
        >
          <Plus className="size-3.5" />
          Nueva materia
        </button>
      </div>

      {isAdding && (
        <form
          action={async (formData) => {
            await createSubjectAndAddToday(formData);
            setIsAdding(false);
          }}
          className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-surface-hover p-3"
        >
          <div className="min-w-[10rem] flex-1">
            <Label htmlFor="name">Materia / tema</Label>
            <Input id="name" name="name" placeholder="Ej. Inglés, matemáticas…" required />
          </div>
          <div className="w-28">
            <Label htmlFor="targetMinutes">Meta (min)</Label>
            <Input id="targetMinutes" name="targetMinutes" type="number" min={1} placeholder="60" required />
          </div>
          <SubmitButton>Agregar</SubmitButton>
        </form>
      )}
    </div>
  );
}
