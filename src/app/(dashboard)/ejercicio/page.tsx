import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { startOfToday, endOfToday, formatDateEs } from "@/lib/date";
import { addExercise, toggleExercise, deleteExercise } from "@/actions/exercises";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { SubmitButton } from "@/components/submit-button";
import { ToggleCheckbox } from "@/components/toggle-checkbox";
import { DeleteButton } from "@/components/delete-button";

export default async function EjercicioPage() {
  const { userId } = await verifySession();

  const exercises = await prisma.exerciseEntry.findMany({
    where: { userId, date: { gte: startOfToday(), lt: endOfToday() } },
    orderBy: { createdAt: "asc" },
  });

  const totalMinutes = exercises.reduce((sum, e) => sum + e.durationMinutes, 0);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Ejercicio</h1>
        <p className="text-sm text-muted">{formatDateEs(new Date())}</p>
      </div>

      <Card>
        <form action={addExercise} className="space-y-4">
          <div>
            <Label htmlFor="activity">Actividad</Label>
            <Input id="activity" name="activity" placeholder="Ej. Correr, pesas, yoga…" required />
          </div>

          <div>
            <Label htmlFor="durationMinutes">Duración (minutos)</Label>
            <Input
              id="durationMinutes"
              name="durationMinutes"
              type="number"
              min={1}
              placeholder="30"
              required
            />
          </div>

          <div>
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Input id="notes" name="notes" placeholder="Series, distancia, intensidad…" />
          </div>

          <SubmitButton>Agregar ejercicio</SubmitButton>
        </form>
      </Card>

      {exercises.length > 0 && (
        <p className="text-sm text-muted">
          Total de hoy: <span className="font-medium text-foreground">{totalMinutes} min</span>
        </p>
      )}

      <div className="space-y-3">
        {exercises.length === 0 && (
          <p className="text-sm text-muted">Aún no has registrado ejercicio hoy.</p>
        )}

        {exercises.map((exercise) => (
          <Card key={exercise.id} className="flex items-start gap-3 py-4">
            <ToggleCheckbox
              checked={exercise.completed}
              action={toggleExercise.bind(null, exercise.id, !exercise.completed)}
            />
            <div className="min-w-0 flex-1">
              <p
                className={
                  exercise.completed
                    ? "text-sm text-muted line-through"
                    : "text-sm text-foreground"
                }
              >
                {exercise.activity}{" "}
                <span className="text-xs text-muted">· {exercise.durationMinutes} min</span>
              </p>
              {exercise.notes && <p className="mt-0.5 text-xs text-muted">{exercise.notes}</p>}
            </div>
            <DeleteButton action={deleteExercise.bind(null, exercise.id)} />
          </Card>
        ))}
      </div>
    </div>
  );
}
