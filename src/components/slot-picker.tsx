"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import type { PickerConfig } from "@/lib/picker-config";

type Slot = { startsAt: string; label: string };

function toYmd(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function fromYmd(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Date + time picker. Submits the chosen slot as a hidden `startsAt` field,
 * so it can be dropped into any <form>.
 */
export function SlotPicker({ config }: { config: PickerConfig }) {
  const [date, setDate] = useState<Date | undefined>();
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [startsAt, setStartsAt] = useState("");

  async function selectDate(next: Date | undefined) {
    setDate(next);
    setStartsAt("");
    setSlots(null);
    setLoadError(false);
    if (!next) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/slots?date=${toYmd(next)}`);
      if (!response.ok) throw new Error("Failed to load slots");
      const data: { slots: Slot[] } = await response.json();
      setSlots(data.slots);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-[auto_1fr]">
      <input type="hidden" name="startsAt" value={startsAt} />

      <Calendar
        mode="single"
        selected={date}
        onSelect={selectDate}
        startMonth={fromYmd(config.today)}
        endMonth={fromYmd(config.maxDate)}
        disabled={[
          { before: fromYmd(config.today) },
          { after: fromYmd(config.maxDate) },
          (day: Date) =>
            !config.openWeekdays.includes(day.getDay()) ||
            config.blockedDates.includes(toYmd(day)),
        ]}
        className="rounded-lg border [--cell-size:--spacing(9)]"
      />

      <div className="min-w-0">
        <p className="text-sm font-medium">
          {date
            ? date.toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })
            : "Choose a day"}
        </p>
        <p className="mb-3 text-xs text-muted-foreground">
          Times are shown in clinic time ({config.timeZone}).
        </p>

        {!date && (
          <p className="text-sm text-muted-foreground">
            Pick a date to see the available times.
          </p>
        )}
        {loading && (
          <p className="text-sm text-muted-foreground">Loading times…</p>
        )}
        {loadError && (
          <p className="text-sm text-destructive">
            Could not load times. Please pick the date again.
          </p>
        )}
        {slots && slots.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No times left on this day. Please try another.
          </p>
        )}
        {slots && slots.length > 0 && (
          <div
            role="radiogroup"
            aria-label="Available times"
            className="grid grid-cols-3 gap-2 sm:grid-cols-4"
          >
            {slots.map((slot) => {
              const selected = slot.startsAt === startsAt;
              return (
                <button
                  key={slot.startsAt}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setStartsAt(slot.startsAt)}
                  className={cn(
                    "rounded-md border px-2 py-2 text-sm font-medium tabular-nums transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "bg-background hover:border-primary hover:bg-accent",
                  )}
                >
                  {slot.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
