import "server-only";
import { randomBytes } from "node:crypto";
import { and, asc, eq, gte, lt, ne } from "drizzle-orm";
import { getDb, isUniqueViolation } from "@/db";
import {
  appointments,
  availabilityRules,
  blockedDates,
  type Appointment,
} from "@/db/schema";
import {
  AppointmentEmail,
  emailSubject,
  type EmailKind,
} from "@/emails/appointment-email";
import { BOOKING_WINDOW_DAYS, CLINIC_TZ, appUrl, formatWhen } from "./clinic";
import { sendEmail } from "./email";
import {
  addDays,
  dateInZone,
  generateSlots,
  zonedTimeToUtc,
  type Interval,
} from "./slots";

export type Result<T = undefined> =
  | { ok: true; value: T }
  | { ok: false; error: string };

const SLOT_TAKEN = "Sorry, that time has just been taken. Please pick another.";
const SLOT_UNAVAILABLE = "That time is no longer available. Please pick another.";

export async function getScheduleConfig() {
  const db = await getDb();
  const [rules, blocked] = await Promise.all([
    db.select().from(availabilityRules).orderBy(asc(availabilityRules.weekday)),
    db.select().from(blockedDates).orderBy(asc(blockedDates.date)),
  ]);
  return { rules, blocked };
}

/** Open slots for one clinic day ("YYYY-MM-DD"). */
export async function getOpenSlots(
  date: string,
  options: { ignoreAppointmentId?: string } = {},
): Promise<Interval[]> {
  const now = new Date();
  const today = dateInZone(now, CLINIC_TZ);
  if (date < today || date > addDays(today, BOOKING_WINDOW_DAYS)) return [];

  const db = await getDb();
  const dayStart = zonedTimeToUtc(date, "00:00", CLINIC_TZ);
  const dayEnd = zonedTimeToUtc(addDays(date, 1), "00:00", CLINIC_TZ);

  const [{ rules, blocked }, booked] = await Promise.all([
    getScheduleConfig(),
    db
      .select({
        id: appointments.id,
        startsAt: appointments.startsAt,
        endsAt: appointments.endsAt,
      })
      .from(appointments)
      .where(
        and(
          eq(appointments.status, "confirmed"),
          gte(appointments.endsAt, dayStart),
          lt(appointments.startsAt, dayEnd),
          options.ignoreAppointmentId
            ? ne(appointments.id, options.ignoreAppointmentId)
            : undefined,
        ),
      ),
  ]);

  return generateSlots({
    date,
    rules,
    blockedDates: blocked.map((b) => b.date),
    booked,
    now,
    timeZone: CLINIC_TZ,
  });
}

async function findOpenSlot(
  startsAt: Date,
  ignoreAppointmentId?: string,
): Promise<Interval | undefined> {
  const slots = await getOpenSlots(dateInZone(startsAt, CLINIC_TZ), {
    ignoreAppointmentId,
  });
  return slots.find((s) => s.startsAt.getTime() === startsAt.getTime());
}

export async function createAppointment(input: {
  patientName: string;
  email: string;
  phone: string;
  reason: string;
  startsAt: Date;
}): Promise<Result<Appointment>> {
  const slot = await findOpenSlot(input.startsAt);
  if (!slot) return { ok: false, error: SLOT_UNAVAILABLE };

  const db = await getDb();
  try {
    const [created] = await db
      .insert(appointments)
      .values({
        patientName: input.patientName,
        email: input.email,
        phone: input.phone,
        reason: input.reason,
        startsAt: slot.startsAt,
        endsAt: slot.endsAt,
        manageToken: randomBytes(24).toString("base64url"),
      })
      .returning();
    await notify("booked", created);
    return { ok: true, value: created };
  } catch (error) {
    if (isUniqueViolation(error)) return { ok: false, error: SLOT_TAKEN };
    throw error;
  }
}

export async function rescheduleAppointment(
  appointment: Appointment,
  startsAt: Date,
): Promise<Result<Appointment>> {
  if (appointment.status !== "confirmed") {
    return { ok: false, error: "This appointment has been cancelled." };
  }
  const slot = await findOpenSlot(startsAt, appointment.id);
  if (!slot) return { ok: false, error: SLOT_UNAVAILABLE };

  const db = await getDb();
  try {
    const [updated] = await db
      .update(appointments)
      .set({ startsAt: slot.startsAt, endsAt: slot.endsAt })
      .where(
        and(
          eq(appointments.id, appointment.id),
          eq(appointments.status, "confirmed"),
        ),
      )
      .returning();
    if (!updated) {
      return { ok: false, error: "This appointment has been cancelled." };
    }
    await notify("rescheduled", updated, appointment.startsAt);
    return { ok: true, value: updated };
  } catch (error) {
    if (isUniqueViolation(error)) return { ok: false, error: SLOT_TAKEN };
    throw error;
  }
}

export async function cancelAppointment(
  appointment: Appointment,
): Promise<Result> {
  const db = await getDb();
  const [updated] = await db
    .update(appointments)
    .set({ status: "cancelled" })
    .where(
      and(
        eq(appointments.id, appointment.id),
        eq(appointments.status, "confirmed"),
      ),
    )
    .returning();
  if (!updated) return { ok: false, error: "Already cancelled." };
  await notify("cancelled", updated);
  return { ok: true, value: undefined };
}

export async function getAppointmentByToken(token: string) {
  const db = await getDb();
  const [row] = await db
    .select()
    .from(appointments)
    .where(eq(appointments.manageToken, token))
    .limit(1);
  return row as Appointment | undefined;
}

export async function getAppointmentById(id: string) {
  const db = await getDb();
  const [row] = await db
    .select()
    .from(appointments)
    .where(eq(appointments.id, id))
    .limit(1);
  return row as Appointment | undefined;
}

export async function listUpcomingAppointments(): Promise<Appointment[]> {
  const db = await getDb();
  return db
    .select()
    .from(appointments)
    .where(
      and(
        eq(appointments.status, "confirmed"),
        gte(appointments.endsAt, new Date()),
      ),
    )
    .orderBy(asc(appointments.startsAt));
}

/** Emails the patient and the doctor. A mail failure never undoes the booking change. */
async function notify(
  kind: EmailKind,
  appointment: Appointment,
  previousStartsAt?: Date,
) {
  const when = formatWhen(appointment.startsAt);
  const shared = {
    kind,
    patientName: appointment.patientName,
    patientEmail: appointment.email,
    patientPhone: appointment.phone,
    reason: appointment.reason,
    when,
    previousWhen: previousStartsAt ? formatWhen(previousStartsAt) : undefined,
    manageUrl: appUrl(`/manage/${appointment.manageToken}`),
  };
  const doctorEmail = process.env.DOCTOR_EMAIL || "doctor@example.com";

  const results = await Promise.allSettled([
    sendEmail({
      to: appointment.email,
      subject: emailSubject(kind, when, "patient", appointment.patientName),
      react: AppointmentEmail({ ...shared, audience: "patient" }),
    }),
    sendEmail({
      to: doctorEmail,
      subject: emailSubject(kind, when, "doctor", appointment.patientName),
      react: AppointmentEmail({ ...shared, audience: "doctor" }),
    }),
  ]);
  for (const result of results) {
    if (result.status === "rejected") {
      console.error("Failed to send appointment email:", result.reason);
    }
  }
}
