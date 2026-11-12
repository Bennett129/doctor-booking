"use client";

import { useActionState } from "react";
import {
  addBlockedDate,
  adminReschedule,
  bookAppointment,
  login,
  rescheduleByToken,
  saveAvailability,
  type FormState,
} from "@/app/actions";
import { SlotPicker } from "@/components/slot-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { PickerConfig } from "@/lib/picker-config";

const empty: FormState = {};

function Feedback({ state }: { state: FormState }) {
  if (state.error) {
    return (
      <p role="alert" className="text-sm text-destructive">
        {state.error}
      </p>
    );
  }
  if (state.success) {
    return (
      <p role="status" className="text-sm text-primary">
        {state.success}
      </p>
    );
  }
  return null;
}

function FieldError({ state, field }: { state: FormState; field: string }) {
  if (state.field !== field || !state.error) return null;
  return (
    <p id={`${field}-error`} className="text-sm text-destructive">
      {state.error}
    </p>
  );
}

export function BookingForm({ config }: { config: PickerConfig }) {
  const [state, action, pending] = useActionState(bookAppointment, empty);

  // React clears a form after its action runs. The server sends back what was
  // submitted, and using it as each field's default puts the text back.
  const value = (name: string) => state.values?.[name] ?? "";
  const invalid = (name: string) =>
    state.field === name
      ? { "aria-invalid": true, "aria-describedby": `${name}-error` }
      : {};
  const fieldError = Boolean(
    state.field && ["patientName", "email", "phone", "reason"].includes(state.field),
  );

  return (
    <form action={action} className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">1. Choose a time</h2>
        <SlotPicker config={config} />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">2. Your details</h2>
        <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          This is a demo site. Please do not enter real medical information.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="patientName">Full name</Label>
            <Input
              id="patientName"
              name="patientName"
              autoComplete="name"
              required
              minLength={2}
              maxLength={100}
              defaultValue={value("patientName")}
              {...invalid("patientName")}
            />
            <FieldError state={state} field="patientName" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={200}
              defaultValue={value("email")}
              {...invalid("email")}
            />
            <FieldError state={state} field="email" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              required
              // Checked in the browser before sending; the server checks again.
              pattern={"\\+?[0-9 \\(\\)\\-]{7,20}"}
              title="A phone number, e.g. 07700 900123"
              defaultValue={value("phone")}
              {...invalid("phone")}
            />
            <FieldError state={state} field="phone" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="reason">Reason for visit (optional)</Label>
            <Textarea
              id="reason"
              name="reason"
              rows={3}
              maxLength={300}
              defaultValue={value("reason")}
            />
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Booking…" : "Confirm appointment"}
        </Button>
        {/* Field problems are shown next to the field; anything else (no time chosen, slot taken) here. */}
        {!fieldError && <Feedback state={state} />}
      </div>
    </form>
  );
}

export function RescheduleForm({
  config,
  token,
  appointmentId,
}: {
  config: PickerConfig;
  /** Patient reschedule: the manage token. */
  token?: string;
  /** Admin reschedule: the appointment id. */
  appointmentId?: string;
}) {
  const serverAction = token
    ? rescheduleByToken.bind(null, token)
    : adminReschedule.bind(null, appointmentId ?? "");
  const [state, action, pending] = useActionState(serverAction, empty);

  return (
    <form action={action} className="space-y-4">
      <SlotPicker config={config} />
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Move appointment"}
        </Button>
        <Feedback state={state} />
      </div>
    </form>
  );
}

export function LoginForm() {
  const [state, action, pending] = useActionState(login, empty);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
      <Feedback state={state} />
    </form>
  );
}

const selectClass =
  "h-8 rounded-lg border border-input bg-background px-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

export function AvailabilityForm({
  days,
  slotMinutes,
}: {
  days: { weekday: number; name: string; enabled: boolean; start: string; end: string }[];
  slotMinutes: number;
}) {
  const [state, action, pending] = useActionState(saveAvailability, empty);

  return (
    <form action={action} className="space-y-5">
      <div className="space-y-2">
        {days.map((day) => (
          <div
            key={day.weekday}
            className="grid grid-cols-[1fr_auto_auto] items-center gap-3 sm:grid-cols-[10rem_auto_auto_1fr]"
          >
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                name={`enabled-${day.weekday}`}
                defaultChecked={day.enabled}
                className="size-4 accent-primary"
              />
              {day.name}
            </label>
            <Input
              type="time"
              name={`start-${day.weekday}`}
              defaultValue={day.start}
              aria-label={`${day.name} opening time`}
              className="w-28"
            />
            <Input
              type="time"
              name={`end-${day.weekday}`}
              defaultValue={day.end}
              aria-label={`${day.name} closing time`}
              className="w-28"
            />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Label htmlFor="slotMinutes">Appointment length</Label>
        <select
          id="slotMinutes"
          name="slotMinutes"
          defaultValue={slotMinutes}
          className={selectClass}
        >
          {[10, 15, 20, 30, 45, 60].map((minutes) => (
            <option key={minutes} value={minutes}>
              {minutes} minutes
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save opening hours"}
        </Button>
        <Feedback state={state} />
      </div>
    </form>
  );
}

export function BlockedDateForm({ minDate }: { minDate: string }) {
  const [state, action, pending] = useActionState(addBlockedDate, empty);

  return (
    <form action={action} className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="blocked-date">Date</Label>
          <Input id="blocked-date" name="date" type="date" min={minDate} required />
        </div>
        <div className="min-w-40 flex-1 space-y-1.5">
          <Label htmlFor="blocked-reason">Reason (optional)</Label>
          <Input id="blocked-reason" name="reason" maxLength={100} placeholder="Public holiday" />
        </div>
        <Button type="submit" variant="outline" disabled={pending}>
          Add day off
        </Button>
      </div>
      <Feedback state={state} />
    </form>
  );
}

/** Submit button that asks for confirmation before a destructive action. */
export function ConfirmSubmit({
  message,
  children,
}: {
  message: string;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="submit"
      variant="destructive"
      size="sm"
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      {children}
    </Button>
  );
}
