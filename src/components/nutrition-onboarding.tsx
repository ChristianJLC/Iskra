"use client";

import { useState, useRef, useEffect, useActionState, type ComponentType, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  ChevronRight,
  IdCard,
  Users,
  Calendar,
  Ruler,
  Weight,
  PersonStanding,
  BicepsFlexed,
  CheckCircle,
  XCircle,
  Sparkles,
  Drumstick,
  Wheat,
  Flame,
  Droplet,
  Pencil,
  Target,
  Gauge,
  CircleCheck,
  CircleMinus,
  Venus,
  Mars,
  Check,
  X,
  Trophy,
  LoaderCircle,
  Utensils,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/submit-button";
import {
  generateNutritionPlan,
  finishOnboarding,
  type PlanActionState,
} from "@/actions/nutrition-profile";
import { cn } from "@/lib/cn";

const PLAN_INITIAL_STATE: PlanActionState = { status: "idle" };

const WHEEL_ITEM_HEIGHT = 40;
const WHEEL_VISIBLE_ITEMS = 5;
const WHEEL_HEIGHT = WHEEL_ITEM_HEIGHT * WHEEL_VISIBLE_ITEMS;

function WheelPicker({
  min,
  max,
  value,
  onChange,
  suffix,
}: {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  suffix: string;
}) {
  const options = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  const containerRef = useRef<HTMLDivElement>(null);
  const settleTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTop = (value - min) * WHEEL_ITEM_HEIGHT;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleScroll() {
    const el = containerRef.current;
    if (!el) return;
    clearTimeout(settleTimeout.current);
    settleTimeout.current = setTimeout(() => {
      const index = Math.round(el.scrollTop / WHEEL_ITEM_HEIGHT);
      const clamped = Math.min(Math.max(index, 0), options.length - 1);
      el.scrollTo({ top: clamped * WHEEL_ITEM_HEIGHT, behavior: "smooth" });
      onChange(options[clamped]);
    }, 100);
  }

  return (
    <div className="relative mx-auto" style={{ height: WHEEL_HEIGHT, width: 160 }}>
      <div
        className="pointer-events-none absolute inset-x-1 top-1/2 z-10 -translate-y-1/2 rounded-xl border border-accent/40 bg-accent/10 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
        style={{ height: WHEEL_ITEM_HEIGHT }}
      />
      <span
        className="pointer-events-none absolute top-1/2 z-20 -translate-y-1/2 text-sm text-foreground"
        style={{ left: 98 }}
      >
        {suffix}
      </span>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="no-scrollbar h-full overflow-y-auto"
        style={{
          scrollSnapType: "y mandatory",
          maskImage: "linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent, black 30%, black 70%, transparent)",
        }}
      >
        <div style={{ height: (WHEEL_HEIGHT - WHEEL_ITEM_HEIGHT) / 2 }} />
        {options.map((n) => (
          <div
            key={n}
            style={{ height: WHEEL_ITEM_HEIGHT, scrollSnapAlign: "center", paddingRight: 68 }}
            className="flex items-center justify-end"
          >
            <span
              className={cn(
                "text-lg tabular-nums transition-colors",
                n === value ? "font-semibold text-foreground" : "text-muted"
              )}
            >
              {n}
            </span>
          </div>
        ))}
        <div style={{ height: (WHEEL_HEIGHT - WHEEL_ITEM_HEIGHT) / 2 }} />
      </div>
    </div>
  );
}

const GOALS = [
  {
    value: "PERDER_GRASA",
    title: "Perder grasa",
    description: "Pierde peso y conserva tu masa muscular.",
  },
  {
    value: "GANAR_MUSCULO",
    title: "Ganar músculo",
    description: "Sube de peso y hazte más fuerte.",
  },
  {
    value: "MANTENER_PESO",
    title: "Mantener peso",
    description: "Mantén tu peso estable y busca la recomposición corporal.",
  },
] as const;

const ACTIVITY_LEVELS = [
  {
    value: "SEDENTARIO",
    title: "Sedentario",
    description: "Poco o nada de ejercicio",
    bars: 1,
  },
  {
    value: "LIGERAMENTE_ACTIVO",
    title: "Ligeramente activo",
    description: "Ejercicio 2 a 3 días por semana",
    bars: 2,
  },
  {
    value: "MODERADAMENTE_ACTIVO",
    title: "Moderadamente activo",
    description: "Ejercicio 4 a 5 días por semana",
    bars: 3,
  },
  {
    value: "MUY_ACTIVO",
    title: "Muy activo",
    description: "Ejercicio 6 a 7 días por semana",
    bars: 4,
  },
  {
    value: "ATLETA_PROFESIONAL",
    title: "Atleta profesional",
    description: "Ejercicio intenso 6 a 7 días por semana",
    bars: 5,
  },
] as const;

function ActivityBars({ filled }: { filled: number }) {
  return (
    <div className="flex items-end gap-0.5">
      {[1, 2, 3, 4, 5].map((bar) => (
        <span
          key={bar}
          className={cn("w-1 rounded-sm", bar <= filled ? "bg-accent" : "bg-border")}
          style={{ height: 4 + bar * 3 }}
        />
      ))}
    </div>
  );
}

const STRENGTH_OPTIONS = [
  { value: "true", label: "Sí", icon: CheckCircle },
  { value: "false", label: "No", icon: XCircle },
] as const;

const DIET_TYPES = [
  {
    value: "RECOMENDADA",
    title: "Recomendada",
    description: "La mejor para ti. Mezcla óptima de proteínas, carbohidratos y grasas.",
    icon: Sparkles,
  },
  {
    value: "ALTA_PROTEINA",
    title: "Alta en Proteína",
    description: "Más proteínas, menos carbohidratos y grasas.",
    icon: Drumstick,
  },
  {
    value: "BAJA_CARBOHIDRATOS",
    title: "Baja en Carbohidratos",
    description: "Menos carbohidratos, más grasas y proteínas moderadas.",
    icon: Wheat,
  },
  {
    value: "KETO",
    title: "Keto",
    description: "Muy baja en carbohidratos, alta en grasas y proteínas moderadas.",
    icon: Flame,
  },
  {
    value: "BAJA_GRASAS",
    title: "Baja en Grasas",
    description: "Menos grasas, más carbohidratos y proteínas moderadas.",
    icon: Droplet,
  },
] as const;

const SPEED_OPTIONS = [
  {
    value: "RECOMENDADO",
    title: "Recomendado",
    bullets: [
      { text: "Gran pérdida de grasa sin afectar la masa muscular", tone: "good" },
      { text: "Resultados visibles en el corto plazo", tone: "good" },
      { text: "Alimentación sostenible", tone: "good" },
    ],
  },
  {
    value: "RAPIDO",
    title: "Rápido",
    bullets: [
      { text: "Resultados visibles en menor tiempo", tone: "good" },
      { text: "Posible ligera pérdida de masa magra, debido a un mayor déficit calórico", tone: "bad" },
      { text: "Alimentación más restrictiva", tone: "bad" },
    ],
  },
  {
    value: "LENTO",
    title: "Lento",
    bullets: [
      { text: "Alimentación menos restrictiva y más flexible", tone: "good" },
      {
        text: "Posible desarrollo de masa muscular (en caso se realicen entrenamientos de fuerza)",
        tone: "good",
      },
      { text: "Resultados pueden tomar un poco más de tiempo en ser visibles", tone: "bad" },
    ],
  },
] as const;

const WIZARD_STEPS = ["goal", "about", "activity", "strength", "diet", "plan"] as const;
type WizardStep = (typeof WIZARD_STEPS)[number];
type Step = "intro" | WizardStep | "result";
type Sheet = "sex" | "age" | "height" | "weight" | "currentWeight" | "targetWeight" | "speed" | null;

const SHEET_TITLES: Record<Exclude<Sheet, null>, string> = {
  sex: "Sexo",
  age: "Edad",
  height: "Altura (cm)",
  weight: "Peso (kg)",
  currentWeight: "Peso actual",
  targetWeight: "Peso objetivo",
  speed: "Velocidad de Pérdida de Peso",
};

const SHEET_ICONS: Record<Exclude<Sheet, null>, ComponentType<{ className?: string }>> = {
  sex: Users,
  age: Calendar,
  height: Ruler,
  weight: Weight,
  currentWeight: Weight,
  targetWeight: Target,
  speed: Gauge,
};

function WizardHeader({ step, onBack }: { step: WizardStep; onBack: () => void }) {
  const index = WIZARD_STEPS.indexOf(step);
  return (
    <div className="mb-2 flex items-center gap-3">
      <button
        type="button"
        onClick={onBack}
        aria-label="Volver"
        className="text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-5" />
      </button>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-accent transition-all duration-300"
          style={{ width: `${((index + 1) / WIZARD_STEPS.length) * 100}%` }}
        />
      </div>
    </div>
  );
}

function StepIcon({ icon: Icon }: { icon: ComponentType<{ className?: string }> }) {
  return (
    <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-accent/15 text-accent">
      <Icon className="size-6" />
    </div>
  );
}

function FieldRow({
  icon: Icon,
  label,
  value,
  onClick,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string | null;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-lg border border-border bg-surface px-4 py-3 text-left transition-colors hover:bg-surface-hover"
    >
      <span className="flex items-center gap-3">
        <Icon className="size-5 text-accent" />
        <span className="text-sm font-medium text-foreground">{label}</span>
      </span>
      <span className="flex items-center gap-1">
        <span className={value ? "text-sm font-medium text-accent" : "text-sm text-muted"}>
          {value ?? "Seleccionar"}
        </span>
        <ChevronRight className="size-4 text-muted" />
      </span>
    </button>
  );
}

function SheetOption({
  icon: Icon,
  label,
  selected,
  onClick,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-all",
        selected ? "border-accent bg-accent/10 shadow-sm" : "border-border bg-surface hover:bg-surface-hover"
      )}
    >
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full transition-colors",
          selected ? "bg-accent/20 text-accent" : "bg-surface-hover text-muted"
        )}
      >
        <Icon className="size-4" />
      </div>
      <span className="flex-1 text-sm font-medium text-foreground">{label}</span>
      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full border transition-all duration-200",
          selected
            ? "scale-100 border-accent bg-accent opacity-100"
            : "scale-75 border-border opacity-0"
        )}
      >
        <Check className="size-3 text-accent-foreground" />
      </span>
    </button>
  );
}

const CHART_WIDTH = 300;
const CHART_HEIGHT = 140;
const CHART_START_X = 24;
const CHART_END_X = 276;

function WeightProgressChart({
  currentWeight,
  targetWeight,
}: {
  currentWeight: number;
  targetWeight: number;
}) {
  const losing = targetWeight <= currentWeight;
  const startY = losing ? 45 : 95;
  const endY = losing ? 60 : 45;
  const path = losing
    ? `M${CHART_START_X},${startY} C90,95 130,100 170,82 C210,66 240,63 ${CHART_END_X},${endY}`
    : `M${CHART_START_X},${startY} C90,78 130,64 170,55 C210,48 240,45 ${CHART_END_X},${endY}`;
  const areaPath = `${path} L${CHART_END_X},130 L${CHART_START_X},130 Z`;

  const toPercent = (value: number, total: number) => `${(value / total) * 100}%`;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="w-full">
        <defs>
          <linearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#weightFill)" />
        <path d={path} fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
        <circle
          cx={CHART_START_X}
          cy={startY}
          r="5"
          fill="var(--accent)"
          stroke="var(--surface)"
          strokeWidth="2"
        />
        <circle r="5" fill="var(--accent)" stroke="var(--surface)" strokeWidth="2">
          <animateMotion dur="1.4s" fill="freeze" path={path} />
        </circle>
        <circle
          cx={CHART_END_X}
          cy={endY}
          r="6.5"
          fill="var(--surface)"
          stroke="var(--accent)"
          strokeWidth="2.5"
          opacity="0"
        >
          <animate attributeName="opacity" from="0" to="1" begin="1.3s" dur="0.3s" fill="freeze" />
        </circle>
      </svg>

      <div
        className="absolute whitespace-nowrap rounded-md bg-accent px-2 py-0.5 text-xs font-semibold text-accent-foreground"
        style={{
          left: toPercent(CHART_START_X, CHART_WIDTH),
          top: toPercent(startY, CHART_HEIGHT),
          transform: "translate(-30%, calc(-100% - 8px))",
        }}
      >
        {currentWeight} kg
      </div>

      <div
        className="absolute flex flex-col items-center gap-1 animate-fade-in"
        style={{
          left: toPercent(CHART_END_X, CHART_WIDTH),
          top: toPercent(endY, CHART_HEIGHT),
          transform: "translate(-50%, calc(-100% - 8px))",
          animationDelay: "1.3s",
        }}
      >
        <Trophy className="size-4 text-accent" />
        <div className="whitespace-nowrap rounded-md border border-accent/40 bg-surface px-2 py-0.5 text-xs font-semibold text-foreground shadow-sm">
          {targetWeight} kg
        </div>
      </div>
    </div>
  );
}

function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    setValue(0);
    let frame: number;
    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}

function useRevealed(delay = 50) {
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return revealed;
}

function CalorieNumber({ value }: { value: number }) {
  const animated = useCountUp(value, 1100);
  return <>{animated.toLocaleString("es")}</>;
}

function MacroBar({ label, grams }: { label: string; grams: number }) {
  const revealed = useRevealed();
  const animatedGrams = useCountUp(grams);
  return (
    <div className="flex-1 space-y-1.5">
      <p className="text-xs text-muted">{label}</p>
      <p className="text-sm font-semibold text-foreground">{animatedGrams} g</p>
      <div className="h-1.5 overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-700 ease-out"
          style={{ width: revealed ? "88%" : "0%" }}
        />
      </div>
    </div>
  );
}

function CalorieGauge({ min, target, max }: { min: number; target: number; max: number }) {
  const percent = Math.min(100, Math.max(0, ((target - min) / (max - min)) * 100));
  const revealed = useRevealed();
  const shownPercent = revealed ? percent : 0;
  return (
    <div className="space-y-1">
      <div className="relative h-1.5 rounded-full bg-border">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-accent transition-[width] duration-700 ease-out"
          style={{ width: `${shownPercent}%` }}
        />
        <div
          className="absolute top-1/2 flex size-4 -translate-y-1/2 items-center justify-center rounded-full border-2 border-accent bg-surface transition-[left] duration-700 ease-out"
          style={{ left: `calc(${shownPercent}% - 8px)` }}
        >
          <Check className="size-2.5 text-accent" />
        </div>
      </div>
      <div className="flex justify-between text-xs text-muted">
        <span>{min.toLocaleString("es")}</span>
        <span>{max.toLocaleString("es")}</span>
      </div>
    </div>
  );
}

function BottomSheet({
  open,
  onClose,
  title,
  icon: Icon,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  icon?: ComponentType<{ className?: string }>;
  children: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-[100] flex items-end justify-center transition-opacity duration-300 md:items-center md:p-4",
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      )}
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={onClose}
      />
      <div
        className={cn(
          "glass relative w-full max-w-md rounded-t-3xl p-6 pb-8 shadow-soft transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] md:rounded-3xl md:pb-6",
          open
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-8 scale-95 opacity-0 md:translate-y-0"
        )}
      >
        <div className="mx-auto mb-5 h-1.5 w-10 rounded-full bg-border md:hidden" />
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-5 top-6 flex size-7 items-center justify-center rounded-full bg-surface-hover text-muted transition-colors hover:text-foreground"
        >
          <X className="size-4" />
        </button>
        <div className="mb-5 flex items-center gap-3">
          {Icon && (
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
              <Icon className="size-4" />
            </div>
          )}
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
        </div>
        <div className="max-h-[70vh] overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body
  );
}

export function NutritionOnboarding() {
  const [step, setStep] = useState<Step>("intro");
  const [goal, setGoal] = useState<string>("");
  const [sex, setSex] = useState<string>("");
  const [age, setAge] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [weight, setWeight] = useState<string>("");
  const [activityLevel, setActivityLevel] = useState<string>("");
  const [strengthTraining, setStrengthTraining] = useState<string>("");
  const [dietType, setDietType] = useState<string>("");
  const [targetWeight, setTargetWeight] = useState<string>("");
  const [speed, setSpeed] = useState<string>("");
  const [sheet, setSheet] = useState<Sheet>(null);
  const [planState, submitPlan, isPlanPending] = useActionState(
    generateNutritionPlan,
    PLAN_INITIAL_STATE
  );
  const [resultPage, setResultPage] = useState(0);
  const planFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (isPlanPending) {
      setResultPage(0);
      setStep("result");
    }
  }, [isPlanPending]);

  if (step === "intro") {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-6 py-16 text-center">
        <div className="relative flex size-16 items-center justify-center animate-fade-in">
          <span className="absolute inset-0 animate-pulse rounded-full bg-accent/20" />
          <span className="relative flex size-16 items-center justify-center rounded-full bg-accent/15 text-accent">
            <Utensils className="size-7" />
          </span>
        </div>
        <h1
          className="animate-fade-up text-2xl font-semibold text-foreground"
          style={{ animationDelay: "100ms" }}
        >
          Come mejor hoy, mira los resultados mañana.
        </h1>
        <p
          className="animate-fade-up text-sm text-muted"
          style={{ animationDelay: "200ms" }}
        >
          Antes de registrar tus comidas, cuéntanos un poco sobre ti.
        </p>
        <div className="animate-fade-up" style={{ animationDelay: "300ms" }}>
          <Button
            variant="primary"
            className="transition-transform hover:scale-105"
            onClick={() => setStep("goal")}
          >
            Continuar
          </Button>
        </div>
      </div>
    );
  }

  if (step === "goal") {
    return (
      <Card className="mx-auto max-w-md animate-fade-up space-y-4">
        <WizardHeader step="goal" onBack={() => setStep("intro")} />
        <div className="space-y-1 text-center">
          <StepIcon icon={Utensils} />
          <h2 className="text-lg font-semibold text-foreground">¿Cuál es tu objetivo?</h2>
          <p className="text-sm text-muted">Esto nos ayuda a personalizar tu experiencia.</p>
        </div>
        <div className="space-y-3">
          {GOALS.map((g) => (
            <label
              key={g.value}
              className="flex cursor-pointer flex-col gap-1 rounded-lg border border-border bg-surface p-4 transition-colors hover:bg-surface-hover has-[:checked]:border-accent has-[:checked]:bg-accent/10 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent"
            >
              <input
                type="radio"
                name="goal"
                value={g.value}
                checked={goal === g.value}
                onChange={() => setGoal(g.value)}
                className="sr-only"
              />
              <span className="text-sm font-medium text-foreground">{g.title}</span>
              <span className="text-xs text-muted">{g.description}</span>
            </label>
          ))}
        </div>
        <Button
          variant="primary"
          className="w-full"
          disabled={!goal}
          onClick={() => setStep("about")}
        >
          Continuar
        </Button>
      </Card>
    );
  }

  if (step === "about") {
    const aboutFilled = sex && age && height && weight;

    return (
      <Card className="mx-auto max-w-md animate-fade-up space-y-4">
        <WizardHeader step="about" onBack={() => setStep("goal")} />
        <div className="space-y-1 text-center">
          <StepIcon icon={IdCard} />
          <h2 className="text-lg font-semibold text-foreground">Sobre ti</h2>
          <p className="text-sm text-muted">
            Esta información nos ayudará a calcular tus calorías objetivo.
          </p>
        </div>

        <div className="space-y-3">
          <FieldRow
            icon={Users}
            label="Sexo"
            value={sex ? (sex === "HOMBRE" ? "Hombre" : "Mujer") : null}
            onClick={() => setSheet("sex")}
          />
          <FieldRow
            icon={Calendar}
            label="Edad"
            value={age ? `${age} años` : null}
            onClick={() => setSheet("age")}
          />
          <FieldRow
            icon={Ruler}
            label="Altura"
            value={height ? `${height} cm` : null}
            onClick={() => setSheet("height")}
          />
          <FieldRow
            icon={Weight}
            label="Peso"
            value={weight ? `${weight} kg` : null}
            onClick={() => setSheet("weight")}
          />
        </div>

        <Button
          variant="primary"
          className="w-full"
          disabled={!aboutFilled}
          onClick={() => setStep("activity")}
        >
          Continuar
        </Button>

        <BottomSheet
          open={sheet !== null}
          onClose={() => setSheet(null)}
          title={sheet ? SHEET_TITLES[sheet] : ""}
          icon={sheet ? SHEET_ICONS[sheet] : undefined}
        >
        {sheet === "sex" && (
          <div className="space-y-2">
            <SheetOption
              icon={Mars}
              label="Hombre"
              selected={sex === "HOMBRE"}
              onClick={() => {
                setSex("HOMBRE");
                setSheet(null);
              }}
            />
            <SheetOption
              icon={Venus}
              label="Mujer"
              selected={sex === "MUJER"}
              onClick={() => {
                setSex("MUJER");
                setSheet(null);
              }}
            />
          </div>
        )}

        {sheet === "age" && (
          <div className="space-y-4">
            <WheelPicker
              min={10}
              max={100}
              value={age ? Number(age) : 25}
              onChange={(v) => setAge(String(v))}
              suffix="años"
            />
            <Button variant="primary" className="w-full" onClick={() => setSheet(null)}>
              Aceptar
            </Button>
          </div>
        )}

        {sheet === "height" && (
          <div className="space-y-4">
            <WheelPicker
              min={100}
              max={230}
              value={height ? Number(height) : 170}
              onChange={(v) => setHeight(String(v))}
              suffix="cm"
            />
            <Button variant="primary" className="w-full" onClick={() => setSheet(null)}>
              Aceptar
            </Button>
          </div>
        )}

        {sheet === "weight" && (
          <div className="space-y-4">
            <WheelPicker
              min={30}
              max={250}
              value={weight ? Number(weight) : 70}
              onChange={(v) => setWeight(String(v))}
              suffix="kg"
            />
            <Button variant="primary" className="w-full" onClick={() => setSheet(null)}>
              Aceptar
            </Button>
          </div>
        )}

        </BottomSheet>
      </Card>
    );
  }

  if (step === "activity") {
    return (
      <Card className="mx-auto max-w-md animate-fade-up space-y-4">
        <WizardHeader step="activity" onBack={() => setStep("about")} />
        <div className="space-y-1 text-center">
          <StepIcon icon={PersonStanding} />
          <h2 className="text-lg font-semibold text-foreground">¿Cuál es tu nivel de actividad?</h2>
        </div>

        <div className="space-y-3">
          {ACTIVITY_LEVELS.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-surface p-4 transition-colors hover:bg-surface-hover has-[:checked]:border-accent has-[:checked]:bg-accent/10 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent"
            >
              <input
                type="radio"
                name="activityLevel"
                value={option.value}
                checked={activityLevel === option.value}
                onChange={() => setActivityLevel(option.value)}
                className="sr-only"
              />
              <ActivityBars filled={option.bars} />
              <span>
                <span className="block text-sm font-medium text-foreground">{option.title}</span>
                <span className="block text-xs text-muted">{option.description}</span>
              </span>
            </label>
          ))}
        </div>

        <Button
          variant="primary"
          className="w-full"
          disabled={!activityLevel}
          onClick={() => setStep("strength")}
        >
          Continuar
        </Button>
      </Card>
    );
  }

  if (step === "strength") {
    return (
      <Card className="mx-auto max-w-md animate-fade-up space-y-4">
        <WizardHeader step="strength" onBack={() => setStep("activity")} />
        <div className="space-y-1 text-center">
          <StepIcon icon={BicepsFlexed} />
          <h2 className="text-lg font-semibold text-foreground">
            ¿Realizas entrenamientos de fuerza?
          </h2>
          <p className="text-sm text-muted">
            Esta información es clave para determinar tu consumo de proteína.
          </p>
        </div>

        <div className="space-y-3">
          {STRENGTH_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-surface p-4 transition-colors hover:bg-surface-hover has-[:checked]:border-accent has-[:checked]:bg-accent/10 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent"
            >
              <input
                type="radio"
                name="strengthTraining"
                value={option.value}
                checked={strengthTraining === option.value}
                onChange={() => setStrengthTraining(option.value)}
                className="sr-only"
              />
              <option.icon className="size-6 text-accent" />
              <span className="text-sm font-medium text-foreground">{option.label}</span>
            </label>
          ))}
        </div>

        <Button
          variant="primary"
          className="w-full"
          disabled={!strengthTraining}
          onClick={() => setStep("diet")}
        >
          Continuar
        </Button>
      </Card>
    );
  }

  if (step === "diet") {
    return (
      <Card className="mx-auto max-w-md animate-fade-up space-y-4">
        <WizardHeader step="diet" onBack={() => setStep("strength")} />
        <div className="space-y-1 text-center">
          <StepIcon icon={Utensils} />
          <h2 className="text-lg font-semibold text-foreground">¿Qué tipo de dieta prefieres?</h2>
        </div>

        <div className="space-y-3">
          {DIET_TYPES.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-surface p-4 transition-colors hover:bg-surface-hover has-[:checked]:border-accent has-[:checked]:bg-accent/10 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent"
            >
              <input
                type="radio"
                name="dietType"
                value={option.value}
                checked={dietType === option.value}
                onChange={() => setDietType(option.value)}
                className="sr-only"
              />
              <option.icon className="mt-0.5 size-5 shrink-0 text-accent" />
              <span>
                <span className="block text-sm font-medium text-foreground">{option.title}</span>
                <span className="block text-xs text-muted">{option.description}</span>
              </span>
            </label>
          ))}
        </div>

        <Button
          variant="primary"
          className="w-full"
          disabled={!dietType}
          onClick={() => setStep("plan")}
        >
          Continuar
        </Button>
      </Card>
    );
  }

  const defaultTargetWeight = weight
    ? goal === "PERDER_GRASA"
      ? Math.max(30, Number(weight) - 5)
      : goal === "GANAR_MUSCULO"
        ? Number(weight) + 3
        : Number(weight)
    : 70;

  const planFilled = weight && targetWeight && speed;

  if (step === "plan") {
    return (
    <Card className="mx-auto max-w-md animate-fade-up space-y-4">
      <WizardHeader step="plan" onBack={() => setStep("diet")} />
      <div className="space-y-1 text-center">
        <StepIcon icon={Pencil} />
        <h2 className="text-lg font-semibold text-foreground">Personaliza tu objetivo</h2>
        <p className="text-sm text-muted">Último paso para conocer tus calorías y macros.</p>
      </div>

      <div className="space-y-3">
        <FieldRow
          icon={Weight}
          label="Peso actual"
          value={weight ? `${weight} kg` : null}
          onClick={() => setSheet("currentWeight")}
        />
        <FieldRow
          icon={Target}
          label="Peso objetivo"
          value={targetWeight ? `${targetWeight} kg` : null}
          onClick={() => setSheet("targetWeight")}
        />
        <FieldRow
          icon={Gauge}
          label="Velocidad"
          value={
            speed ? SPEED_OPTIONS.find((s) => s.value === speed)?.title ?? null : null
          }
          onClick={() => setSheet("speed")}
        />
      </div>

      <form ref={planFormRef} action={submitPlan}>
        <input type="hidden" name="goal" value={goal} />
        <input type="hidden" name="sex" value={sex} />
        <input type="hidden" name="age" value={age} />
        <input type="hidden" name="height" value={height} />
        <input type="hidden" name="weight" value={weight} />
        <input type="hidden" name="activityLevel" value={activityLevel} />
        <input type="hidden" name="strengthTraining" value={strengthTraining} />
        <input type="hidden" name="dietType" value={dietType} />
        <input type="hidden" name="targetWeight" value={targetWeight} />
        <input type="hidden" name="speed" value={speed} />
        <SubmitButton disabled={!planFilled} className="w-full">
          Crear Mi Plan
        </SubmitButton>
      </form>

      <BottomSheet
        open={sheet !== null}
        onClose={() => setSheet(null)}
        title={sheet ? SHEET_TITLES[sheet] : ""}
        icon={sheet ? SHEET_ICONS[sheet] : undefined}
      >
        {sheet === "currentWeight" && (
          <div className="space-y-4">
            <WheelPicker
              min={30}
              max={250}
              value={weight ? Number(weight) : 70}
              onChange={(v) => setWeight(String(v))}
              suffix="kg"
            />
            <Button variant="primary" className="w-full" onClick={() => setSheet(null)}>
              Aceptar
            </Button>
          </div>
        )}

        {sheet === "targetWeight" && (
          <div className="space-y-4">
            <WheelPicker
              min={30}
              max={200}
              value={targetWeight ? Number(targetWeight) : defaultTargetWeight}
              onChange={(v) => setTargetWeight(String(v))}
              suffix="kg"
            />
            <Button variant="primary" className="w-full" onClick={() => setSheet(null)}>
              Aceptar
            </Button>
          </div>
        )}

        {sheet === "speed" && (
          <div className="space-y-4">
            <div className="space-y-2">
              {SPEED_OPTIONS.map((option) => (
                <div key={option.value}>
                  <SheetOption
                    icon={Gauge}
                    label={option.title}
                    selected={speed === option.value}
                    onClick={() => setSpeed(option.value)}
                  />
                  {speed === option.value && (
                    <ul className="mt-1.5 space-y-1.5 rounded-xl bg-accent/5 p-3">
                      {option.bullets.map((bullet) => (
                        <li key={bullet.text} className="flex items-start gap-2 text-xs">
                          {bullet.tone === "good" ? (
                            <CircleCheck className="mt-0.5 size-3.5 shrink-0 text-accent" />
                          ) : (
                            <CircleMinus className="mt-0.5 size-3.5 shrink-0 text-warning" />
                          )}
                          <span className="text-muted">{bullet.text}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
            <Button variant="primary" className="w-full" onClick={() => setSheet(null)}>
              Aceptar
            </Button>
          </div>
        )}
      </BottomSheet>
    </Card>
    );
  }

  const resultWeight = weight ? Number(weight) : 0;
  const resultTargetWeight = targetWeight ? Number(targetWeight) : 0;

  return (
    <div className="mx-auto max-w-md animate-fade-up space-y-5 text-center">
      <div className="flex justify-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <Check className="size-7" />
        </div>
      </div>
      <div className="space-y-3">
        <h1 className="text-xl font-semibold text-foreground">¡Todo listo!</h1>
        <div className="h-px w-full bg-border" />
      </div>

      {resultPage === 0 ? (
        <>
          <div className="space-y-1">
            <div className="mx-auto flex size-6 items-center justify-center rounded-full bg-accent/15 text-xs font-semibold text-accent">
              1
            </div>
            <p className="text-sm text-muted">
              Así se verá <span className="font-semibold text-foreground">tu progreso</span>
            </p>
          </div>

          <Card className="pt-10">
            <WeightProgressChart currentWeight={resultWeight} targetWeight={resultTargetWeight} />
          </Card>

          <div className="flex justify-center gap-1.5">
            <span className="size-1.5 rounded-full bg-foreground" />
            <span className="size-1.5 rounded-full bg-border" />
          </div>

          <Button variant="primary" className="w-full" onClick={() => setResultPage(1)}>
            Siguiente
          </Button>
        </>
      ) : (
        <>
          <div className="space-y-1">
            <div className="mx-auto flex size-6 items-center justify-center rounded-full bg-accent/15 text-xs font-semibold text-accent">
              2
            </div>
            <p className="text-sm text-muted">
              Con este <span className="font-semibold text-foreground">objetivo nutricional</span>
            </p>
          </div>

          <Card className="space-y-4">
            {planState.status === "success" ? (
              <>
                <p className="animate-fade-up text-2xl font-semibold text-foreground">
                  <CalorieNumber value={planState.plan.calories} /> kcal
                </p>
                <div className="animate-fade-up" style={{ animationDelay: "120ms" }}>
                  <CalorieGauge
                    min={planState.plan.calorieRangeMin}
                    target={planState.plan.calories}
                    max={planState.plan.calorieRangeMax}
                  />
                </div>
                <div
                  className="flex animate-fade-up gap-4 pt-2"
                  style={{ animationDelay: "240ms" }}
                >
                  <MacroBar label="Proteínas" grams={planState.plan.proteinG} />
                  <MacroBar label="Carbs" grams={planState.plan.carbsG} />
                  <MacroBar label="Grasas" grams={planState.plan.fatG} />
                </div>
              </>
            ) : planState.status === "error" ? (
              <div className="space-y-3 py-2">
                <p className="text-sm text-danger">{planState.error}</p>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => planFormRef.current?.requestSubmit()}
                >
                  Reintentar
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-6 text-muted">
                <LoaderCircle className="size-6 animate-spin" />
                <p className="text-sm">Calculando tu plan...</p>
              </div>
            )}
          </Card>

          <div className="flex justify-center gap-1.5">
            <span className="size-1.5 rounded-full bg-border" />
            <span className="size-1.5 rounded-full bg-foreground" />
          </div>

          <form action={finishOnboarding}>
            <SubmitButton
              disabled={planState.status !== "success"}
              className="w-full"
            >
              Empezar
            </SubmitButton>
          </form>
        </>
      )}
    </div>
  );
}
