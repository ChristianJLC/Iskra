import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { startOfToday, endOfToday, formatDateEs } from "@/lib/date";
import { addStudy, updateStudyProgress, deleteStudy } from "@/actions/studies";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/delete-button";
import { cn } from "@/lib/cn";

export default async function EstudioPage() {
  const { userId } = await verifySession();

  const studies = await prisma.studyEntry.findMany({
    where: { userId, date: { gte: startOfToday(), lt: endOfToday() } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Estudio</h1>
        <p className="text-sm text-muted">{formatDateEs(new Date())}</p>
      </div>

      <Card>
        <form action={addStudy} className="space-y-4">
          <div>
            <Label htmlFor="subject">Materia / tema</Label>
            <Input id="subject" name="subject" placeholder="Ej. Inglés, matemáticas…" required />
          </div>

          <div>
            <Label htmlFor="targetMinutes">Meta (minutos)</Label>
            <Input id="targetMinutes" name="targetMinutes" type="number" min={1} placeholder="60" required />
          </div>

          <SubmitButton>Agregar meta de estudio</SubmitButton>
        </form>
      </Card>

      <div className="space-y-3">
        {studies.length === 0 && (
          <p className="text-sm text-muted">Aún no tienes metas de estudio hoy.</p>
        )}

        {studies.map((entry) => {
          const progress = Math.min(100, Math.round((entry.actualMinutes / entry.targetMinutes) * 100));

          return (
            <Card key={entry.id} className="space-y-3 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p
                    className={cn(
                      "text-sm font-medium",
                      entry.completed ? "text-muted line-through" : "text-foreground"
                    )}
                  >
                    {entry.subject}
                  </p>
                  <p className="text-xs text-muted">
                    {entry.actualMinutes} / {entry.targetMinutes} min
                  </p>
                </div>
                <DeleteButton action={deleteStudy.bind(null, entry.id)} />
              </div>

              <div className="h-2 w-full overflow-hidden rounded-full bg-surface-hover">
                <div
                  className="h-full rounded-full bg-accent transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <form
                action={updateStudyProgress.bind(null, entry.id)}
                className="flex items-center gap-2"
              >
                <Input
                  name="actualMinutes"
                  type="number"
                  min={0}
                  defaultValue={entry.actualMinutes}
                  className="w-24"
                />
                <Button type="submit" variant="secondary" className="text-xs">
                  Actualizar
                </Button>
              </form>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
