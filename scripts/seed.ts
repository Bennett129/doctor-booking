/**
 * Adds default opening hours and a few sample appointments.
 * Stop the dev server first when using the local PGlite database:
 * it can only be opened by one process at a time.
 */
import { randomBytes } from "node:crypto";
import { getDb } from "../src/db";
import { appointments } from "../src/db/schema";
import { seedDefaultAvailability } from "../src/db/seed-data";
import { addDays, dateInZone, weekdayOf, zonedTimeToUtc } from "../src/lib/slots";

const timeZone = process.env.CLINIC_TIMEZONE || "Europe/London";

const samples = [
  { patientName: "Priya Nair", email: "priya@example.com", phone: "07700 900101", reason: "Repeat prescription review", time: "09:30" },
  { patientName: "Tom Okafor", email: "tom@example.com", phone: "07700 900102", reason: "Knee pain", time: "11:00" },
  { patientName: "Elena Rossi", email: "elena@example.com", phone: "07700 900103", reason: "", time: "14:30" },
];

async function main() {
  const db = await getDb();
  await seedDefaultAvailability(db);

  // Next weekday from tomorrow
  let date = addDays(dateInZone(new Date(), timeZone), 1);
  while ([0, 6].includes(weekdayOf(date))) date = addDays(date, 1);

  for (const sample of samples) {
    const startsAt = zonedTimeToUtc(date, sample.time, timeZone);
    await db
      .insert(appointments)
      .values({
        patientName: sample.patientName,
        email: sample.email,
        phone: sample.phone,
        reason: sample.reason,
        startsAt,
        endsAt: new Date(startsAt.getTime() + 30 * 60_000),
        manageToken: randomBytes(24).toString("base64url"),
      })
      .onConflictDoNothing();
  }

  console.log(`Seeded opening hours and ${samples.length} sample appointments on ${date}.`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
