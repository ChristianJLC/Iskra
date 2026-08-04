import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/dal";
import { startOfToday, endOfToday, formatDateEs } from "@/lib/date";
import { effectiveSeconds } from "@/lib/study";
import { deleteStudy } from "@/actions/studies";
import { Card } from "@/components/ui/card";
import { DeleteButton } from "@/components/delete-button";
import { SubjectPicker } from "@/components/subject-picker";
import { StudyTimer } from "@/components/study-timer";
import { cn } from "@/lib/cn";

export default async function EstudioPage() {
  const { userId } = await verifySession();

  const [subjects, studies] = await Promise.all([
    prisma.studySubject.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
    prisma.studyEntry.findMany({
      where: { userId, date: { gte: startOfToday(), lt: endOfToday() } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const subjectIdsToday = new Set(studies.map((s) => s.subjectId));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Estudio</h1>
          <p className="text-sm text-muted">{formatDateEs(new Date())}</p>
        </div>
        <Link href="/estudio/historial" className="text-sm font-medium text-accent hover:underline">
          Ver historial
        </Link>
      </div>

      <Card>
        <SubjectPicker
          subjects={subjects.map((s) => ({
            id: s.id,
            name: s.name,
            targetMinutes: s.targetMinutes,
            addedToday: subjectIdsToday.has(s.id),
          }))}
        />
      </Card>

      <div className="space-y-3">
        {studies.length === 0 && (
          <p className="text-sm text-muted">Aún no tienes metas de estudio hoy.</p>
        )}

        {studies.map((entry) => (
          <Card key={entry.id} className="space-y-3 py-4">
            <div className="flex items-start justify-between gap-3">
              <p
                className={cn(
                  "text-sm font-medium",
                  entry.completed ? "text-muted line-through" : "text-foreground"
                )}
              >
                {entry.subjectName}
              </p>
              <DeleteButton action={deleteStudy.bind(null, entry.id)} />
            </div>

            <StudyTimer
              id={entry.id}
              initialSeconds={effectiveSeconds(entry)}
              isRunning={Boolean(entry.runningSince)}
              targetMinutes={entry.targetMinutes}
              completed={entry.completed}
            />
          </Card>
        ))}
      </div>
    </div>
  );
}
