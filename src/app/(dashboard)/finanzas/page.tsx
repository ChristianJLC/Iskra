import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { verifySession, getUserTimezone } from "@/lib/dal";
import { formatMonthYearEs, getMonthBounds, getZonedCalendarDate } from "@/lib/date";
import { getBillsWithState } from "@/lib/finance";
import { buildFinanceView } from "@/lib/finance-summary";
import { FinanceDashboard } from "@/components/finance-dashboard";
import { FinanceEntryList } from "@/components/finance-entry-list";

const LINK_CLASS =
  "flex h-10 items-center gap-1 rounded-full bg-surface-2 pr-2.5 pl-3.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-hover";

export default async function FinanzasPage() {
  const { userId } = await verifySession();
  const timezone = await getUserTimezone();

  const today = getZonedCalendarDate(timezone);
  const { year, month, day } = today;
  const { start: monthStart, end: monthEnd } = getMonthBounds(timezone, month, year);

  const [entries, bills] = await Promise.all([
    prisma.financeEntry.findMany({
      where: { userId, date: { gte: monthStart, lt: monthEnd } },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    }),
    getBillsWithState(userId, timezone),
  ]);

  const serializedEntries = entries.map((entry) => ({ ...entry, amount: Number(entry.amount) }));
  const monthLabel = formatMonthYearEs(month, year);
  const todayIso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const view = buildFinanceView({
    today,
    monthLabel,
    timezone,
    entries: serializedEntries,
    bills: bills.map((bill) => ({
      id: bill.id,
      title: bill.title,
      amount: Number(bill.amount),
      state: bill.state,
      startDay: bill.startDay,
      endDay: bill.endDay,
      installmentLabel: bill.installmentLabel,
      paidOn: bill.paidOn,
    })),
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="reveal flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Finanzas</h1>
          <p className="text-sm text-muted">{monthLabel}</p>
        </div>
        <Link href="/finanzas/historial" className={LINK_CLASS}>
          Historial
          <ChevronRight className="size-4" />
        </Link>
      </div>

      <FinanceDashboard
        view={view}
        today={todayIso}
        movements={<FinanceEntryList entries={serializedEntries} timezone={timezone} />}
      />
    </div>
  );
}
