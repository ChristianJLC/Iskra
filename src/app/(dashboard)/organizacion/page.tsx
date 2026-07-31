import { Repeat } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { formatShortDateEs } from "@/lib/date";
import { addTask, toggleTask, completeRecurringTask, deleteTask } from "@/actions/tasks";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { SubmitButton } from "@/components/submit-button";
import { ToggleCheckbox } from "@/components/toggle-checkbox";
import { DeleteButton } from "@/components/delete-button";
import { cn } from "@/lib/cn";

const PRIORITY_STYLES: Record<string, string> = {
  ALTA: "bg-danger/10 text-danger",
  MEDIA: "bg-accent/15 text-accent",
  BAJA: "bg-surface-hover text-muted",
};

const PRIORITY_LABELS: Record<string, string> = {
  ALTA: "Alta",
  MEDIA: "Media",
  BAJA: "Baja",
};

const RECURRENCE_LABELS: Record<string, string> = {
  NINGUNA: "No se repite",
  DIARIA: "Se repite a diario",
  SEMANAL: "Se repite cada semana",
  MENSUAL: "Se repite cada mes",
};

export default async function OrganizacionPage() {
  const { userId } = await verifySession();

  const tasks = await prisma.task.findMany({
    where: { userId },
    orderBy: [{ completed: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
  });

  const pending = tasks.filter((t) => !t.completed);
  const completed = tasks.filter((t) => t.completed);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Organización</h1>
        <p className="text-sm text-muted">Tus tareas y pendientes</p>
      </div>

      <Card>
        <form action={addTask} className="space-y-4">
          <div>
            <Label htmlFor="title">Tarea</Label>
            <Input id="title" name="title" placeholder="Ej. Pagar el internet" required />
          </div>

          <div>
            <Label htmlFor="description">Descripción (opcional)</Label>
            <Input id="description" name="description" placeholder="Detalles adicionales" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="dueDate">Fecha límite</Label>
              <Input id="dueDate" name="dueDate" type="date" />
            </div>
            <div>
              <Label htmlFor="priority">Prioridad</Label>
              <select
                id="priority"
                name="priority"
                defaultValue="MEDIA"
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
              >
                <option value="BAJA">Baja</option>
                <option value="MEDIA">Media</option>
                <option value="ALTA">Alta</option>
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="recurrence">Repetir</Label>
            <select
              id="recurrence"
              name="recurrence"
              defaultValue="NINGUNA"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
            >
              <option value="NINGUNA">No se repite</option>
              <option value="DIARIA">Diario</option>
              <option value="SEMANAL">Semanal</option>
              <option value="MENSUAL">Mensual</option>
            </select>
          </div>

          <SubmitButton>Agregar tarea</SubmitButton>
        </form>
      </Card>

      <div className="space-y-3">
        {pending.length === 0 && (
          <p className="text-sm text-muted">No tienes tareas pendientes. 🎉</p>
        )}

        {pending.map((task) => {
          const isRecurring = task.recurrence !== "NINGUNA";

          return (
            <Card key={task.id} className="flex items-start gap-3 py-4">
              <ToggleCheckbox
                checked={task.completed}
                action={
                  isRecurring
                    ? completeRecurringTask.bind(null, task.id)
                    : toggleTask.bind(null, task.id, !task.completed)
                }
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm text-foreground">{task.title}</p>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-medium",
                      PRIORITY_STYLES[task.priority]
                    )}
                  >
                    {PRIORITY_LABELS[task.priority]}
                  </span>
                  {isRecurring && (
                    <span className="flex items-center gap-1 rounded-full bg-surface-hover px-2 py-0.5 text-[10px] font-medium text-muted">
                      <Repeat className="size-3" />
                      {RECURRENCE_LABELS[task.recurrence]}
                    </span>
                  )}
                </div>
                {task.description && (
                  <p className="mt-0.5 text-xs text-muted">{task.description}</p>
                )}
                {task.dueDate && (
                  <p className="mt-0.5 text-xs text-muted">
                    {isRecurring ? "Próxima: " : "Vence: "}
                    {formatShortDateEs(task.dueDate)}
                  </p>
                )}
              </div>
              <DeleteButton action={deleteTask.bind(null, task.id)} />
            </Card>
          );
        })}
      </div>

      {completed.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Completadas</p>
          {completed.map((task) => (
            <Card key={task.id} className="flex items-start gap-3 py-4 opacity-70">
              <ToggleCheckbox
                checked={task.completed}
                action={toggleTask.bind(null, task.id, !task.completed)}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-muted line-through">{task.title}</p>
              </div>
              <DeleteButton action={deleteTask.bind(null, task.id)} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
