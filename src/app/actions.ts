"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { availabilityRules, blockedDates } from "@/db/schema";
import {
  checkPassword,
  endAdminSession,
  requireAdmin,
  startAdminSession,
} from "@/lib/admin-auth";
import {
  cancelAppointment,
  createAppointment,
  getAppointmentById,
  getAppointmentByToken,
  rescheduleAppointment,
} from "@/lib/appointments";

export type FormState = { error?: string; success?: string };

const startsAtSchema = z.iso.datetime({ error: "Please choose a time." });

const bookingSchema = z.object({
  patientName: z.string().trim().min(2, "Please enter your full name.").max(100),
  email: z.email("Please enter a valid email address.").max(200),
  phone: z.string().trim().min(6, "Please enter a phone number.").max(30),
  reason: z.string().trim().max(300),
  startsAt: startsAtSchema,
});

function firstError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Please check the form.";
}

/* ---------- Patient ---------- */

export async function bookAppointment(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = bookingSchema.safeParse({
    patientName: formData.get("patientName") ?? "",
    email: formData.get("email") ?? "",
    phone: formData.get("phone") ?? "",
    reason: formData.get("reason") ?? "",
    startsAt: formData.get("startsAt") ?? "",
  });
  if (!parsed.success) return { error: firstError(parsed.error) };

  const result = await createAppointment({
    ...parsed.data,
    startsAt: new Date(parsed.data.startsAt),
  });
  if (!result.ok) return { error: result.error };

  redirect(`/manage/${result.value.manageToken}?status=booked`);
}

export async function rescheduleByToken(
  token: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const startsAt = startsAtSchema.safeParse(formData.get("startsAt") ?? "");
  if (!startsAt.success) return { error: firstError(startsAt.error) };

  const appointment = await getAppointmentByToken(token);
  if (!appointment) return { error: "Appointment not found." };

  const result = await rescheduleAppointment(appointment, new Date(startsAt.data));
  if (!result.ok) return { error: result.error };

  redirect(`/manage/${token}?status=rescheduled`);
}

export async function cancelByToken(token: string): Promise<void> {
  const appointment = await getAppointmentByToken(token);
  if (appointment) await cancelAppointment(appointment);
  redirect(`/manage/${token}?status=cancelled`);
}

/* ---------- Admin ---------- */

export async function login(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const password = String(formData.get("password") ?? "");
  if (!checkPassword(password)) return { error: "Incorrect password." };
  await startAdminSession();
  redirect("/admin");
}

export async function logout(): Promise<void> {
  await endAdminSession();
  redirect("/admin/login");
}

export async function adminCancel(formData: FormData): Promise<void> {
  await requireAdmin();
  const appointment = await getAppointmentById(String(formData.get("id") ?? ""));
  if (appointment) await cancelAppointment(appointment);
  refresh();
}

export async function adminReschedule(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const startsAt = startsAtSchema.safeParse(formData.get("startsAt") ?? "");
  if (!startsAt.success) return { error: firstError(startsAt.error) };

  const appointment = await getAppointmentById(id);
  if (!appointment) return { error: "Appointment not found." };

  const result = await rescheduleAppointment(appointment, new Date(startsAt.data));
  if (!result.ok) return { error: result.error };

  redirect("/admin");
}

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

export async function saveAvailability(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const slotMinutes = z.coerce
    .number()
    .int()
    .min(5)
    .max(240)
    .safeParse(formData.get("slotMinutes"));
  if (!slotMinutes.success) return { error: "Choose an appointment length." };

  const rules: (typeof availabilityRules.$inferInsert)[] = [];
  for (let weekday = 0; weekday < 7; weekday++) {
    if (formData.get(`enabled-${weekday}`) !== "on") continue;
    const start = timeSchema.safeParse(formData.get(`start-${weekday}`));
    const end = timeSchema.safeParse(formData.get(`end-${weekday}`));
    if (!start.success || !end.success || start.data >= end.data) {
      return { error: "Each open day needs a start time before its end time." };
    }
    rules.push({
      weekday,
      startTime: start.data,
      endTime: end.data,
      slotMinutes: slotMinutes.data,
    });
  }

  const db = await getDb();
  await db.delete(availabilityRules);
  if (rules.length > 0) await db.insert(availabilityRules).values(rules);

  refresh();
  return { success: "Opening hours saved." };
}

export async function addBlockedDate(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = z
    .object({
      date: z.iso.date("Choose a date."),
      reason: z.string().trim().max(100),
    })
    .safeParse({
      date: formData.get("date") ?? "",
      reason: formData.get("reason") ?? "",
    });
  if (!parsed.success) return { error: firstError(parsed.error) };

  const db = await getDb();
  await db.insert(blockedDates).values(parsed.data).onConflictDoNothing();
  refresh();
  return { success: "Day off added." };
}

export async function removeBlockedDate(formData: FormData): Promise<void> {
  await requireAdmin();
  const db = await getDb();
  await db
    .delete(blockedDates)
    .where(eq(blockedDates.date, String(formData.get("date") ?? "")));
  refresh();
}
