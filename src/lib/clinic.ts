export const CLINIC = {
  name: "Riverside Family Practice",
  doctor: "Dr. Alex Morgan",
  address: "14 Riverside Walk, Kingsbridge",
  phone: "01632 960 114",
};

export const CLINIC_TZ = process.env.CLINIC_TIMEZONE || "Europe/London";

/** How far ahead patients can book. */
export const BOOKING_WINDOW_DAYS = 60;

export const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function appUrl(pathname = ""): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return base.replace(/\/$/, "") + pathname;
}

/** "Monday 1 June 2026 at 09:30" in clinic time. */
export function formatWhen(instant: Date): string {
  const day = new Intl.DateTimeFormat("en-GB", {
    timeZone: CLINIC_TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(instant);
  return `${day} at ${formatTime(instant)}`;
}

/** "09:30" in clinic time. */
export function formatTime(instant: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: CLINIC_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(instant);
}
