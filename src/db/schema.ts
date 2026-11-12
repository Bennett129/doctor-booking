import { sql } from "drizzle-orm";
import {
  date,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/** Weekly opening hours. weekday: 0 = Sunday … 6 = Saturday. Times are "HH:MM" in clinic time. */
export const availabilityRules = pgTable("availability_rules", {
  id: serial("id").primaryKey(),
  weekday: integer("weekday").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  slotMinutes: integer("slot_minutes").notNull().default(30),
});

/** Whole days the clinic is closed (holidays, leave). */
export const blockedDates = pgTable("blocked_dates", {
  date: date("date", { mode: "string" }).primaryKey(),
  reason: text("reason").notNull().default(""),
});

export const appointments = pgTable(
  "appointments",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    patientName: text("patient_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    reason: text("reason").notNull().default(""),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    status: text("status", { enum: ["confirmed", "cancelled"] })
      .notNull()
      .default("confirmed"),
    manageToken: text("manage_token").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    // The database itself rejects a second confirmed booking for the same start time,
    // so two people racing for one slot cannot both win.
    uniqueIndex("appointments_confirmed_slot")
      .on(t.startsAt)
      .where(sql`${t.status} = 'confirmed'`),
  ],
);

export type Appointment = typeof appointments.$inferSelect;
export type AvailabilityRule = typeof availabilityRules.$inferSelect;
