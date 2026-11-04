import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronRight,
  Circle,
  Droplet,
  Dumbbell,
  Flame,
  ListChecks,
  Utensils,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { CountUp } from "@/components/ui/count-up";
import { ProgressBar, ProgressRing } from "@/components/ui/progress";
import { cn } from "@/lib/cn";
import type { ResumenData, Tone, WeekDayState } from "@/lib/resumen-summary";
import type { TaskPriority } from "@/generated/prisma/client";

const currency = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" });

const TONE_DOT: Record<Tone, string> = {
  danger: "bg-danger",
  warning: "bg-warning",
  neutral: "bg-muted",
};

const TONE_TEXT: Record<Tone, string> = {
  danger: "text-danger",
  warning: "text-warning",
  neutral: "text-muted",
};

const PRIORITY_DOT: Record<TaskPriority, string> = {
  ALTA: "bg-danger",
  MEDIA: "bg-accent",
  BAJA: "bg-muted",
};

const WEEK_DAY_STYLES: Record<WeekDayState, string> = {
  done: "bg-accent text-accent-foreground",
  today: "bg-foreground text-background",
  missed: "bg-danger/10 text-danger",
  upcoming: "bg-surface-2 text-foreground",
  rest: "text-muted",
};

const WEEK_DAY_LABELS: Record<WeekDayState, string> = {
  done: "completado",
  today: "toca hoy",
  missed: "no completado",
  upcoming: "programado",
  rest: "descanso",
};

function Pill({ tone, children }: { tone: "done" | Tone; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium",
        tone === "done" && "bg-accent/15 text-accent",
        tone === "danger" && "bg-danger/10 text-danger",
        tone === "warning" && "bg-warning/10 text-warning",
        tone === "neutral" && "bg-surface-2 text-muted"
      )}
    >
      {children}
    </span>
  );
}

function ModuleCard({
  href,
  icon: Icon,
  title,
  children,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group block h-full rounded-3xl outline-offset-2 transition-transform duration-300 focus-visible:outline-2 focus-visible:outline-accent motion-safe:hover:-translate-y-[5px]"
    >
      <Card className="flex h-full flex-col gap-4 rounded-3xl transition-shadow duration-300 group-hover:shadow-[0_18px_40px_-16px_rgba(0,0,0,0.25)]">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 text-sm font-medium text-muted">
            <Icon className="size-4" />
            {title}
          </p>
          <ArrowUpRight className="size-4 text-muted transition-colors group-hover:text-foreground" />
        </div>
        {children}
      </Card>
    </Link>
  );
}

function Stat({ children, unit }: { children: React.ReactNode; unit?: string }) {
  return (
    <p className="text-3xl font-semibold tracking-tight text-foreground">
      {children}
      {unit && <span className="ml-1.5 text-sm font-normal tracking-normal text-muted">{unit}</span>}
    </p>
  );
}

function Footer({ children }: { children: React.ReactNode }) {
  return <div className="mt-auto space-y-2 border-t border-border/70 pt-3">{children}</div>;
}

function DayCard({ data }: { data: ResumenData }) {
  const total = data.goals.length;
  const percent = total ? (data.goalsDone / total) * 100 : 0;

  return (
    <Card className="flex h-full flex-col items-center gap-6 rounded-3xl sm:flex-row sm:items-center">
      <ProgressRing percent={percent}>
        <p className="text-3xl font-semibold tracking-tight text-foreground">
          <CountUp value={data.goalsDone} />
          <span className="text-lg text-muted">/{total}</span>
        </p>
        <p className="text-xs text-muted">metas</p>
      </ProgressRing>

      <div className="w-full min-w-0 flex-1">
        <h2 className="text-center text-xl font-semibold tracking-tight text-foreground sm:text-left">
          {data.headline}
        </h2>
        <ul className="mt-3 space-y-0.5">
          {data.goals.map((goal) => (
            <li key={goal.key}>
              <Link
                href={goal.href}
                className="-mx-2 flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-surface-hover"
              >
                {goal.done ? (
                  <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                ) : (
                  <Circle className="size-4 shrink-0 text-muted" />
                )}
                <span className="font-medium text-foreground">{goal.label}</span>
                <span className="ml-auto truncate pl-2 text-xs text-muted">{goal.detail}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

function AttentionCard({ data }: { data: ResumenData }) {
  return (
    <Card className="flex h-full flex-col rounded-3xl">
      <h2 className="text-sm font-medium text-muted">Lo que toca ahora</h2>

      {data.attention.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-accent/15 text-accent">
            <Check className="size-5" />
          </span>
          <p className="font-medium text-foreground">Estás al día</p>
          <p className="text-sm text-muted">No tienes nada pendiente por ahora.</p>
        </div>
      ) : (
        <ul className="mt-2 divide-y divide-border/70">
          {data.attention.map((item) => (
            <li key={item.key}>
              <Link
                href={item.href}
                className="group -mx-2 flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-surface-hover"
              >
                <span className={cn("size-2 shrink-0 rounded-full", TONE_DOT[item.tone])} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">{item.title}</span>
                  <span className={cn("block truncate text-xs", TONE_TEXT[item.tone])}>{item.detail}</span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted transition-colors group-hover:text-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      {data.attentionMore > 0 && <p className="mt-2 text-xs text-muted">Y {data.attentionMore} más</p>}
    </Card>
  );
}

function MacroBar({ label, value, target }: { label: string; value: number; target: number }) {
  return (
    <div className="min-w-0 space-y-1">
      <p className="truncate text-xs text-muted">{label}</p>
      <p className="truncate text-xs font-medium text-foreground tabular-nums">
        {Math.round(value)}/{target} g
      </p>
      <ProgressBar percent={target > 0 ? (value / target) * 100 : 0} className="h-1" />
    </div>
  );
}

function NutritionCard({ nutrition }: { nutrition: ResumenData["nutrition"] }) {
  const { target, calories } = nutrition;
  const over = target ? calories - target.calorieMax : 0;
  const left = target ? target.calorieMin - calories : 0;

  return (
    <ModuleCard href="/comidas" icon={Utensils} title="Nutrición">
      {!nutrition.configured ? (
        <div>
          <p className="text-lg font-semibold tracking-tight text-foreground">Sin plan todavía</p>
          <p className="mt-1 text-sm text-muted">Configúralo para ver tus calorías y macros.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <Stat unit={target ? `/ ${target.calories.toLocaleString("es")} kcal` : "kcal"}>
              <CountUp value={calories} />
            </Stat>
            {target && (
              <p className={cn("mt-0.5 text-xs", over > 0 ? "text-danger" : "text-muted")}>
                {nutrition.mealCount === 0
                  ? "Sin comidas registradas hoy"
                  : over > 0
                    ? `${over.toLocaleString("es")} kcal sobre tu rango`
                    : left > 0
                      ? `Te faltan ${left.toLocaleString("es")} kcal para tu rango`
                      : "Dentro de tu rango"}
              </p>
            )}
          </div>
          {target && (
            <>
              <ProgressBar
                percent={(calories / target.calories) * 100}
                fillClassName={over > 0 ? "bg-danger" : "bg-accent"}
              />
              <div className="grid grid-cols-3 gap-3">
                <MacroBar label="Proteína" value={nutrition.proteinG} target={target.proteinG} />
                <MacroBar label="Carbos" value={nutrition.carbsG} target={target.carbsG} />
                <MacroBar label="Grasa" value={nutrition.fatG} target={target.fatG} />
              </div>
            </>
          )}
        </div>
      )}

      <Footer>
        <div className="flex items-center gap-2 text-xs">
          <Droplet className="size-3.5 shrink-0 text-muted" />
          <div
            className="flex flex-1 gap-1"
            role="img"
            aria-label={`${nutrition.glasses} de ${nutrition.targetGlasses} vasos de agua`}
          >
            {Array.from({ length: nutrition.targetGlasses }, (_, i) => (
              <span
                key={i}
                className={cn("h-1.5 flex-1 rounded-full", i < nutrition.glasses ? "bg-accent" : "bg-surface-2")}
              />
            ))}
          </div>
          <span className="font-medium text-foreground tabular-nums">
            {nutrition.glasses}/{nutrition.targetGlasses}
          </span>
        </div>
        {nutrition.streak > 0 && (
          <p className="flex items-center gap-2 text-xs text-muted">
            <Flame className="size-3.5 shrink-0" />
            {nutrition.streak} {nutrition.streak === 1 ? "día" : "días"} en tu rango
          </p>
        )}
      </Footer>
    </ModuleCard>
  );
}

function WorkoutCard({ workout }: { workout: ResumenData["workout"] }) {
  return (
    <ModuleCard href="/ejercicio" icon={Dumbbell} title="Ejercicio">
      {!workout.hasRoutine ? (
        <div>
          <p className="text-lg font-semibold tracking-tight text-foreground">Sin rutina todavía</p>
          <p className="mt-1 text-sm text-muted">Arma tu semana y aquí verás qué toca cada día.</p>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-muted">Hoy</p>
              <p className="text-xl font-semibold tracking-tight text-foreground">
                {workout.todayLabel}
              </p>
            </div>
            {workout.isRestDay ? (
              <Pill tone="neutral">Libre</Pill>
            ) : workout.completed ? (
              <Pill tone="done">Hecho</Pill>
            ) : (
              <Pill tone="warning">Pendiente</Pill>
            )}
          </div>

          <div className="space-y-1.5">
            <p className="text-xs text-muted">Esta semana</p>
            <ul className="grid grid-cols-7 gap-1">
              {workout.week.map((day) => (
                <li
                  key={day.key}
                  aria-label={`${day.label}: ${WEEK_DAY_LABELS[day.state]}`}
                  className={cn(
                    "flex aspect-square max-h-11 w-full items-center justify-center rounded-xl text-xs font-medium",
                    WEEK_DAY_STYLES[day.state],
                    day.isToday && day.state !== "today" && "ring-2 ring-foreground/30"
                  )}
                >
                  {day.state === "done" ? <Check className="size-3.5" strokeWidth={3} /> : day.label}
                </li>
              ))}
            </ul>
          </div>

          <Footer>
            <p className="flex items-center gap-2 text-xs text-muted">
              <Flame className="size-3.5 shrink-0" />
              {workout.streak > 0
                ? `${workout.streak} ${workout.streak === 1 ? "entrenamiento" : "entrenamientos"} seguidos`
                : "Tu racha empieza con el próximo entrenamiento"}
            </p>
          </Footer>
        </>
      )}
    </ModuleCard>
  );
}

function StudyCard({ study }: { study: ResumenData["study"] }) {
  return (
    <ModuleCard href="/estudio" icon={BookOpen} title="Estudio">
      {study.entries.length === 0 ? (
        <div>
          <p className="text-lg font-semibold tracking-tight text-foreground">Sin metas hoy</p>
          <p className="mt-1 text-sm text-muted">Elige una materia para empezar a contar tu tiempo.</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            <Stat unit={`/ ${study.target} min`}>
              <CountUp value={study.actual} />
            </Stat>
            <ProgressBar percent={study.target ? (study.actual / study.target) * 100 : 0} />
          </div>
          <ul className="space-y-1.5">
            {study.entries.slice(0, 3).map((entry) => (
              <li key={entry.id} className="flex items-center gap-2 text-sm">
                <span className="truncate text-foreground">{entry.name}</span>
                {entry.running && (
                  <span className="flex shrink-0 items-center gap-1 text-xs text-accent">
                    <span className="size-1.5 rounded-full bg-accent motion-safe:animate-pulse" />
                    En curso
                  </span>
                )}
                <span className="ml-auto shrink-0 text-xs text-muted tabular-nums">
                  {entry.actualMinutes}/{entry.targetMinutes} min
                </span>
              </li>
            ))}
          </ul>
          {study.entries.length > 3 && <p className="text-xs text-muted">Y {study.entries.length - 3} más</p>}
        </>
      )}
    </ModuleCard>
  );
}

function TasksCard({ tasks }: { tasks: ResumenData["tasks"] }) {
  return (
    <ModuleCard href="/organizacion" icon={ListChecks} title="Tareas">
      {tasks.count === 0 ? (
        <div>
          <p className="text-lg font-semibold tracking-tight text-foreground">Nada pendiente</p>
          <p className="mt-1 text-sm text-muted">Cuando agregues tareas, aquí verás las más urgentes.</p>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <Stat unit={tasks.count === 1 ? "pendiente" : "pendientes"}>
              <CountUp value={tasks.count} />
            </Stat>
            {tasks.overdue > 0 && (
              <Pill tone="danger">
                {tasks.overdue} {tasks.overdue === 1 ? "vencida" : "vencidas"}
              </Pill>
            )}
          </div>
          <ul className="space-y-2">
            {tasks.top.map((task) => (
              <li key={task.id} className="flex items-center gap-2.5 text-sm">
                <span className={cn("size-2 shrink-0 rounded-full", PRIORITY_DOT[task.priority])} />
                <span className="min-w-0 truncate text-foreground">{task.title}</span>
                {task.due && (
                  <span className={cn("ml-auto shrink-0 pl-2 text-xs", TONE_TEXT[task.due.tone])}>
                    {task.due.text}
                  </span>
                )}
              </li>
            ))}
          </ul>
          {tasks.count > tasks.top.length && (
            <p className="text-xs text-muted">Y {tasks.count - tasks.top.length} más</p>
          )}
        </>
      )}
    </ModuleCard>
  );
}

function FinanceCard({ finance }: { finance: ResumenData["finance"] }) {
  const overspent = finance.spentPercent > 100;

  return (
    <ModuleCard href="/finanzas" icon={Wallet} title="Finanzas">
      <div>
        <p className="text-xs text-muted">Balance de {finance.monthLabel.toLowerCase()}</p>
        <p
          className={cn(
            "text-3xl font-semibold tracking-tight",
            finance.balance < 0 ? "text-danger" : "text-foreground"
          )}
        >
          <CountUp value={finance.balance} format="currency" />
        </p>
      </div>

      {finance.received > 0 ? (
        <div className="space-y-1.5">
          <ProgressBar percent={finance.spentPercent} fillClassName={overspent ? "bg-danger" : "bg-accent"} />
          <div className="flex justify-between gap-3 text-xs text-muted">
            <span>
              Gastaste <span className="font-medium text-foreground">{currency.format(finance.gastos)}</span>
            </span>
            <span>
              Entró <span className="font-medium text-foreground">{currency.format(finance.received)}</span>
            </span>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted">Aún no registras ingresos este mes.</p>
      )}

      <Footer>
        {finance.pendingBillsCount === 0 ? (
          <p className="text-xs text-muted">
            {finance.bills.length > 0 ? "Todos tus pagos del mes están al día" : "Sin pagos mensuales registrados"}
          </p>
        ) : (
          <>
            <p className="flex justify-between gap-3 text-xs text-muted">
              <span>
                {finance.pendingBillsCount} {finance.pendingBillsCount === 1 ? "pago" : "pagos"} por hacer
              </span>
              <span className="font-medium text-foreground">{currency.format(finance.pendingBillsAmount)}</span>
            </p>
            <ul className="space-y-1">
              {finance.topBills.map((bill) => (
                <li key={bill.id} className="flex items-center gap-2 text-sm">
                  <span className="truncate text-foreground">{bill.title}</span>
                  <span
                    className={cn(
                      "ml-auto shrink-0 text-xs",
                      bill.state === "urgent" ? "text-danger" : "text-muted"
                    )}
                  >
                    {bill.detail}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </Footer>
    </ModuleCard>
  );
}

export function ResumenDashboard({ data }: { data: ResumenData }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-6 xl:grid-cols-12">
      <div className="reveal [--i:1] lg:col-span-6 xl:col-span-5">
        <DayCard data={data} />
      </div>
      <div className="reveal [--i:2] lg:col-span-6 xl:col-span-7">
        <AttentionCard data={data} />
      </div>
      <div className="reveal [--i:3] lg:col-span-3 xl:col-span-4">
        <NutritionCard nutrition={data.nutrition} />
      </div>
      <div className="reveal [--i:4] lg:col-span-3 xl:col-span-4">
        <WorkoutCard workout={data.workout} />
      </div>
      <div className="reveal [--i:5] lg:col-span-6 xl:col-span-4">
        <StudyCard study={data.study} />
      </div>
      <div className="reveal [--i:6] lg:col-span-3 xl:col-span-6">
        <TasksCard tasks={data.tasks} />
      </div>
      <div className="reveal [--i:7] lg:col-span-3 xl:col-span-6">
        <FinanceCard finance={data.finance} />
      </div>
    </div>
  );
}

function SkeletonCard({ className, height }: { className?: string; height: string }) {
  return (
    <div className={className}>
      <Card className={cn("space-y-3 rounded-3xl", height)}>
        <div className="h-3 w-1/3 rounded-full bg-surface-2 motion-safe:animate-pulse" />
        <div className="h-7 w-1/2 rounded-full bg-surface-2 motion-safe:animate-pulse" />
        <div className="h-2 w-full rounded-full bg-surface-2 motion-safe:animate-pulse" />
        <div className="h-2 w-2/3 rounded-full bg-surface-2 motion-safe:animate-pulse" />
      </Card>
    </div>
  );
}

export function ResumenSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Cargando tu resumen"
      className="grid grid-cols-1 gap-4 lg:grid-cols-6 xl:grid-cols-12"
    >
      <SkeletonCard className="lg:col-span-6 xl:col-span-5" height="h-52" />
      <SkeletonCard className="lg:col-span-6 xl:col-span-7" height="h-52" />
      <SkeletonCard className="lg:col-span-3 xl:col-span-4" height="h-64" />
      <SkeletonCard className="lg:col-span-3 xl:col-span-4" height="h-64" />
      <SkeletonCard className="lg:col-span-6 xl:col-span-4" height="h-64" />
      <SkeletonCard className="lg:col-span-3 xl:col-span-6" height="h-56" />
      <SkeletonCard className="lg:col-span-3 xl:col-span-6" height="h-56" />
    </div>
  );
}
