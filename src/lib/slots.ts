import { TZDate } from "@date-fns/tz";

export type Rule = {
  weekday: number;
  startTime: string;
  endTime: string;
  slotMinutes: number;
};

export type Interval = { startsAt: Date; endsAt: Date };

/** The instant at which the wall clock in `timeZone` reads `date` ("YYYY-MM-DD") `time` ("HH:MM"). */
export function zonedTimeToUtc(
  date: string,
  time: string,
  timeZone: string,
): Date {
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);
  return new Date(
    new TZDate(year, month - 1, day, hours, minutes, 0, timeZone).getTime(),
  );
}

/** Day of week for a calendar date, 0 = Sunday. Independent of any timezone. */
export function weekdayOf(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

/** The calendar date ("YYYY-MM-DD") that `instant` falls on in `timeZone`. */
export function dateInZone(instant: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
}

export function addDays(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days))
    .toISOString()
    .slice(0, 10);
}

/**
 * Bookable slots for one clinic day: opening hours cut into slots, minus
 * closed days, slots that have already started, and slots overlapping an
 * existing appointment.
 */
export function generateSlots(input: {
  date: string;
  rules: Rule[];
  blockedDates: string[];
  booked: Interval[];
  now: Date;
  timeZone: string;
}): Interval[] {
  const { date, rules, blockedDates, booked, now, timeZone } = input;
  if (blockedDates.includes(date)) return [];

  const weekday = weekdayOf(date);
  const slots: Interval[] = [];

  for (const rule of rules) {
    if (rule.weekday !== weekday || rule.slotMinutes <= 0) continue;

    const step = rule.slotMinutes * 60_000;
    const close = zonedTimeToUtc(date, rule.endTime, timeZone).getTime();
    let start = zonedTimeToUtc(date, rule.startTime, timeZone).getTime();

    for (; start + step <= close; start += step) {
      const end = start + step;
      if (start <= now.getTime()) continue;
      const taken = booked.some(
        (b) => start < b.endsAt.getTime() && end > b.startsAt.getTime(),
      );
      if (taken) continue;
      slots.push({ startsAt: new Date(start), endsAt: new Date(end) });
    }
  }

  return slots.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}
