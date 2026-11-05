import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { verifySession, getUserTimezone } from "@/lib/dal";
import { formatDateEs, getZonedCalendarDate } from "@/lib/date";
import { getStudyView } from "@/lib/study";
import { calendarToIso } from "@/lib/task-summary";
import { StudyDashboard } from "@/components/study-dashboard";

export default async function EstudioPage() {
  const { userId } = await verifySession();
  const timezone = await getUserTimezone();
  const view = await getStudyView(userId, timezone);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="reveal flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Estudio</h1>
          <p className="text-sm text-muted">{formatDateEs(new Date(), timezone)}</p>
        </div>
        <Link
          href="/estudio/historial"
          className="flex h-10 items-center gap-1 rounded-full bg-surface-2 pr-2.5 pl-3.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover"
        >
          Historial
          <ChevronRight className="size-4" />
        </Link>
      </div>

      <StudyDashboard view={view} todayIso={calendarToIso(getZonedCalendarDate(timezone))} />
    </div>
  );
}
