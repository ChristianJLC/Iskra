export type CalendarDate = { year: number; month: number; day: number };

function getOffsetMinutes(timezone: string, date: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = Object.fromEntries(dtf.formatToParts(date).map((p) => [p.type, p.value]));
  const asUTC = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );
  return (asUTC - date.getTime()) / 60000;
}

export function getZonedCalendarDate(timezone: string, reference: Date = new Date()): CalendarDate {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(reference);
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return { year: Number(map.year), month: Number(map.month), day: Number(map.day) };
}

export function calendarDateToUtc(timezone: string, cal: CalendarDate): Date {
  const utcGuess = new Date(Date.UTC(cal.year, cal.month - 1, cal.day));
  const offset = getOffsetMinutes(timezone, utcGuess);
  return new Date(utcGuess.getTime() - offset * 60000);
}

export function addCalendarDays(cal: CalendarDate, days: number): CalendarDate {
  const d = new Date(Date.UTC(cal.year, cal.month - 1, cal.day + days));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

export function compareCalendarDates(a: CalendarDate, b: CalendarDate): number {
  return Date.UTC(a.year, a.month - 1, a.day) - Date.UTC(b.year, b.month - 1, b.day);
}

/** 0 = domingo, igual que Date.prototype.getDay() */
export function getCalendarWeekday(cal: CalendarDate): number {
  return new Date(Date.UTC(cal.year, cal.month - 1, cal.day)).getUTCDay();
}

export function startOfToday(timezone: string): Date {
  return calendarDateToUtc(timezone, getZonedCalendarDate(timezone));
}

export function endOfToday(timezone: string): Date {
  return new Date(startOfToday(timezone).getTime() + 24 * 60 * 60 * 1000);
}

export function formatDateEs(date: Date, timezone: string) {
  const formatted = new Intl.DateTimeFormat("es", {
    timeZone: timezone,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function formatShortDateEs(date: Date, timezone: string) {
  return new Intl.DateTimeFormat("es", {
    timeZone: timezone,
    day: "2-digit",
    month: "short",
  }).format(date);
}

export function formatMonthYearEs(month: number, year: number) {
  const formatted = new Intl.DateTimeFormat("es", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1));
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function getMonthBounds(timezone: string, month: number, year: number) {
  const start = calendarDateToUtc(timezone, { year, month, day: 1 });
  const nextMonth: CalendarDate = month === 12 ? { year: year + 1, month: 1, day: 1 } : { year, month: month + 1, day: 1 };
  const end = calendarDateToUtc(timezone, nextMonth);
  return { start, end };
}

export function daysInMonth(month: number, year: number) {
  return new Date(year, month, 0).getDate();
}

const WEEKDAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

export type WeekdayKey = (typeof WEEKDAY_KEYS)[number];

export function getWeekdayKey(cal: CalendarDate): WeekdayKey {
  return WEEKDAY_KEYS[getCalendarWeekday(cal)];
}

export function getWeekBounds(timezone: string, reference: Date = new Date()) {
  const cal = getZonedCalendarDate(timezone, reference);
  const weekday = getCalendarWeekday(cal);
  const diffToMonday = weekday === 0 ? -6 : 1 - weekday;
  const startCal = addCalendarDays(cal, diffToMonday);
  const endCal = addCalendarDays(startCal, 7);
  return { start: calendarDateToUtc(timezone, startCal), end: calendarDateToUtc(timezone, endCal) };
}

export function getYearBounds(timezone: string, year: number) {
  const start = calendarDateToUtc(timezone, { year, month: 1, day: 1 });
  const end = calendarDateToUtc(timezone, { year: year + 1, month: 1, day: 1 });
  return { start, end };
}

export function daysInYear(year: number) {
  return Math.round((getYearBounds("UTC", year).end.getTime() - getYearBounds("UTC", year).start.getTime()) / 86400000);
}
