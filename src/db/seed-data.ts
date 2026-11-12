import type { Db } from "./index";
import { availabilityRules } from "./schema";

/** Monday to Friday, 09:00 to 17:00, 30-minute appointments. Only applied to an empty table. */
export async function seedDefaultAvailability(db: Db) {
  const existing = await db.select().from(availabilityRules).limit(1);
  if (existing.length > 0) return;

  await db.insert(availabilityRules).values(
    [1, 2, 3, 4, 5].map((weekday) => ({
      weekday,
      startTime: "09:00",
      endTime: "17:00",
      slotMinutes: 30,
    })),
  );
}
