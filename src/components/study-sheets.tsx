"use client";

import { useState, useTransition } from "react";
import { deleteStudy, deleteSubject, logStudyMinutes, saveSubject } from "@/actions/studies";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label } from "@/components/ui/input";
import { Sheet } from "@/components/ui/sheet";
import { SubmitButton } from "@/components/submit-button";
import { WEEKDAYS, formatMinutes, type StudyItem, type StudySubjectView } from "@/lib/study-summary";
import { cn } from "@/lib/cn";

const SESSION_PRESETS = [30, 45, 60, 90];
const LOG_PRESETS = [15, 30, 45, 60];
const DEFAULT_WEEKDAYS = [1, 2, 3, 4, 5];

function MinutePresets({
  presets,
  value,
  onChange,
}: {
  presets: number[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {presets.map((preset) => {
        const active = value === String(preset);
        return (
          <button
            key={preset}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(String(preset))}
            className={cn(
              "h-11 rounded-xl text-sm font-medium transition-colors",
              active ? "bg-foreground text-background" : "bg-surface-2 text-foreground hover:bg-surface-hover"
            )}
          >
            {preset} min
          </button>
        );
      })}
    </div>
  );
}

/** Acción irreversible en dos toques: el primero solo pide confirmación. */
function ConfirmAction({
  label,
  confirmLabel,
  onConfirm,
  disabled,
}: {
  label: string;
  confirmLabel: string;
  onConfirm: () => void;
  disabled?: boolean;
}) {
  const [confirming, setConfirming] = useState(false);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => (confirming ? onConfirm() : setConfirming(true))}
      onBlur={() => setConfirming(false)}
      className={cn(
        "h-11 rounded-xl px-3 text-left text-sm font-medium transition-colors disabled:opacity-50",
        confirming ? "bg-danger/10 text-danger" : "text-muted hover:bg-surface-hover hover:text-danger"
      )}
    >
      {confirming ? confirmLabel : label}
    </button>
  );
}

export function SubjectSheet({ subject, onClose }: { subject?: StudySubjectView; onClose: () => void }) {
  const [minutes, setMinutes] = useState(String(subject?.targetMinutes ?? 60));
  const [weekdays, setWeekdays] = useState(subject?.weekdays ?? DEFAULT_WEEKDAYS);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, startDelete] = useTransition();

  const weekMinutes = (Number(minutes) || 0) * weekdays.length;

  return (
    <Sheet
      title={subject ? "Editar materia" : "Nueva materia"}
      description="Elige cuánto dura cada sesión y qué días te toca."
      busy={isDeleting}
      onClose={onClose}
    >
      <form
        action={async (formData) => {
          const result = await saveSubject(subject?.id ?? null, formData);
          if (result?.error) setError(result.error);
          else onClose();
        }}
        className="flex min-h-0 flex-1 flex-col"
      >
        {weekdays.map((day) => (
          <input key={day} type="hidden" name="weekdays" value={day} />
        ))}

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4 sm:px-6">
          <div>
            <Label htmlFor="subject-name">Materia o tema</Label>
            <Input
              id="subject-name"
              name="name"
              defaultValue={subject?.name}
              placeholder="Ej. Inglés, Cálculo…"
              maxLength={60}
              autoComplete="off"
              className="h-12"
              required
              data-autofocus
            />
          </div>

          <div>
            <Label htmlFor="subject-minutes">Minutos por sesión</Label>
            <MinutePresets presets={SESSION_PRESETS} value={minutes} onChange={setMinutes} />
            <Input
              id="subject-minutes"
              name="targetMinutes"
              type="number"
              inputMode="numeric"
              min={5}
              max={480}
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              className="mt-2 h-12"
              required
            />
          </div>

          <fieldset>
            <legend className="mb-1.5 text-sm font-medium text-foreground">¿Qué días te toca?</legend>
            <div className="grid grid-cols-7 gap-1.5">
              {WEEKDAYS.map(({ value, short, name }) => {
                const active = weekdays.includes(value);
                return (
                  <button
                    key={value}
                    type="button"
                    aria-label={name}
                    aria-pressed={active}
                    onClick={() =>
                      setWeekdays((days) => (active ? days.filter((day) => day !== value) : [...days, value]))
                    }
                    className={cn(
                      "h-12 rounded-xl text-sm font-medium transition-colors",
                      active ? "bg-foreground text-background" : "bg-surface-2 text-muted hover:bg-surface-hover hover:text-foreground"
                    )}
                  >
                    {short}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-sm text-muted">
              {weekdays.length === 0
                ? "Sin días fijos: la empiezas cuando quieras y no cuenta como falta."
                : `${weekdays.length} ${weekdays.length === 1 ? "día" : "días"} · ${formatMinutes(weekMinutes)} a la semana`}
            </p>
          </fieldset>

          {error && <FieldError messages={[error]} />}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/70 px-5 py-4 sm:px-6">
          {subject ? (
            <ConfirmAction
              label="Eliminar materia"
              confirmLabel="¿Eliminar? Tu historial se conserva"
              disabled={isDeleting}
              onConfirm={() =>
                startDelete(async () => {
                  await deleteSubject(subject.id);
                  onClose();
                })
              }
            />
          ) : (
            <span />
          )}
          <div className="ml-auto flex items-center gap-2">
            <Button type="button" variant="ghost" className="h-11" disabled={isDeleting} onClick={onClose}>
              Cancelar
            </Button>
            <SubmitButton variant="solid" className="h-11" disabled={isDeleting}>
              Guardar
            </SubmitButton>
          </div>
        </div>
      </form>
    </Sheet>
  );
}

export function LogTimeSheet({ item, onClose }: { item: StudyItem; onClose: () => void }) {
  const [minutes, setMinutes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isResetting, startReset] = useTransition();
  const studied = Math.floor(item.seconds / 60);

  return (
    <Sheet
      title={item.name}
      description={`Llevas ${formatMinutes(studied)} de ${formatMinutes(item.targetMinutes)} hoy.`}
      busy={isResetting}
      onClose={onClose}
    >
      <form
        action={async (formData) => {
          const result = await logStudyMinutes({ entryId: item.entryId, subjectId: item.subjectId }, formData);
          if (result?.error) setError(result.error);
          else onClose();
        }}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-5 py-4 sm:px-6">
          <Label htmlFor="log-minutes">¿Cuánto estudiaste sin el temporizador?</Label>
          <MinutePresets presets={LOG_PRESETS} value={minutes} onChange={setMinutes} />
          <Input
            id="log-minutes"
            name="minutes"
            type="number"
            inputMode="numeric"
            min={1}
            max={600}
            placeholder="Otra cantidad, en minutos"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            className="h-12"
            required
          />
          {error && <FieldError messages={[error]} />}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/70 px-5 py-4 sm:px-6">
          {item.entryId ? (
            <ConfirmAction
              label={item.required ? "Reiniciar lo de hoy" : "Quitar de hoy"}
              confirmLabel="¿Seguro? Se borra el tiempo de hoy"
              disabled={isResetting}
              onConfirm={() =>
                startReset(async () => {
                  await deleteStudy(item.entryId!);
                  onClose();
                })
              }
            />
          ) : (
            <span />
          )}
          <div className="ml-auto flex items-center gap-2">
            <Button type="button" variant="ghost" className="h-11" disabled={isResetting} onClick={onClose}>
              Cancelar
            </Button>
            <SubmitButton variant="solid" className="h-11" disabled={isResetting}>
              Registrar
            </SubmitButton>
          </div>
        </div>
      </form>
    </Sheet>
  );
}
