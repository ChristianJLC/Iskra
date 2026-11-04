"use client";

import { useRef, useState } from "react";
import {
  Briefcase,
  GraduationCap,
  HeartPulse,
  Home,
  Plus,
  ShoppingBag,
  SlidersHorizontal,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { addTask, updateTask } from "@/actions/tasks";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Sheet } from "@/components/ui/sheet";
import { SubmitButton } from "@/components/submit-button";
import { TASK_CATEGORY_OPTIONS, type TaskCategory } from "@/lib/task-summary";
import { cn } from "@/lib/cn";

type Priority = "BAJA" | "MEDIA" | "ALTA";

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: "BAJA", label: "Baja" },
  { value: "MEDIA", label: "Media" },
  { value: "ALTA", label: "Alta" },
];

export const AREA_ICONS: Record<TaskCategory, LucideIcon> = {
  TRABAJO: Briefcase,
  PERSONAL: UserRound,
  CASA: Home,
  ESTUDIO: GraduationCap,
  SALUD: HeartPulse,
  COMPRAS: ShoppingBag,
};

function nextDay(iso: string) {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

export type TaskFormValues = {
  id?: string;
  title?: string;
  description?: string | null;
  date?: string;
  priority?: Priority;
  category?: TaskCategory | null;
};

export function TaskFormSheet({
  today,
  initial,
  onClose,
  onSaved,
}: {
  today: string;
  initial: TaskFormValues;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const [title, setTitle] = useState(initial.title ?? "");
  const [date, setDate] = useState(initial.date ?? "");
  const [priority, setPriority] = useState<Priority>(initial.priority ?? "MEDIA");
  const [category, setCategory] = useState<TaskCategory | null>(initial.category ?? null);
  const isEditing = Boolean(initial.id);

  const shortcuts = [
    { label: "Sin fecha", value: "" },
    { label: "Hoy", value: today },
    { label: "Mañana", value: nextDay(today) },
  ];

  return (
    <Sheet
      title={isEditing ? "Editar tarea" : "Nueva tarea"}
      description={isEditing ? undefined : "Solo el nombre es obligatorio."}
      onClose={onClose}
    >
      <form
        action={async (formData) => {
          if (initial.id) {
            await updateTask(initial.id, formData);
          } else {
            await addTask(formData);
          }
          onClose();
          onSaved?.();
        }}
        className="flex min-h-0 flex-1 flex-col"
      >
        <input type="hidden" name="priority" value={priority} />
        <input type="hidden" name="category" value={category ?? ""} />

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4 sm:px-6">
          <div>
            <Label htmlFor="task-title">¿Qué tienes que hacer?</Label>
            <Input
              id="task-title"
              name="title"
              placeholder="Ej. Llamar al banco"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-12"
              required
              data-autofocus
            />
          </div>

          <div>
            <Label>Área (opcional)</Label>
            <div className="grid grid-cols-3 gap-2">
              {TASK_CATEGORY_OPTIONS.map(({ value, label }) => {
                const Icon = AREA_ICONS[value];
                const active = category === value;
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setCategory(active ? null : value)}
                    className={cn(
                      "flex h-11 min-w-0 items-center justify-center gap-1.5 rounded-xl px-2 text-sm font-medium transition-colors",
                      active ? "bg-foreground text-background" : "bg-surface-2 text-foreground hover:bg-surface-hover"
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="truncate">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label htmlFor="task-date">¿Para cuándo?</Label>
            <div className="grid grid-cols-3 gap-2">
              {shortcuts.map(({ label, value }) => (
                <button
                  key={label}
                  type="button"
                  aria-pressed={date === value}
                  onClick={() => setDate(value)}
                  className={cn(
                    "h-11 rounded-xl text-sm font-medium transition-colors",
                    date === value ? "bg-foreground text-background" : "bg-surface-2 text-foreground hover:bg-surface-hover"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <Input
              id="task-date"
              name="dueDate"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-2 h-12"
            />
          </div>

          <div>
            <Label>Prioridad</Label>
            <SegmentedControl layoutId="task-priority" options={PRIORITY_OPTIONS} value={priority} onChange={setPriority} />
          </div>

          <div>
            <Label htmlFor="task-description">Descripción (opcional)</Label>
            <Input
              id="task-description"
              name="description"
              placeholder="Detalles adicionales"
              defaultValue={initial.description ?? ""}
              className="h-12"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border/70 px-5 py-4 sm:px-6">
          <Button type="button" variant="ghost" className="h-11" onClick={onClose}>
            Cancelar
          </Button>
          <SubmitButton variant="solid" className="h-11">
            Guardar
          </SubmitButton>
        </div>
      </form>
    </Sheet>
  );
}

export function TaskQuickAdd({
  date,
  category,
  onMore,
}: {
  date: string | null;
  category: TaskCategory | null;
  onMore: (title: string, clear: () => void) => void;
}) {
  const [title, setTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center gap-2">
      <form
        action={async (formData) => {
          await addTask(formData);
          setTitle("");
          inputRef.current?.focus();
        }}
        className="relative min-w-0 flex-1"
      >
        <input type="hidden" name="dueDate" value={date ?? ""} />
        <input type="hidden" name="category" value={category ?? ""} />
        <label htmlFor="task-quick-add" className="sr-only">
          Agregar una tarea
        </label>
        <Input
          ref={inputRef}
          id="task-quick-add"
          name="title"
          placeholder="Escribe una tarea…"
          autoComplete="off"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="h-12 rounded-xl border-transparent bg-surface-2 pr-12 transition hover:bg-surface-hover focus:border-accent focus:bg-surface focus:ring-4 focus:ring-accent/15"
          required
        />
        <button
          type="submit"
          aria-label="Agregar tarea"
          disabled={!title.trim()}
          className="absolute top-1/2 right-1.5 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg bg-foreground text-background transition-opacity hover:opacity-90 disabled:opacity-30"
        >
          <Plus className="size-4" />
        </button>
      </form>

      <button
        type="button"
        aria-label="Agregar con más opciones"
        onClick={() => onMore(title, () => setTitle(""))}
        className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-muted transition-colors hover:bg-surface-hover hover:text-foreground"
      >
        <SlidersHorizontal className="size-4" />
      </button>
    </div>
  );
}
