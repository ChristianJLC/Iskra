import { prisma } from "@/lib/prisma";
import { verifySession, getUserTimezone } from "@/lib/dal";
import { formatDateEs, getZonedCalendarDate } from "@/lib/date";
import { TaskDashboard } from "@/components/task-dashboard";

export default async function OrganizacionPage() {
  const { userId } = await verifySession();
  const timezone = await getUserTimezone();

  const tasks = await prisma.task.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, description: true, priority: true, category: true, dueDate: true, completed: true },
  });

  return (
    <TaskDashboard tasks={tasks} today={getZonedCalendarDate(timezone)} dateLabel={formatDateEs(new Date(), timezone)} />
  );
}
