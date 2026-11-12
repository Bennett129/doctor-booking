import "server-only";
import { getScheduleConfig } from "./appointments";
import { BOOKING_WINDOW_DAYS, CLINIC_TZ } from "./clinic";
import { addDays, dateInZone } from "./slots";

export type PickerConfig = {
  openWeekdays: number[];
  blockedDates: string[];
  today: string;
  maxDate: string;
  timeZone: string;
};

/** What the date picker needs to grey out days that can never be booked. */
export async function getPickerConfig(): Promise<PickerConfig> {
  const { rules, blocked } = await getScheduleConfig();
  const today = dateInZone(new Date(), CLINIC_TZ);
  return {
    openWeekdays: [...new Set(rules.map((r) => r.weekday))],
    blockedDates: blocked.map((b) => b.date),
    today,
    maxDate: addDays(today, BOOKING_WINDOW_DAYS),
    timeZone: CLINIC_TZ,
  };
}
