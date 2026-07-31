export function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function endOfToday() {
  const start = startOfToday();
  return new Date(start.getTime() + 24 * 60 * 60 * 1000);
}

export function formatDateEs(date: Date) {
  const formatted = new Intl.DateTimeFormat("es", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function nextRecurrenceDate(
  base: Date | null,
  recurrence: "DIARIA" | "SEMANAL" | "MENSUAL"
) {
  const from = base ?? startOfToday();

  if (recurrence === "DIARIA") {
    return new Date(from.getFullYear(), from.getMonth(), from.getDate() + 1);
  }
  if (recurrence === "SEMANAL") {
    return new Date(from.getFullYear(), from.getMonth(), from.getDate() + 7);
  }
  return new Date(from.getFullYear(), from.getMonth() + 1, from.getDate());
}

export function formatShortDateEs(date: Date) {
  return new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "short",
  }).format(date);
}
