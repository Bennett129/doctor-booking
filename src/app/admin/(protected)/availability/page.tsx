import type { Metadata } from "next";
import { Suspense } from "react";
import { removeBlockedDate } from "@/app/actions";
import { AvailabilityForm, BlockedDateForm } from "@/components/forms";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/admin-auth";
import { getScheduleConfig } from "@/lib/appointments";
import { CLINIC_TZ, WEEKDAYS } from "@/lib/clinic";
import { dateInZone } from "@/lib/slots";

export const metadata: Metadata = { title: "Availability" };

export default function AvailabilityPage() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Availability</h1>
      <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>
        <Availability />
      </Suspense>
    </>
  );
}

// Monday first, Sunday last
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

async function Availability() {
  await requireAdmin();
  const { rules, blocked } = await getScheduleConfig();
  const today = dateInZone(new Date(), CLINIC_TZ);

  const days = DAY_ORDER.map((weekday) => {
    const rule = rules.find((r) => r.weekday === weekday);
    return {
      weekday,
      name: WEEKDAYS[weekday],
      enabled: Boolean(rule),
      start: rule?.startTime ?? "09:00",
      end: rule?.endTime ?? "17:00",
    };
  });
  const upcomingBlocked = blocked.filter((b) => b.date >= today);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Weekly opening hours</CardTitle>
          <CardDescription>
            Clinic time ({CLINIC_TZ}). Existing bookings are not changed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AvailabilityForm
            days={days}
            slotMinutes={rules[0]?.slotMinutes ?? 30}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Days off</CardTitle>
          <CardDescription>
            Holidays and leave. No appointments can be booked on these dates.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <BlockedDateForm minDate={today} />
          {upcomingBlocked.length === 0 ? (
            <p className="text-sm text-muted-foreground">No days off planned.</p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {upcomingBlocked.map((entry) => (
                <li
                  key={entry.date}
                  className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                >
                  <span>
                    <span className="font-medium">
                      {new Date(`${entry.date}T00:00:00Z`).toLocaleDateString("en-GB", {
                        timeZone: "UTC",
                        weekday: "short",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                    {entry.reason && (
                      <span className="text-muted-foreground"> · {entry.reason}</span>
                    )}
                  </span>
                  <form action={removeBlockedDate}>
                    <input type="hidden" name="date" value={entry.date} />
                    <Button type="submit" variant="ghost" size="sm">
                      Remove
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
