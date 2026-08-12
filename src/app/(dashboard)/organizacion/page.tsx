import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { formatShortDateEs } from "@/lib/date";
import { toggleTask, deleteTask } from "@/actions/tasks";
import { Card } from "@/components/ui/card";
import { TaskForm } from "@/components/task-form";
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
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Organización</h1>
        <p className="text-sm text-muted">Tus tareas y pendientes</p>
      </div>

      <TaskForm />

      <div className="space-y-3">
        {pending.length === 0 && (
          <p className="text-sm text-muted">No tienes tareas pendientes.</p>
        )}

        {pending.map((task) => (
          <Card key={task.id} className="flex items-start gap-3 py-4">
            <ToggleCheckbox
              checked={task.completed}
              action={toggleTask.bind(null, task.id, !task.completed)}
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
              </div>
              {task.description && (
                <p className="mt-0.5 text-xs text-muted">{task.description}</p>
              )}
              {task.dueDate && (
                <p className="mt-0.5 text-xs text-muted">Vence: {formatShortDateEs(task.dueDate)}</p>
              )}
            </div>
            <DeleteButton action={deleteTask.bind(null, task.id)} />
          </Card>
        ))}
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
