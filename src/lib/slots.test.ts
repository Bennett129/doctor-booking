import { describe, expect, it } from "vitest";
import {
  addDays,
  dateInZone,
  generateSlots,
  weekdayOf,
  zonedTimeToUtc,
} from "./slots";

const tz = "Europe/London";
const monday = "2026-06-01"; // BST, UTC+1
const rules = [
  { weekday: 1, startTime: "09:00", endTime: "11:00", slotMinutes: 30 },
];
const longAgo = new Date("2026-01-01T00:00:00Z");

const starts = (slots: { startsAt: Date }[]) =>
  slots.map((s) => s.startsAt.toISOString());

describe("date helpers", () => {
  it("converts clinic wall time to UTC, respecting daylight saving", () => {
    expect(zonedTimeToUtc("2026-06-01", "09:00", tz).toISOString()).toBe(
      "2026-06-01T08:00:00.000Z",
    );
    expect(zonedTimeToUtc("2026-12-01", "09:00", tz).toISOString()).toBe(
      "2026-12-01T09:00:00.000Z",
    );
  });

  it("finds the weekday and clinic date", () => {
    expect(weekdayOf(monday)).toBe(1);
    expect(dateInZone(new Date("2026-06-01T23:30:00Z"), tz)).toBe("2026-06-02");
    expect(addDays("2026-02-28", 1)).toBe("2026-03-01");
  });
});

describe("generateSlots", () => {
  const base = { date: monday, rules, blockedDates: [], booked: [], now: longAgo, timeZone: tz };

  it("cuts opening hours into slots", () => {
    expect(starts(generateSlots(base))).toEqual([
      "2026-06-01T08:00:00.000Z",
      "2026-06-01T08:30:00.000Z",
      "2026-06-01T09:00:00.000Z",
      "2026-06-01T09:30:00.000Z",
    ]);
  });

  it("returns nothing on a day with no rule", () => {
    expect(generateSlots({ ...base, date: "2026-06-02" })).toEqual([]);
  });

  it("returns nothing on a blocked date", () => {
    expect(generateSlots({ ...base, blockedDates: [monday] })).toEqual([]);
  });

  it("drops slots overlapping an existing appointment", () => {
    const booked = [
      {
        startsAt: new Date("2026-06-01T08:30:00Z"),
        endsAt: new Date("2026-06-01T09:00:00Z"),
      },
    ];
    expect(starts(generateSlots({ ...base, booked }))).toEqual([
      "2026-06-01T08:00:00.000Z",
      "2026-06-01T09:00:00.000Z",
      "2026-06-01T09:30:00.000Z",
    ]);
  });

  it("drops slots that have already started", () => {
    const now = new Date("2026-06-01T09:00:00Z");
    expect(starts(generateSlots({ ...base, now }))).toEqual([
      "2026-06-01T09:30:00.000Z",
    ]);
  });

  it("does not offer a slot that would run past closing time", () => {
    const odd = [
      { weekday: 1, startTime: "09:00", endTime: "10:15", slotMinutes: 30 },
    ];
    expect(generateSlots({ ...base, rules: odd })).toHaveLength(2);
  });
});
